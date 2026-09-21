// lib/liveTriviaServer.ts
//
// Lecturas de trivia en vivo para Server Components (Admin SDK). El Admin SDK
// IGNORA las reglas de Firestore, así que filtra por docente acá mismo:
// quien llama pasa `session.uid` (lib/session.ts), nunca un valor del cliente.
import 'server-only';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { toPlain } from '@/lib/plain';
import type { LiveTriviaSession } from '@/types/liveTrivia';

/** Mismo criterio que LiveTriviaService.getTeacherSessions (lado cliente): más nuevas primero. */
export async function getTeacherLiveSessions(teacherId: string): Promise<LiveTriviaSession[]> {
  const snap = await getFirestore(getAdminApp()).collection('livetrivias').where('teacherId', '==', teacherId).get();
  return snap.docs
    .map((d) => toPlain(d.data()) as unknown as LiveTriviaSession)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
