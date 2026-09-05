/**
 * scripts/set-latex-trivia-endorsed-url.mjs
 *
 * Le agrega el campo `endorsedByUrl` a las trivias sobre látex que ya
 * tienen `endorsedBy` seteado (por set-latex-trivia-endorsedby.mjs), para
 * que el nombre de la entidad ("Asociación Argentina de Alergia al
 * Látex") se muestre como link a su página oficial en la tarjeta, en la
 * pantalla previa a jugar.
 *
 * Mismo filtro que set-latex-trivia-endorsedby.mjs: busca por coincidencia
 * de texto "latex"/"látex" en el nombre, sin filtrar por autor.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta que
 * lo corras con --apply.
 *
 * Cómo correrlo:
 *   1. Ver qué trivias matchean y qué se les escribiría, sin tocar nada:
 *        node scripts/set-latex-trivia-endorsed-url.mjs
 *   2. Si la lista es correcta, aplicar de verdad:
 *        node scripts/set-latex-trivia-endorsed-url.mjs --apply
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

const ENDORSED_BY_URL = 'https://saludsinlatex.com.ar/';

function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

async function main() {
  console.log(APPLY ? '🔧 Modo APLICAR — se van a actualizar documentos en Firestore.\n' : '👀 Modo SIMULACIÓN — no se escribe nada, solo se muestra qué se actualizaría.\n');

  const snapshot = await db.collection('trivia').get();
  const matches = snapshot.docs.filter((doc) => normalize(doc.data().name || '').includes('latex'));

  if (matches.length === 0) {
    console.log('No se encontró ninguna trivia cuyo nombre contenga "látex"/"latex".');
    process.exit(0);
  }

  console.log(`Encontradas ${matches.length} trivia(s) que matchean por nombre:\n`);
  matches.forEach((doc) => {
    const data = doc.data();
    console.log(`  - [${doc.id}] "${data.name}" — endorsedBy: ${data.endorsedBy ?? '(sin valor)'} — endorsedByUrl actual: ${data.endorsedByUrl ?? '(sin valor)'}`);
  });

  if (APPLY) {
    for (const docSnap of matches) {
      await db.collection('trivia').doc(docSnap.id).update({ endorsedByUrl: ENDORSED_BY_URL });
    }
    console.log(`\n✅ Actualizadas ${matches.length} trivia(s) con endorsedByUrl: "${ENDORSED_BY_URL}"`);
  } else {
    console.log('\nEsto fue una simulación — no se escribió nada.');
    console.log('Si la lista de arriba es correcta, corré:');
    console.log('  node scripts/set-latex-trivia-endorsed-url.mjs --apply');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error corriendo el script:', err);
  process.exit(1);
});
