// app/api/join-class/route.ts
//
// Único lugar donde se verifican las credenciales de un alumno "con código".
// Corre en el servidor con Firebase Admin (bypassa las reglas de Firestore
// a propósito: necesita poder leer las credenciales de CUALQUIER alumno de
// CUALQUIER clase para validar el login, algo que el cliente nunca podría
// hacer con permisos normales).
//
// La pieza clave: el uid del alumno es SIEMPRE el id de su documento en
// `estudiantesPendientes` — estable, no cambia entre logins. Por eso,
// entrar de nuevo (otro día, otro dispositivo) da la misma identidad y el
// mismo progreso guardado, en vez de crear un alumno nuevo cada vez.
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { encryptPassword, isEncrypted, loadKey, passwordsMatch, readStoredPassword } from '@/lib/passwordCrypto';
import { clearRules, findBlocked, recordFailure } from '@/lib/rateLimit';
import { createFirestoreStore } from '@/lib/rateLimitStore';
import { checkRules, failureRules, successRules } from '@/lib/joinClassLimits';

// Freno contra fuerza bruta: intentos fallidos contados en Firestore (los
// comparten todas las instancias del hosting y sobreviven a los arranques en
// frío). Qué se cuenta y con qué topes: lib/joinClassLimits.ts.
//
// Si el almacén de contadores falla, se DEJA PASAR (y se registra el error):
// es preferible que un alumno pueda entrar a que una falla de esa colección
// bloquee a todos. Firestore igual es necesario para validar la contraseña.
const limiterStore = createFirestoreStore();

async function safely<T>(what: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error(`❌ join-class: falló el límite de intentos (${what}):`, err);
    return null;
  }
}

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(req: NextRequest) {
  try {
    const { code, username, password } = await req.json();

    if (!code || !username || !password) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const normalizedUsername = String(username).trim().toLowerCase();
    const normalizedPassword = String(password).trim();

    const attempt = { ip: getClientIp(req), code: normalizedCode, username: normalizedUsername };
    const blocked = await safely('consulta', () => findBlocked(limiterStore, checkRules(attempt)));
    if (blocked) {
      console.warn(`⚠️ join-class: intento bloqueado por "${blocked.rule.name}"`);
      return NextResponse.json(
        { error: 'TOO_MANY_ATTEMPTS', retryAfter: blocked.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(blocked.retryAfterSeconds) } }
      );
    }

    const app = getAdminApp();
    const db = getFirestore(app);

    // 1. Ubicar la clase por su código.
    const classroomsSnap = await db
      .collection('classrooms')
      .where('code', '==', normalizedCode)
      .limit(1)
      .get();

    if (classroomsSnap.empty) {
      await safely('registro', () => recordFailure(limiterStore, failureRules(attempt, false)));
      return NextResponse.json({ error: 'CODE_NOT_FOUND' }, { status: 404 });
    }

    const classroomDoc = classroomsSnap.docs[0];
    const classroomId = classroomDoc.id;
    const className = (classroomDoc.data().name as string) ?? '';

    // 2. Buscar credenciales dentro de esa clase. Comparamos en memoria
    //    (no por query exacto) para que el usuario no distinga mayúsculas.
    //    Ya NO filtramos por `claimed`: un mismo registro sirve para
    //    loguearse las veces que haga falta, no solo la primera.
    const pendingSnap = await db
      .collection('classrooms')
      .doc(classroomId)
      .collection('estudiantesPendientes')
      .get();

    //    La contraseña puede estar cifrada (`passwordEnc`) o, en documentos
    //    de antes de ese cambio, en texto plano (`password`).
    const match = pendingSnap.docs.find((d) => {
      const data = d.data();
      if (String(data.username ?? '').trim().toLowerCase() !== normalizedUsername) return false;
      const stored = readStoredPassword(data);
      return stored !== null && passwordsMatch(stored.password.trim(), normalizedPassword);
    });

    if (!match) {
      await safely('registro', () => recordFailure(limiterStore, failureRules(attempt, true)));
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
    }

    // Solo se borra el contador de ESTE usuario (ver successRules).
    await safely('limpieza', () => clearRules(limiterStore, successRules(attempt)));

    // Migración "al vuelo": si todavía estaba en texto plano, se cifra ahora
    // que sabemos que es la contraseña correcta. Si falla (por ejemplo,
    // falta configurar la clave), el login igual sigue.
    if (!isEncrypted(match.data().passwordEnc) && typeof match.data().password === 'string') {
      try {
        await match.ref.update({
          passwordEnc: encryptPassword(String(match.data().password), loadKey()),
          password: FieldValue.delete(),
        });
      } catch (err) {
        console.warn('⚠️ No se pudo cifrar una contraseña vieja en /api/join-class:', err);
      }
    }

    // 3. Uid estable = id de este registro. Firebase crea el usuario de
    //    Auth automáticamente la primera vez que se usa un token con este uid.
    const studentUid = match.id;

    if (!match.data().claimed) {
      await match.ref.update({ claimed: true, claimedUid: studentUid });
    }

    const auth = getAuth(app);
    const token = await auth.createCustomToken(studentUid);

    return NextResponse.json({
      token,
      classroomId,
      className,
      username: match.data().username as string,
    });
  } catch (err) {
    console.error('❌ Error en /api/join-class:', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}