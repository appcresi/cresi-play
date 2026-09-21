/**
 * scripts/revoke-sessions.ts
 *
 * Cierra TODAS las sesiones de un usuario, en todos sus dispositivos: úsalo
 * si una cuenta (por ejemplo, la de un docente) pudo haber sido comprometida.
 *
 * Qué hace: `revokeRefreshTokens(uid)`. A partir de ese momento
 *   - el usuario no puede renovar su sesión de Firebase (tiene que volver a
 *     iniciar sesión), y
 *   - la cookie de sesión del servidor deja de valer en menos de un minuto
 *     (lib/sessionRevocation.ts; el ID token que ya tenga el navegador puede
 *     seguir sirviendo a las rutas de /api hasta 1 hora, que es lo que dura).
 * Para cortar TAMBIÉN eso de inmediato, deshabilitá la cuenta (--disable).
 *
 * SEGURO POR DEFECTO: sin --apply solo muestra el estado del usuario.
 *
 * Necesita, en .env.local: FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY.
 *
 * Cómo correrlo:
 *   1. Ver el usuario, sin tocar nada:
 *        npx tsx scripts/revoke-sessions.ts <uid>
 *   2. Cerrar todas sus sesiones:
 *        npx tsx scripts/revoke-sessions.ts <uid> --apply
 *   3. Además, deshabilitar la cuenta (corta hasta los ID tokens ya emitidos):
 *        npx tsx scripts/revoke-sessions.ts <uid> --apply --disable
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

const args = process.argv.slice(2);
const uid = args.find((a) => !a.startsWith('--'));
const APPLY = args.includes('--apply');
const DISABLE = args.includes('--disable');

if (!uid) {
  console.error('Uso: npx tsx scripts/revoke-sessions.ts <uid> [--apply] [--disable]');
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

async function main() {
  const auth = getAuth();
  console.log(`Proyecto: ${FIREBASE_ADMIN_PROJECT_ID}${process.env.FIREBASE_AUTH_EMULATOR_HOST ? ' (emulador)' : ''}`);

  const user = await auth.getUser(uid!).catch((err: { code?: string }) => {
    if (err.code === 'auth/user-not-found') return null;
    throw err;
  });
  if (!user) {
    console.error(`❌ No existe un usuario con uid "${uid}".`);
    process.exit(1);
  }

  console.log(`\nUsuario:                 ${user.uid}`);
  console.log(`  correo:                ${user.email ?? '(sin correo)'}`);
  console.log(`  proveedores:           ${user.providerData.map((p) => p.providerId).join(', ') || '(token propio)'}`);
  console.log(`  deshabilitado:         ${user.disabled}`);
  console.log(`  último ingreso:        ${user.metadata.lastSignInTime ?? '(nunca)'}`);
  console.log(`  sesiones válidas desde: ${user.tokensValidAfterTime ?? '(nunca se revocó)'}`);

  if (!APPLY) {
    console.log('\nSimulación: no se cambió nada. Agregá --apply para cerrar todas sus sesiones' + (DISABLE ? ' y deshabilitarla.' : '.'));
    return;
  }

  await auth.revokeRefreshTokens(user.uid);
  if (DISABLE) await auth.updateUser(user.uid, { disabled: true });

  const after = await auth.getUser(user.uid);
  console.log(`\n✅ Sesiones revocadas. Válidas desde: ${after.tokensValidAfterTime}`);
  if (DISABLE) console.log('✅ Cuenta deshabilitada.');
  console.log('La cookie de sesión del servidor deja de valer en menos de un minuto.');
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
