/**
 * scripts/migrate-snake-case.mjs
 *
 * Unifica a snake_case los campos de fecha y autor del contenido que
 * comparten appcresi-admin, cresi-play y web:
 *
 *   trivia     userId → user_id, createdAt → created_at, updatedAt → updated_at
 *   resources  borra createdAt/updatedAt (el admin los guardaba repetidos
 *              junto a created_at/updated_at)
 *
 * Si un documento ya tiene la versión snake_case, gana esa (salvo `user_id`
 * en trivia: el valor viejo apunta a una cuenta que ya no existe, así que
 * manda `userId`, que es el uid real de quien la creó).
 *
 * Correrlo DESPUÉS de desplegar appcresi-admin: la versión nueva ya escribe
 * snake_case y, mientras tanto, lee los dos formatos.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta
 * que lo corras con --apply.
 *
 *   node scripts/migrate-snake-case.mjs            # ver qué haría
 *   node scripts/migrate-snake-case.mjs --apply    # hacerlo
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

/** Cambios para un documento: renombra `from` → `to` y borra `from`. */
function renames(data, pairs, { preferOld = [] } = {}) {
  const update = {};
  for (const [from, to] of pairs) {
    if (!(from in data)) continue;
    if (!(to in data) || preferOld.includes(from)) update[to] = data[from];
    update[from] = FieldValue.delete();
  }
  return update;
}

async function migrate(collection, pairs, options) {
  const snap = await db.collection(collection).get();
  let changed = 0;
  let batch = db.batch();
  let pending = 0;

  for (const doc of snap.docs) {
    const update = renames(doc.data(), pairs, options);
    const fields = Object.keys(update);
    if (fields.length === 0) continue;

    changed++;
    console.log(`${apply ? '→' : '(simulación)'} ${collection}/${doc.id}: ${fields.join(', ')}`);
    if (!apply) continue;

    batch.update(doc.ref, update);
    if (++pending === 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }
  if (apply && pending > 0) await batch.commit();

  console.log(`${collection}: ${changed} de ${snap.size} documentos ${apply ? 'migrados' : 'se migrarían'}.\n`);
}

await migrate(
  'trivia',
  [['userId', 'user_id'], ['createdAt', 'created_at'], ['updatedAt', 'updated_at']],
  { preferOld: ['userId'] },
);
await migrate('resources', [['createdAt', 'created_at'], ['updatedAt', 'updated_at']]);

if (!apply) console.log('Nada se escribió. Corré con --apply para hacerlo.');
