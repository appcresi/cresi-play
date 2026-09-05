/**
 * scripts/backfill-entregas-classroomid.mjs
 *
 * Agrega los campos `classroomId` y `tareaId` a las entregas que ya
 * existían antes de que TareaService.submitEntrega empezara a guardarlos
 * (ver types/tarea.ts — Entrega.classroomId). Sin este backfill, el
 * cuaderno de calificaciones (TareasGradebook.tsx), que ahora lee TODAS
 * las entregas de una clase con una sola consulta `collectionGroup`
 * filtrada por `classroomId` en vez de una consulta por tarea, no
 * encontraría las entregas viejas (les falta el campo por el que filtra).
 *
 * Recorre classrooms → tareas → entregas y solo TOCA los documentos a los
 * que les falte alguno de los dos campos — no pisa nada que ya esté bien.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta
 * que lo corras con --apply.
 *
 * Cómo correrlo:
 *   1. Ver qué actualizaría, sin tocar nada:
 *        node scripts/backfill-entregas-classroomid.mjs
 *   2. Si se ve bien, aplicar de verdad:
 *        node scripts/backfill-entregas-classroomid.mjs --apply
 */

import { config } from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

config({ path: '.env.local' });

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;

if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('❌ Faltan variables de entorno en .env.local (FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const APPLY = process.argv.includes('--apply');

async function main() {
  const classroomsSnap = await db.collection('classrooms').get();
  console.log(`Clases encontradas: ${classroomsSnap.size}`);

  let totalEntregas = 0;
  let needingBackfill = 0;
  const writes = [];

  for (const classroomDoc of classroomsSnap.docs) {
    const classroomId = classroomDoc.id;
    const tareasSnap = await db.collection('classrooms').doc(classroomId).collection('tareas').get();

    for (const tareaDoc of tareasSnap.docs) {
      const tareaId = tareaDoc.id;
      const entregasSnap = await db
        .collection('classrooms')
        .doc(classroomId)
        .collection('tareas')
        .doc(tareaId)
        .collection('entregas')
        .get();

      for (const entregaDoc of entregasSnap.docs) {
        totalEntregas += 1;
        const data = entregaDoc.data();
        if (data.classroomId === classroomId && data.tareaId === tareaId) continue; // ya migrada

        needingBackfill += 1;
        console.log(
          `  [falta backfill] classrooms/${classroomId}/tareas/${tareaId}/entregas/${entregaDoc.id}`
        );
        writes.push({ ref: entregaDoc.ref, classroomId, tareaId });
      }
    }
  }

  console.log(`\nTotal de entregas revisadas: ${totalEntregas}`);
  console.log(`Entregas que necesitan backfill: ${needingBackfill}`);

  if (!APPLY) {
    console.log('\nModo simulación (no se escribió nada). Corré con --apply para aplicar de verdad.');
    return;
  }

  if (writes.length === 0) {
    console.log('\nNada para actualizar.');
    return;
  }

  // Batches de a 400 (límite de Firestore es 500 escrituras por batch).
  const BATCH_SIZE = 400;
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = writes.slice(i, i + BATCH_SIZE);
    chunk.forEach(({ ref, classroomId, tareaId }) => {
      batch.update(ref, { classroomId, tareaId });
    });
    await batch.commit();
    console.log(`Aplicado batch ${Math.floor(i / BATCH_SIZE) + 1} (${chunk.length} entregas).`);
  }

  console.log(`\n✅ Listo — ${writes.length} entregas actualizadas.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
