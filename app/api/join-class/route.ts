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

export async function POST(req: NextRequest) {
  try {
    const { code, username, password } = await req.json();

    if (!code || !username || !password) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    const app = getAdminApp();
    const db = getFirestore(app);

    const normalizedCode = String(code).trim().toUpperCase();
    const normalizedUsername = String(username).trim().toLowerCase();
    const normalizedPassword = String(password).trim();

    // 1. Ubicar la clase por su código.
    const classroomsSnap = await db
      .collection('classrooms')
      .where('code', '==', normalizedCode)
      .limit(1)
      .get();

    if (classroomsSnap.empty) {
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
      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 });
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