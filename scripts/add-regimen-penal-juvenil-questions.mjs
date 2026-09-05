/**
 * scripts/add-regimen-penal-juvenil-questions.mjs
 *
 * Sube las mismas 32 preguntas sobre el Régimen Penal Juvenil (Ley
 * 27.801) — ya cargadas como trivia en
 * add-regimen-penal-juvenil-trivia.mjs — a la colección `questions`, que
 * es la que alimenta la sección "Preguntas" del panel de administración.
 *
 * category: 'Derecho', tag: 'Régimen Penal Juvenil', level: 3 — es una
 * etiqueta nueva, no existía en el banco de 1000 preguntas auditado antes.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta
 * que lo corras con --apply.
 *
 * Cómo correrlo:
 *   1. Ver qué subiría, sin tocar nada:
 *        node scripts/add-regimen-penal-juvenil-questions.mjs
 *   2. Si se ve bien, subir de verdad:
 *        node scripts/add-regimen-penal-juvenil-questions.mjs --apply
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

const CATEGORY = 'Derecho';
const TAG = 'Régimen Penal Juvenil';
const LEVEL = 3;

async function main() {
  console.log(APPLY ? '🔧 Modo APLICAR — se van a crear documentos en Firestore.\n' : '👀 Modo SIMULACIÓN — no se escribe nada, solo se muestra qué subiría.\n');
  console.log(`Colección: questions — categoría "${CATEGORY}" — etiqueta "${TAG}" — nivel ${LEVEL} — ${questions.length} preguntas\n`);

  questions.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.question}`);
  });

  if (APPLY) {
    const now = new Date().toISOString();
    const batch = db.batch();
    const collectionRef = db.collection('questions');

    for (const q of questions) {
      const ref = collectionRef.doc();
      batch.set(ref, {
        question: q.question,
        options: q.options,
        answer: q.answer,
        level: LEVEL,
        category: CATEGORY,
        tag: TAG,
        resume: q.resume,
        created_at: now,
        updated_at: now,
      });
    }

    await batch.commit();
    console.log(`\n✅ ${questions.length} preguntas creadas en la colección "questions".`);
  } else {
    console.log('\nEsto fue una simulación — no se escribió nada.');
    console.log('Si la lista de arriba te parece correcta, corré:');
    console.log('  node scripts/add-regimen-penal-juvenil-questions.mjs --apply');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error corriendo el script:', err);
  process.exit(1);
});
