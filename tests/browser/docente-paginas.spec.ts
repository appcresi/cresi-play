import { expect, test } from './fixtures';
import { adminDb, createTeacher, seedTrivia, signInAs, watchProblems } from './helpers';

// NOTA: justo después de navegar, la transmisión progresiva del servidor puede dejar un instante
// una copia OCULTA del contenido junto a la visible; un `getByText` a secas rompe por "strict mode".
// Por eso las búsquedas de texto usan `.filter({ visible: true })`.
//
// Las cuatro páginas del panel docente que ahora se arman en el servidor: con
// sesión llegan con datos y sin errores de hidratación; sin sesión, no filtran nada.
const PAGES = [
  { ruta: '/docente/trivias', titulo: 'Mis trivias', sinSesion: 'Debes estar logueado para crear una trivia personalizada.' },
  { ruta: '/docente/completapalabras', titulo: 'Mis lecciones de Completa Palabras', sinSesion: 'Debés estar logueado para crear una lección de Completa Palabras.' },
  { ruta: '/docente/nube-de-palabras', titulo: 'Nube de Palabras', sinSesion: 'Debes estar logueado para crear una nube de palabras.' },
  { ruta: '/docente/trivia-en-vivo', titulo: 'Trivia en Vivo', sinSesion: 'Debes estar logueado para iniciar una partida en vivo.' },
];

for (const { ruta, titulo, sinSesion } of PAGES) {
  test.describe(ruta, () => {
    test('sin sesión pide iniciar sesión y no muestra el panel', async ({ page }) => {
      const problems = watchProblems(page);
      await page.goto(ruta);
      await expect(page.getByText(sinSesion).filter({ visible: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: titulo })).toHaveCount(0);
      expect(problems).toEqual([]);
    });

    test('con sesión se ve el panel, sin errores de hidratación', async ({ page }) => {
      const teacher = await createTeacher();
      await signInAs(page, teacher.uid);
      const problems = watchProblems(page);
      await page.goto(ruta);
      await expect(page.getByRole('heading', { name: titulo, level: 1 })).toBeVisible();
      await expect(page.getByText(sinSesion)).toHaveCount(0);
      await page.waitForTimeout(2000);
      expect(problems).toEqual([]);
    });
  });
}

test.describe('Nube de palabras: crear una sala', () => {
  test('crear una nube te lleva a su sala y queda en tu lista', async ({ page }) => {
    const teacher = await createTeacher();
    await signInAs(page, teacher.uid);
    await page.goto('/docente/nube-de-palabras');
    await expect(page.getByText('0/5 nubes usadas').filter({ visible: true })).toBeVisible();

    await page.locator('#wc-title').fill('¿Qué es el consentimiento?');
    await page.getByRole('button', { name: 'Crear nueva nube' }).click();
    await page.waitForURL(/\/docente\/nube-de-palabras\/[A-Z0-9]{5}$/);

    const docs = await adminDb().collection('wordclouds').where('teacherId', '==', teacher.uid).get();
    expect(docs.size).toBe(1);
    expect(docs.docs[0].data()).toMatchObject({ title: '¿Qué es el consentimiento?', active: true });

    // Al volver, la lista (armada en el servidor) ya trae la nube nueva.
    await page.goto('/docente/nube-de-palabras');
    await expect(page.getByText('¿Qué es el consentimiento?').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('1/5 nubes usadas').filter({ visible: true })).toBeVisible();
  });
});

test.describe('Trivia en vivo: elegir trivia', () => {
  test('el selector trae las trivias del docente', async ({ page }) => {
    const teacher = await createTeacher();
    await seedTrivia(teacher.uid, 'Trivia para jugar en vivo');
    await signInAs(page, teacher.uid);
    await page.goto('/docente/trivia-en-vivo');
    await expect(page.getByText('Trivia para jugar en vivo').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('Todavía no tenés trivias')).toHaveCount(0);
  });
});
