import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { adminDb, watchProblems } from './helpers';

// Jugar al azar: al responder, el cartel de resultado se ve grande y solo
// quedan a la vista la respuesta correcta y (si erró) la que se tocó.

const CATEGORIES = ['Salud', 'Prevención', 'Diversidad', 'Derecho', 'Proyecto'];

async function seedQuestions(): Promise<void> {
  const db = adminDb();
  await Promise.all(
    CATEGORIES.flatMap((category) =>
      [1, 2].map((n) =>
        db.collection('questions').doc(`azar-${category}-${n}`).set({
          question: `¿Pregunta de ${category} número ${n}?`,
          answer: 'Correcta',
          options: { first: 'Incorrecta A', second: 'Incorrecta B', third: 'Incorrecta C' },
          category,
          level: 1,
          resume: `Resumen de ${category} ${n}`,
        })
      )
    )
  );
}

/** Gira la ruleta y espera a que aparezca la pregunta (la ruleta tarda unos 4 segundos). */
async function startQuestion(page: Page): Promise<void> {
  await page.goto('/jugarazar');
  await page.getByRole('button', { name: '¡GIRAR!' }).click();
  await expect(page.getByText(/· Nivel 1/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Correcta', exact: true })).toBeVisible();
}

test.describe('Jugar al azar: responder', () => {
  test.beforeAll(seedQuestions);

  test('sin responder se ven las 4 opciones, sin letras delante', async ({ page }) => {
    await startQuestion(page);
    for (const text of ['Correcta', 'Incorrecta A', 'Incorrecta B', 'Incorrecta C']) {
      await expect(page.getByRole('button', { name: text, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /^[A-D]\./ })).toHaveCount(0);
  });

  test('si acierta: cartel grande y desaparecen las otras tres opciones', async ({ page }) => {
    const problems = watchProblems(page);
    await startQuestion(page);
    await page.getByRole('button', { name: 'Correcta', exact: true }).click();

    const banner = page.getByRole('status').filter({ hasText: '¡Respuesta correcta!' });
    await expect(banner).toBeVisible();
    const fontSize = await banner.locator('p').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fontSize).toBeGreaterThanOrEqual(30);

    await expect(page.getByRole('button', { name: 'Correcta', exact: true })).toBeVisible();
    for (const gone of ['Incorrecta A', 'Incorrecta B', 'Incorrecta C']) {
      await expect(page.getByRole('button', { name: gone })).toHaveCount(0);
    }
    // El botón para seguir queda a la vista.
    await expect(page.getByRole('button', { name: 'Siguiente Pregunta' })).toBeVisible();
    expect(problems).toEqual([]);
  });

  test('si se equivoca: queda la que tocó y la correcta, y se van las otras dos', async ({ page }) => {
    await startQuestion(page);
    await page.getByRole('button', { name: 'Incorrecta B', exact: true }).click();

    const banner = page.getByRole('status').filter({ hasText: 'Respuesta incorrecta' });
    await expect(banner).toBeVisible();

    // Quedan justo dos, rotuladas: la que tocó y la correcta.
    await expect(page.getByRole('button', { name: /Tu respuesta\s*Incorrecta B/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Respuesta correcta\s*Correcta/ })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Incorrecta A' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Incorrecta C' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Siguiente Pregunta' })).toBeVisible();
  });

  test('"Siguiente Pregunta" vuelve a la ruleta y la próxima pregunta trae las 4 opciones', async ({ page }) => {
    await startQuestion(page);
    await page.getByRole('button', { name: 'Correcta', exact: true }).click();
    await page.getByRole('button', { name: 'Siguiente Pregunta' }).click();

    await expect(page.getByRole('button', { name: '¡GIRAR!' })).toBeVisible();
    await page.getByRole('button', { name: '¡GIRAR!' }).click();
    await expect(page.getByText(/· Nivel/)).toBeVisible({ timeout: 30_000 });
    for (const text of ['Correcta', 'Incorrecta A', 'Incorrecta B', 'Incorrecta C']) {
      await expect(page.getByRole('button', { name: text, exact: true })).toBeVisible();
    }
    await expect(page.getByRole('status').filter({ hasText: 'Respuesta' })).toHaveCount(0);
  });
});
