// Ayudantes de las pruebas en navegador. Hablan con los emuladores por el
// Admin SDK (que ignora las reglas) para preparar y comprobar datos, mientras
// que la página usa el SDK de cliente con las reglas reales.
import { randomBytes } from 'crypto';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { Page } from '@playwright/test';

function adminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());

const uniqueId = (prefix: string) => `${prefix}-${randomBytes(4).toString('hex')}`;

export async function createTeacher(): Promise<{ uid: string }> {
  const uid = uniqueId('docente');
  await adminAuth().createUser({ uid, email: `${uid}@example.com`, displayName: 'Docente de prueba' });
  return { uid };
}

/**
 * Inicia sesión como `uid`. Los docentes entran con un popup de Google, que un
 * test no puede recorrer: se usa un token de prueba y la puerta de servicio
 * `window.__cresiE2E` (solo existe con NEXT_PUBLIC_E2E_EMULATORS=1, ver
 * context/AuthContext.tsx). Espera a que el servidor emita la cookie de sesión.
 */
export async function signInAs(page: Page, uid: string): Promise<void> {
  await page.goto('/docente');
  await page.waitForFunction(() => Boolean((window as unknown as { __cresiE2E?: unknown }).__cresiE2E));
  const token = await adminAuth().createCustomToken(uid);
  const sessionIssued = page.waitForResponse(
    (r) => r.url().endsWith('/api/session') && r.request().method() === 'POST' && r.status() === 200
  );
  await page.evaluate(
    (t) => (window as unknown as { __cresiE2E: { signInWithCustomToken: (t: string) => Promise<unknown> } }).__cresiE2E.signInWithCustomToken(t),
    token
  );
  await sessionIssued;
}

// Los errores que delatan un desajuste entre el HTML del servidor y el primer
// render del cliente (React los reporta en dev con texto y en producción con
// códigos: #418 texto, #419/#423/#425 hidratación).
const HYDRATION = /hydrat|did not match|Text content does not match|Minified React error #(418|419|422|423|425)/i;

/** Junta los errores de hidratación y las excepciones no atrapadas de la página. Se lee al final: `expect(problems).toEqual([])`. */
export function watchProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && HYDRATION.test(msg.text())) problems.push(`consola: ${msg.text().slice(0, 300)}`);
  });
  page.on('pageerror', (err) => problems.push(`excepción: ${err.message.slice(0, 300)}`));
  return problems;
}

export interface SeedQuestion {
  id: string;
  question: string;
  answer: string;
  options: { first: string; second: string; third: string };
  resume: string;
}

export const QUESTION_BANK: SeedQuestion[] = Array.from({ length: 6 }, (_, i) => ({
  id: `q${i + 1}`,
  question: `¿Pregunta de prueba número ${i + 1}?`,
  answer: 'Correcta',
  options: { first: 'Correcta', second: 'Incorrecta A', third: 'Incorrecta B' },
  resume: `Resumen ${i + 1}`,
}));

/** Una trivia del docente, con la forma que guarda el panel. */
export async function seedTrivia(teacherId: string, name: string): Promise<string> {
  const id = uniqueId('trivia');
  await adminDb().collection('trivia').doc(id).set({
    id,
    name,
    description: 'Sembrada por la prueba',
    questions: QUESTION_BANK.slice(0, 3).map(({ question, answer, options, resume }) => ({ question, answer, options, resume })),
    author: teacherId,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    level: 1,
    isPublic: true,
    source: 'usuario',
    playCount: 4,
  });
  return id;
}
