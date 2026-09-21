// lib/wordCloudServer.ts
//
// Lecturas de "Nube de Palabras" para Server Components (Admin SDK). El
// Admin SDK IGNORA las reglas de Firestore, así que cada función tiene que
// filtrar por el uid de la sesión ella misma — quien las llama pasa
// `session.uid` (lib/session.ts), nunca un valor que venga del cliente.
import 'server-only';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import type { WordCloudSession } from '@/types/wordcloud';

/** Mismo criterio que WordCloudService.getTeacherSessions (lado cliente): más nuevas primero. */
export async function getTeacherSessions(teacherId: string): Promise<WordCloudSession[]> {
  const snap = await getFirestore(getAdminApp()).collection('wordclouds').where('teacherId', '==', teacherId).get();
  return snap.docs
    .map((d) => d.data() as WordCloudSession)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
