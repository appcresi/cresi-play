// lib/pendingStudentsClient.ts
//
// Cliente de /api/pending-students/*. La contraseña de los alumnos que arma
// el docente ya no viaja ni se guarda desde el navegador directo a
// Firestore: el servidor la cifra y solo la devuelve, a pedido, al docente
// dueño de la clase.
import { auth } from '@/lib/firebaseAuth';

export type SkippedReason = 'INVALID' | 'DUPLICATE_USERNAME';

export class PendingStudentsApiError extends Error {
  constructor(public code: string, public status: number) {
    super(code);
    this.name = 'PendingStudentsApiError';
  }
}

async function call<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new PendingStudentsApiError('NOT_SIGNED_IN', 401);

  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new PendingStudentsApiError(data.error ?? 'REQUEST_FAILED', res.status);
  return data;
}

export function createPendingStudents(
  classroomId: string,
  students: Array<{ username: string; password: string }>
): Promise<{ added: number; skipped: Array<{ username: string; reason: SkippedReason }> }> {
  return call('/api/pending-students', { classroomId, students });
}

export async function updatePendingCredentials(
  classroomId: string,
  pendingId: string,
  updates: { username?: string; password?: string }
): Promise<void> {
  await call('/api/pending-students/update', { classroomId, pendingId, ...updates });
}

export async function revealPendingPassword(classroomId: string, pendingId: string): Promise<string> {
  const { password } = await call<{ password: string }>('/api/pending-students/reveal', { classroomId, pendingId });
  return password;
}
