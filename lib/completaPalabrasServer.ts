// lib/completaPalabrasServer.ts
//
// Lecturas de lecciones de Completa Palabras para Server Components (Admin
// SDK). El Admin SDK IGNORA las reglas de Firestore, así que filtra por autor
// acá mismo: quien llama pasa `session.uid` (lib/session.ts), nunca un valor
// del cliente.
import 'server-only';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebaseAdmin';
import { toPlain } from '@/lib/plain';

/** Documento completo (no solo lo que muestra la lista): "Duplicar" copia `lecciones` tal cual. */
export async function getTeacherCompletaPalabras(teacherId: string): Promise<Array<{ id: string; [key: string]: unknown }>> {
  const snap = await getFirestore(getAdminApp()).collection('completapalabras').where('author', '==', teacherId).get();
  return snap.docs.map((d) => ({ ...(toPlain(d.data()) as Record<string, unknown>), id: d.id }));
}
