import { randomBytes } from 'crypto';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { adminDb, createTeacher, seedTrivia, watchProblems } from './helpers';

// Racha diaria, reto del día, pantalla final "qué sigue" y eventos de
// analítica (medir abandono y regreso). Todo con un alumno que entró con el
// código de su clase, que es el caso de uso principal.

async function joinAsStudent(page: Page): Promise<void> {
  const code = randomBytes(3).toString('hex').toUpperCase();
  await adminDb().collection('classrooms').doc(`clase-${code}`).set({ code, name: 'Clase de prueba', profesorId: 'un-docente' });
  await adminDb()
    .collection('classrooms')
    .doc(`clase-${code}`)
    .collection('estudiantesPendientes')
    .doc(`al-${code}`)
    .set({ username: 'Lucía', password: 'clave-lucia', claimed: false, claimedUid: null });

  await page.goto(`/clase/${code}`);
  await page.getByPlaceholder('El usuario que te dio tu docente').fill('Lucía');
  await page.getByPlaceholder('La contraseña que te dio tu docente').fill('clave-lucia');
  await page.getByRole('button', { name: 'Aventurero' }).click();
  await page.getByRole('button', { name: 'Unirme a la clase' }).click();
  await page.waitForURL('**/escritorio');
}

/**
 * Google Analytics no carga (no hay consentimiento): se guarda en localStorage
 * lo que se le mandaría. Así sobrevive a las navegaciones completas, donde la
 * consola de la página se pierde justo cuando se dispara el evento de salida.
 */
async function captureAnalytics(page: Page): Promise<void> {
  await page.addInitScript(() => {
    (window as unknown as { gtag: (...a: unknown[]) => void }).gtag = (...a: unknown[]) => {
      const sent = JSON.parse(localStorage.getItem('__gtag') ?? '[]');
      sent.push(a);
      localStorage.setItem('__gtag', JSON.stringify(sent));
    };
  });
}

type Sent = [string, string, Record<string, unknown> | undefined];
const analytics = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('__gtag') ?? '[]') as Sent[]);
const names = (sent: Sent[]) => sent.map((e) => e[1]);
const paramsOf = (sent: Sent[], name: string) => sent.find((e) => e[1] === name)?.[2];

test.describe('Racha diaria y "qué sigue"', () => {
  test('la home del alumno muestra la racha y el reto del día', async ({ page }) => {
    const problems = watchProblems(page);
    await joinAsStudent(page);
    await expect(page.getByText('Sin racha todavía').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('Reto del día').filter({ visible: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Jugar/ }).filter({ visible: true }).first()).toBeVisible();
    await page.waitForTimeout(1500);
    expect(problems).toEqual([]);
  });

  test('terminar una trivia suma el día, muestra qué sigue y lo registra en Analytics', async ({ page }) => {
    const teacher = await createTeacher();
    const triviaId = await seedTrivia(teacher.uid, 'Trivia de la racha');
    await captureAnalytics(page);
    await joinAsStudent(page);

    await page.goto(`/trivias/${triviaId}`);
    for (let n = 1; n <= 3; n++) {
      await expect(page.getByText(`Pregunta ${n} de 3`).filter({ visible: true }).first()).toBeVisible();
      await page.getByRole('button', { name: 'Correcta', exact: true }).filter({ visible: true }).first().click();
    }

    const sheet = page.getByRole('status', { name: 'Qué sigue' });
    await expect(sheet).toBeVisible({ timeout: 20_000 });
    await expect(sheet).toContainText('¡Terminaste Trivias!');
    await expect(sheet).toContainText('1 día seguido.');
    await expect(sheet.getByRole('link', { name: 'Ir al inicio' })).toBeVisible();

    // Se guardó la racha del alumno.
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('cresi_user_data') ?? '{}'));
    expect(stored.progress.activityStreak.current).toBe(1);
    expect(stored.game.streak).toBe(1);

    // Medición: fin de la trivia, día activo y tarjeta mostrada.
    const events = await analytics(page);
    expect(names(events)).toEqual(expect.arrayContaining(['trivia_completed', 'activity_finished', 'streak_day', 'next_steps_shown']));
    expect(paramsOf(events, 'activity_finished')).toMatchObject({ activity_title: 'Trivias' });
    expect(paramsOf(events, 'streak_day')).toMatchObject({ days: 1, status: 'first' });
    expect(names(events)).not.toContain('trivia_abandoned');

    // La tarjeta se cierra, y en la home ahora se ve la racha.
    await sheet.getByRole('button', { name: 'Cerrar' }).click();
    await expect(sheet).toHaveCount(0);
    await page.goto('/escritorio');
    await expect(page.getByText('1 día seguido', { exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByText('¡Ya sumaste hoy!').filter({ visible: true })).toBeVisible();
  });

  test('irse a mitad de una trivia registra en qué pregunta se quedó', async ({ page }) => {
    const teacher = await createTeacher();
    const triviaId = await seedTrivia(teacher.uid, 'Trivia abandonada');
    await captureAnalytics(page);
    await joinAsStudent(page);

    await page.goto(`/trivias/${triviaId}`);
    await expect(page.getByText('Pregunta 1 de 3').filter({ visible: true }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Correcta', exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByText('Pregunta 2 de 3').filter({ visible: true }).first()).toBeVisible();

    await page.goto('/escritorio'); // se va sin terminar
    await expect.poll(async () => names(await analytics(page))).toContain('trivia_abandoned');
    const events = await analytics(page);
    expect(paramsOf(events, 'trivia_abandoned')).toMatchObject({ trivia_id: triviaId, question: 1, of: 3 });
    expect(names(events)).not.toContain('activity_finished');
  });
});
