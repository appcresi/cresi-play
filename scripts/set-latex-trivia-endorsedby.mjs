/**
 * scripts/set-latex-trivia-endorsedby.mjs
 *
 * Le agrega el campo `endorsedBy` a las trivias sobre látex ya existentes en
 * la colección `trivia`, para que la app muestre "Avalada por: Asociación
 * Argentina de Alergia al Látex" en la tarjeta, en la pantalla previa a
 * jugar y en el certificado.
 *
 * No hay un id ni un campo de categoría conocido de antemano para
 * identificar "la trivia de látex" — el script busca por coincidencia de
 * texto en el nombre (case/acento-insensible: "latex" o "látex") en TODA la
 * colección `trivia`, sin filtrar por autor, porque no se sabe si la trivia
 * fue creada como contenido oficial (author: 'CRESI') o por un docente
 * desde /docente/trivias.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta que
 * lo corras con --apply. Revisá la lista de coincidencias antes de aplicar:
 * si aparece alguna trivia que NO es sobre alergia al látex (falso
 * positivo), avisá antes de confirmar.
 *
 * Cómo correrlo:
 *   1. Ver qué trivias matchean y qué se les escribiría, sin tocar nada:
 *        node scripts/set-latex-trivia-endorsedby.mjs
 *   2. Si la lista es correcta, aplicar de verdad:
 *        node scripts/set-latex-trivia-endorsedby.mjs --apply
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

const ENDORSED_BY = 'Asociación Argentina de Alergia al Látex';

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
    console.log('Revisá el nombre exacto de la trivia en /docente/trivias o en la consola de Firestore y ajustá el filtro del script si hace falta.');
    process.exit(0);
  }

  console.log(`Encontradas ${matches.length} trivia(s) que matchean por nombre:\n`);
  matches.forEach((doc) => {
    const data = doc.data();
    console.log(`  - [${doc.id}] "${data.name}" (author: ${data.author ?? 'desconocido'}) — endorsedBy actual: ${data.endorsedBy ?? '(sin valor)'}`);
  });

  if (APPLY) {
    for (const docSnap of matches) {
      await db.collection('trivia').doc(docSnap.id).update({ endorsedBy: ENDORSED_BY });
    }
    console.log(`\n✅ Actualizadas ${matches.length} trivia(s) con endorsedBy: "${ENDORSED_BY}"`);
  } else {
    console.log('\nEsto fue una simulación — no se escribió nada.');
    console.log('Si la lista de arriba es correcta (todas son sobre alergia al látex), corré:');
    console.log('  node scripts/set-latex-trivia-endorsedby.mjs --apply');
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error corriendo el script:', err);
  process.exit(1);
});
