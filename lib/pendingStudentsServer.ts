// lib/pendingStudentsServer.ts
//
// Piezas compartidas por las rutas /api/pending-students/*: quién puede
// llamarlas (solo el docente dueño de la clase) y cómo se valida lo que
// mandan. Las contraseñas de los alumnos que arma el docente ya no las
// escribe el cliente directo a Firestore: pasan por acá para poder
// cifrarlas (ver lib/passwordCrypto.ts).
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { PasswordKeyError } from '@/lib/passwordCrypto';

export const MIN_CREDENTIAL_LENGTH = 3;
export const MAX_CREDENTIAL_LENGTH = 100;

export type TeacherAuthResult =
  | { ok: true; db: Firestore; uid: string; classroomRef: DocumentReference }
  | { ok: false; response: NextResponse };

const fail = (error: string, status: number): { ok: false; response: NextResponse } => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
});

/** Verifica el ID token y que el usuario sea el docente dueño de la clase. */
export async function authorizeClassroomTeacher(req: NextRequest, classroomId: unknown): Promise<TeacherAuthResult> {
  const header = req.headers.get('authorization');
  const idToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!idToken) return fail('MISSING_TOKEN', 401);

  if (typeof classroomId !== 'string' || classroomId.trim() === '') return fail('MISSING_CLASSROOM', 400);

  const app = getAdminApp();
  let uid: string;
  try {
    uid = (await getAuth(app).verifyIdToken(idToken)).uid;
  } catch {
    return fail('INVALID_TOKEN', 401);
  }

  const db = getFirestore(app);
  const classroomRef = db.collection('classrooms').doc(classroomId);
  const snap = await classroomRef.get();
  if (!snap.exists) return fail('CLASSROOM_NOT_FOUND', 404);
  if (snap.data()?.profesorId !== uid) return fail('FORBIDDEN', 403);

  return { ok: true, db, uid, classroomRef };
}

/** Usuario o contraseña válidos: texto, sin espacios en los bordes, largo razonable. */
export function cleanCredential(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length >= MIN_CREDENTIAL_LENGTH && trimmed.length <= MAX_CREDENTIAL_LENGTH ? trimmed : null;
}

/** El usuario no distingue mayúsculas (igual que en /api/join-class). */
export const usernameKey = (username: unknown): string => String(username ?? '').trim().toLowerCase();

/** Respuesta común para errores inesperados; distingue la clave mal configurada. */
export function serverError(context: string, err: unknown): NextResponse {
  console.error(`❌ Error en ${context}:`, err);
  if (err instanceof PasswordKeyError) {
    return NextResponse.json({ error: 'SERVER_MISCONFIGURED' }, { status: 500 });
  }
  return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
}
