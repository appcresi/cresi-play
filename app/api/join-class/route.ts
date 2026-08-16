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
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getAdminApp } from '@/lib/firebaseAdmin';

// Freno básico contra fuerza bruta: cuenta intentos fallidos por
// IP + código de clase, en memoria del proceso. Si se supera el máximo
// dentro de la ventana, se corta antes de tocar Firestore.
//
// Es una barrera simple, no a prueba de todo: vive en memoria de ESTE
// proceso, así que un cold start la reinicia y, si el hosting corre varias
// instancias en paralelo, cada una lleva su propio contador (un atacante
// distribuido podría esquivarla). Para algo robusto ante eso haría falta
// un contador persistente (ej. una colección en Firestore) — se deja así
// a propósito por ahora, más simple y suficiente para el caso de uso actual.
const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutos

const failedAttempts = new Map<string, { count: number; windowStart: number }>();

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

function isRateLimited(key: string): boolean {
  const record = failedAttempts.get(key);
  if (!record) return false;
  if (Date.now() - record.windowStart > WINDOW_MS) {
    failedAttempts.delete(key);
    return false;
  }
  return record.count >= MAX_FAILED_ATTEMPTS;
}

function registerFailedAttempt(key: string): void {
  const record = failedAttempts.get(key);
  if (!record || Date.now() - record.windowStart > WINDOW_MS) {
    failedAttempts.set(key, { count: 1, windowStart: Date.now() });
    return;
  }
  record.count += 1;
}

function clearFailedAttempts(key: string): void {
  failedAttempts.delete(key);
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

    const rateLimitKey = `${getClientIp(req)}:${normalizedCode}`;
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json({ error: 'TOO_MANY_ATTEMPTS' }, { status: 429 });
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
      registerFailedAttempt(rateLimitKey);
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

    const match = pendingSnap.docs.find((d) => {
      const data = d.data();
      const storedUsername = String(data.username ?? '').trim().toLowerCase();
      const storedPassword = String(data.password ?? '').trim();
      return storedUsername === normalizedUsername && storedPassword === normalizedPassword;
    });

    if (!match) {
      registerFailedAttempt(rateLimitKey);
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
    }

    clearFailedAttempts(rateLimitKey);

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