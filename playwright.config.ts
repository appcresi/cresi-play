// Pruebas en navegador real (Chromium) contra `next dev` y los emuladores de
// Firebase — con las reglas reales de Firestore. Ver tests/browser/.
//
//   npm run test:browser
//
// Necesita Java (emuladores) y Chromium (`npx playwright install chromium`).
// El servidor se apunta a los emuladores con NEXT_PUBLIC_E2E_EMULATORS=1 (ver
// lib/firebaseAuth.ts y lib/firebaseFirestore.ts): sin esa variable, que no
// existe en producción, ese código es inerte.
import { defineConfig } from '@playwright/test';
import { generateKeyPairSync, randomBytes } from 'crypto';

const PORT = 3120;
// `localhost` y no `127.0.0.1`: el servidor de desarrollo de Next 16 bloquea con
// 403 los recursos `_next` pedidos desde otro host (allowedDevOrigins), y la
// página quedaría sin JavaScript.
const HOST = 'localhost';

// Se fijan en process.env (`??=`) para que el runner y los workers compartan
// los mismos valores: los tests también usan el Admin SDK (tests/browser/helpers.ts).
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});
process.env.FIREBASE_ADMIN_PROJECT_ID ??= 'demo-cresi';
process.env.FIREBASE_ADMIN_CLIENT_EMAIL ??= 'x@demo-cresi.iam.gserviceaccount.com';
process.env.FIREBASE_ADMIN_PRIVATE_KEY ??= privateKey.replace(/\n/g, '\\n');
process.env.SESSION_SECRET ??= randomBytes(48).toString('base64');
process.env.PENDING_PASSWORD_KEY ??= randomBytes(32).toString('base64');
process.env.JWT_SECRET ??= 'secreto-de-prueba';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  // Un solo worker: comparten servidor y emuladores.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  globalSetup: './tests/browser/global-setup.ts',
  use: {
    baseURL: `http://${HOST}:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'es-AR',
  },
  webServer: {
    // PLAYWRIGHT_PROD=1: contra un build de PRODUCCIÓN (`next start`), donde la política de
    // seguridad no lleva las relajaciones de desarrollo ('unsafe-eval', WebSockets locales).
    command: process.env.PLAYWRIGHT_PROD ? `npx next build && npx next start -p ${PORT}` : `npx next dev -p ${PORT}`,
    url: `http://${HOST}:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: process.env.PLAYWRIGHT_PROD ? 480_000 : 240_000,
    env: {
      NEXT_PUBLIC_E2E_EMULATORS: '1',
      NEXT_PUBLIC_FIREBASE_API_KEY: 'x',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-cresi.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-cresi',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-cresi.appspot.com',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '1',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:1:web:1',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
