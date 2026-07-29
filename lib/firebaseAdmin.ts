// lib/firebaseAdmin.ts
//
// Firebase Admin SDK — SOLO se usa desde el servidor (API routes), nunca
// desde el navegador. A diferencia del SDK de cliente (lib/firebase.ts),
// este tiene privilegios totales: ignora las reglas de seguridad de
// Firestore y puede emitir tokens de autenticación para cualquier usuario.
// Por eso las credenciales viven en variables de entorno del servidor, no
// en el bundle que se manda al navegador.
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';

export function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey) {
    throw new Error(
      'Faltan variables de entorno de Firebase Admin (FIREBASE_ADMIN_PROJECT_ID, ' +
      'FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY). Revisá tu .env.local.'
    );
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}