/**
 * scripts/add-regimen-penal-juvenil-trivia.mjs
 *
 * Crea una trivia nueva ("Derechos de Adolescentes y Régimen Penal
 * Juvenil") en la colección `trivia`, con author: 'CRESI' y
 * userId: CRESI_UID, igual que las trivias que se crean desde el panel de
 * administración.
 *
 * Las 32 preguntas se revisaron (distractores no repetidos entre sí ni
 * con la respuesta correcta, sin campos vacíos) y no se encontraron
 * problemas — se suben todas.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta
 * que lo corras con --apply.
 *
 * Cómo correrlo:
 *   1. Ver qué subiría, sin tocar nada:
 *        node scripts/add-regimen-penal-juvenil-trivia.mjs
 *   2. Si se ve bien, subir de verdad:
 *        node scripts/add-regimen-penal-juvenil-trivia.mjs --apply
 */

import { config } from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { questions } from './data/regimen-penal-juvenil-questions.mjs';

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

// Mismo uid que lib/constants.ts (CRESI_UID) en appcresi-admin.
const CRESI_UID = 'feHhnkE3m1Yzbwn4AgEA7rJjsul1';

const TRIVIA_NAME = 'Derechos de Adolescentes y Régimen Penal Juvenil';
const TRIVIA_LEVEL = 3;


async function main() {
  console.log(APPLY ? '🔧 Modo APLICAR — se va a crear un documento en Firestore.\n' : '👀 Modo SIMULACIÓN — no se escribe nada, solo se muestra qué subiría.\n');
  console.log(`Trivia: "${TRIVIA_NAME}" — nivel ${TRIVIA_LEVEL} — ${questions.length} preguntas\n`);

  questions.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.question}`);
  });

  if (APPLY) {
    const now = new Date().toISOString();
    const ref = await db.collection('trivia').add({
      name: TRIVIA_NAME,
      author: 'CRESI',
      level: TRIVIA_LEVEL,
      questions,
      userId: CRESI_UID,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`\n✅ Creada — id del documento: ${ref.id}`);
  } else {
    console.log('\nEsto fue una simulación — no se escribió nada.');
    console.log('Si la lista de arriba te parece correcta, corré:');
    console.log('  node scripts/add-regimen-penal-juvenil-trivia.mjs --apply');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error corriendo el script:', err);
  process.exit(1);
});
