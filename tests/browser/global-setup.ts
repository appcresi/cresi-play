// Datos comunes a todas las pruebas: el banco de preguntas que el panel docente
// carga de la colección `questions` al crear una trivia.
import type { FullConfig } from '@playwright/test';
import { adminDb, QUESTION_BANK } from './helpers';

// Rutas que recorren las pruebas. `next dev` compila cada página la PRIMERA vez
// que se pide (decenas de segundos) y ese arranque en frío hacía fallar las
// pruebas por tiempo; se pide cada una una vez antes de empezar.
const WARM_UP = ['/docente', '/docente/trivias', '/docente/nube-de-palabras', '/clase/CALENTAR', '/escritorio'];

export default async function globalSetup(config: FullConfig): Promise<void> {
  // Este proyecto tiene credenciales REALES de Firebase en .env.local: sin los
  // emuladores, estas pruebas escribirían en producción. Se niegan a correr.
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error('Faltan los emuladores de Firebase: corré `npm run test:browser` (no `npx playwright test` a secas).');
  }
  const db = adminDb();
  await Promise.all(QUESTION_BANK.map((q) => db.collection('questions').doc(q.id).set(q)));

  const baseURL = config.projects[0].use.baseURL!;
  for (const path of WARM_UP) {
    await fetch(new URL(path, baseURL), { signal: AbortSignal.timeout(180_000) }).catch(() => undefined);
  }
}
