/**
 * scripts/set-admin-claim.mjs
 *
 * Pone (o saca) la marca `admin` en el token de una cuenta. Es lo único que
 * decide quién administra el contenido de CrESI: la leen las reglas de
 * Firestore (isCresiAdmin en firestore.rules) y el panel appcresi-admin
 * (lib/serverAuth.ts).
 *
 * Después de ponerla, esa persona tiene que cerrar sesión y volver a entrar
 * en el panel: el token viejo no la trae.
 *
 * SEGURO POR DEFECTO: sin --apply solo muestra el estado actual.
 *
 *   node scripts/set-admin-claim.mjs appcresi@gmail.com            # ver
 *   node scripts/set-admin-claim.mjs appcresi@gmail.com --apply    # ponerla
 *   node scripts/set-admin-claim.mjs otra@cuenta.com --remove --apply
 */

import { config } from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

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

const email = process.argv.slice(2).find((a) => !a.startsWith('--'));
const apply = process.argv.includes('--apply');
const remove = process.argv.includes('--remove');

if (!email) {
  console.error('Uso: node scripts/set-admin-claim.mjs <email> [--remove] [--apply]');
  process.exit(1);
}

const auth = getAuth();
const user = await auth.getUserByEmail(email);
const claims = user.customClaims ?? {};
console.log(`${email} (${user.uid}) · marcas actuales: ${JSON.stringify(claims)}`);

if (!apply) {
  console.log(`(simulación) ${remove ? 'Se sacaría' : 'Se pondría'} admin. Corré con --apply para hacerlo.`);
  process.exit(0);
}

// Se conservan las otras marcas (por ejemplo `student`).
const { admin: _previous, ...rest } = claims;
await auth.setCustomUserClaims(user.uid, remove ? rest : { ...rest, admin: true });
console.log(`✓ ${remove ? 'Se sacó' : 'Se puso'} admin. Cerrá sesión y volvé a entrar en el panel.`);
