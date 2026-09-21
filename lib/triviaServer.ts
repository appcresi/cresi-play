// lib/triviaServer.ts
//
// Lecturas de trivias para Server Components (Admin SDK). El Admin SDK
// IGNORA las reglas de Firestore, así que filtra por autor acá mismo: quien
// llama pasa `session.uid` (lib/session.ts), nunca un valor del cliente.
import 'server-only';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { toPlain } from '@/lib/plain';

/**
 * Trivias creadas por un docente. Devuelve el documento completo (no solo
 * los campos que muestra la lista): "Duplicar" en el panel copia todo el
 * documento, así que necesita los mismos campos que traería una lectura
 * directa desde el cliente.
 */
export async function getTeacherTrivias(teacherId: string): Promise<Array<{ id: string; [key: string]: unknown }>> {
  const snap = await getFirestore(getAdminApp()).collection('trivia').where('author', '==', teacherId).get();
  return snap.docs.map((d) => ({ ...(toPlain(d.data()) as Record<string, unknown>), id: d.id }));
}

export interface TriviaOption {
  id: string;
  name: string;
  questionCount: number;
  isOwn: boolean;
}

/**
 * Trivias que un docente puede elegir para una partida en vivo: las suyas y
 * las oficiales de CrESI. Solo lo que necesita el selector (nombre y cantidad
 * de preguntas), no el documento completo.
 */
export async function getTriviaOptionsForTeacher(teacherId: string): Promise<TriviaOption[]> {
  const db = getFirestore(getAdminApp());
  const [own, cresi] = await Promise.all([
    db.collection('trivia').where('author', '==', teacherId).get(),
    db.collection('trivia').where('author', '==', 'CRESI').get(),
  ]);
  const toOption = (isOwn: boolean) => (d: (typeof own.docs)[number]): TriviaOption => ({
    id: d.id,
    name: String(d.data().name ?? ''),
    questionCount: Array.isArray(d.data().questions) ? d.data().questions.length : 0,
    isOwn,
  });
  return [...own.docs.map(toOption(true)), ...cresi.docs.map(toOption(false))];
}
