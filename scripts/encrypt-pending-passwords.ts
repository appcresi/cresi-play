/**
 * scripts/encrypt-pending-passwords.ts
 *
 * Cifra las contraseñas de `classrooms/{id}/estudiantesPendientes` que
 * todavía están en texto plano (campo `password`), pasándolas a
 * `passwordEnc` (ver lib/passwordCrypto.ts) y borrando la vieja.
 *
 * No es obligatorio correrlo: /api/join-class y /api/pending-students/reveal
 * ya cifran cada documento viejo al usarlo. Sirve para dejar TODA la base
 * cifrada de una vez, sin esperar a que cada alumno inicie sesión.
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta que
 * lo corras con --apply. Es idempotente: solo toca los documentos que
 * todavía tienen `password` en texto plano.
 *
 * Necesita, en .env.local: FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL /
 * PRIVATE_KEY y PENDING_PASSWORD_KEY (la MISMA que usa el servidor en
 * producción — si no, /api/join-class no podría descifrar lo que escribas).
 *
 * Cómo correrlo:
 *   1. Ver qué cifraría, sin tocar nada:
 *        npx tsx scripts/encrypt-pending-passwords.ts
 *   2. Si se ve bien, aplicar de verdad:
 *        npx tsx scripts/encrypt-pending-passwords.ts --apply
 */
import { config } from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { encryptPassword, isEncrypted, loadKey } from '../lib/passwordCrypto';

config({ path: '.env.local' });

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;

if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('❌ Faltan variables de entorno en .env.local (FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).');
  process.exit(1);
}

const APPLY = process.argv.includes('--apply');
const key = loadKey(); // falla claro si falta PENDING_PASSWORD_KEY

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

async function main() {
  console.log(`Proyecto: ${FIREBASE_ADMIN_PROJECT_ID}${process.env.FIRESTORE_EMULATOR_HOST ? ' (emulador)' : ''}`);
  const classrooms = await db.collection('classrooms').get();
  console.log(`Clases encontradas: ${classrooms.size}`);

  let total = 0;
  let plain = 0;
  let alreadyEncrypted = 0;
  let plainAndEncrypted = 0;

  for (const classroom of classrooms.docs) {
    const pending = await classroom.ref.collection('estudiantesPendientes').get();
    for (const doc of pending.docs) {
      total += 1;
      const data = doc.data();
      const hasPlain = typeof data.password === 'string' && data.password !== '';
      const hasEncrypted = isEncrypted(data.passwordEnc);

      if (hasPlain && hasEncrypted) {
        // No debería pasar; la cifrada manda. Solo se limpia la plana.
        plainAndEncrypted += 1;
        if (APPLY) await doc.ref.update({ password: FieldValue.delete() });
      } else if (hasPlain) {
        plain += 1;
        if (APPLY) await doc.ref.update({ passwordEnc: encryptPassword(data.password, key), password: FieldValue.delete() });
      } else if (hasEncrypted) {
        alreadyEncrypted += 1;
      }
    }
  }

  console.log(`\nAlumnos pendientes: ${total}`);
  console.log(`  ya cifrados:                ${alreadyEncrypted}`);
  console.log(`  en texto plano:             ${plain}`);
  console.log(`  con plana Y cifrada (raro): ${plainAndEncrypted}`);
  if (APPLY) console.log(`\n✅ Listo: ${plain + plainAndEncrypted} documento(s) actualizados.`);
  else console.log(`\nSimulación: no se escribió nada. Corré con --apply para cifrar ${plain + plainAndEncrypted} documento(s).`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
