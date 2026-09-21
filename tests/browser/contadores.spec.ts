import { expect, test } from './fixtures';
import { adminDb, createTeacher, seedTrivia, watchProblems } from './helpers';

// Los contadores públicos (partidas, preguntas) ya no se escriben desde el
// navegador a Firestore: los suma /api/track. Estas pruebas comprueban el
// recorrido completo — página → /api/track → Admin SDK → documento — y que
// las reglas cerradas no rompen el juego de quien entra sin cuenta (que el
// navegador no pueda escribirlos lo cubren los tests de reglas).
test.describe('Contadores públicos por /api/track', () => {
  test('jugar una trivia sin cuenta suma una partida y una pregunta', async ({ page }) => {
    const teacher = await createTeacher();
    const triviaId = await seedTrivia(teacher.uid, 'Trivia para contar');
    const problems = watchProblems(page);
    const trackCalls: number[] = [];
    page.on('response', (r) => {
      if (r.url().endsWith('/api/track')) trackCalls.push(r.status());
    });

    await page.goto(`/trivias/${triviaId}`);
    const doc = () => adminDb().collection('trivia').doc(triviaId).get();

    // La partida se cuenta al cargar (sembrada con playCount: 4).
    await expect.poll(async () => (await doc()).data()?.playCount, { timeout: 20_000 }).toBe(5);

    // Y al responder una pregunta se cuenta en questionStats.
    await page.getByRole('button', { name: 'Correcta', exact: true }).filter({ visible: true }).first().click();
    await expect
      .poll(async () => Object.values((await doc()).data()?.questionStats ?? {}).length, { timeout: 20_000 })
      .toBe(1);
    const stats = Object.values((await doc()).data()?.questionStats ?? {}) as Array<{ shown: number; wrong: number }>;
    expect(stats[0]).toEqual({ shown: 1, wrong: 0 });

    expect(trackCalls.length).toBeGreaterThanOrEqual(2);
    expect(trackCalls.every((s) => s === 204)).toBe(true);
    expect(problems).toEqual([]);
  });
});
