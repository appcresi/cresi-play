/**
 * scripts/migrate-resource-files.mjs
 *
 * Saca el link de descarga (`url`) de cada documento de `resources` —que es
 * de lectura pública— y lo guarda en `resourceFiles/{id}`, que solo leen
 * el admin y los servidores (ver firestore.rules). Sin esto, el link de los
 * recursos pagos de cresi.com.ar se podía leer sin pagar.
 *
 * Orden de despliegue:
 *   1. Publicar las reglas nuevas (firebase deploy --only firestore:rules)
 *      y desplegar web, cresi-play y appcresi-admin: los tres ya leen
 *      `resourceFiles` y, mientras tanto, siguen usando `resources.url`.
 *   2. Correr este script.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta
 * que lo corras con --apply.
 *
 *   node scripts/migrate-resource-files.mjs            # ver qué haría
 *   node scripts/migrate-resource-files.mjs --apply    # hacerlo
 */

import { config } from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

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

const apply = process.argv.includes('--apply');
const db = getFirestore();

const snap = await db.collection('resources').get();
let moved = 0;

for (const doc of snap.docs) {
  const { url, title, is_free } = doc.data();
  if (typeof url !== 'string' || url.length === 0) continue;

  moved++;
  console.log(`${apply ? '→' : '(simulación)'} ${doc.id} · ${title} · ${is_free === false ? 'PAGO' : 'gratis'}`);
  if (!apply) continue;

  const batch = db.batch();
  batch.set(db.collection('resourceFiles').doc(doc.id), { url }, { merge: true });
  batch.update(doc.ref, { url: FieldValue.delete() });
  await batch.commit();
}

console.log(`\n${moved} de ${snap.size} recursos ${apply ? 'migrados' : 'se migrarían (corré con --apply)'}.`);
