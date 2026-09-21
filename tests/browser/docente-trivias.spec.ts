import { expect, test } from './fixtures';
import { adminDb, createTeacher, seedTrivia, signInAs, watchProblems } from './helpers';

test.describe('Panel docente: Mis trivias', () => {
  test('sin sesión no muestra ninguna trivia', async ({ page }) => {
    const problems = watchProblems(page);
    await page.goto('/docente/trivias');
    await expect(page.getByText('Debes estar logueado para crear una trivia personalizada.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mis trivias' })).toHaveCount(0);
    expect(problems).toEqual([]);
  });

  test('con sesión la lista llega desde el servidor, sin parpadeo ni errores de hidratación', async ({ page }) => {
    const teacher = await createTeacher();
    await seedTrivia(teacher.uid, 'Trivia sembrada del docente');
    await signInAs(page, teacher.uid);

    // Lo que devuelve el SERVIDOR (con la cookie del navegador), antes de que corra cualquier JavaScript.
    const serverHtml = await (await page.request.get('/docente/trivias')).text();
    expect(serverHtml).toContain('Trivia sembrada del docente');
    expect(serverHtml).not.toContain('Debes estar logueado');

    const problems = watchProblems(page);
    await page.goto('/docente/trivias');
    await expect(page.getByRole('heading', { name: 'Mis trivias' })).toBeVisible();
    await expect(page.getByText('Trivia sembrada del docente').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('4 partidas').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('Debes estar logueado')).toHaveCount(0);
    // Dar tiempo a que termine la hidratación y se vea cualquier desajuste.
    // (`networkidle` no sirve: Firestore y el servidor de desarrollo mantienen conexiones abiertas.)
    await page.waitForTimeout(2000);
    expect(problems).toEqual([]);
  });

  test('un docente no ve las trivias de otro', async ({ page }) => {
    const ana = await createTeacher();
    const beto = await createTeacher();
    await seedTrivia(ana.uid, 'Trivia SECRETA de Ana');
    await seedTrivia(beto.uid, 'Trivia de Beto');
    await signInAs(page, beto.uid);
    await page.goto('/docente/trivias');
    await expect(page.getByText('Trivia de Beto').filter({ visible: true })).toBeVisible();
    await expect(page.getByText('Trivia SECRETA de Ana')).toHaveCount(0);
  });

  test('crear, duplicar, editar y borrar una trivia', async ({ page }) => {
    const teacher = await createTeacher();
    await signInAs(page, teacher.uid);
    const problems = watchProblems(page);
    await page.goto('/docente/trivias');
    await expect(page.getByText('Aún no creaste ninguna trivia').filter({ visible: true })).toBeVisible();

    // ── Crear ──
    await page.getByRole('button', { name: 'Crear trivia' }).first().click();
    await expect(page.getByRole('heading', { name: 'Crear nueva trivia' })).toBeVisible();
    await page.locator('#trivia-name').fill('Trivia creada en el navegador');
    // El banco de preguntas se carga desde Firestore (reglas reales).
    const checkboxes = page.getByRole('checkbox');
    await expect(checkboxes.first()).toBeVisible();
    for (let i = 0; i < 3; i++) await checkboxes.nth(i).check();
    await page.getByRole('button', { name: 'Crear trivia', exact: true }).click();
    await expect(page.getByText('¡Trivia creada exitosamente!')).toBeVisible();
    // Tras crear, el formulario queda abierto (y vacío): se vuelve a la lista con "Cancelar".
    await expect(page.locator('#trivia-name')).toHaveValue('');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Trivia creada en el navegador' })).toBeVisible();

    const created = await adminDb().collection('trivia').where('author', '==', teacher.uid).get();
    expect(created.size).toBe(1);
    expect(created.docs[0].data()).toMatchObject({ name: 'Trivia creada en el navegador', author: teacher.uid, isPublic: true, playCount: 0 });
    expect(created.docs[0].data().questions).toHaveLength(3);

    // ── Duplicar ──
    await page.getByRole('button', { name: 'Duplicar trivia' }).click();
    await expect(page.getByText('Trivia duplicada exitosamente')).toBeVisible();
    await expect(page.getByText('Trivia creada en el navegador (copia)')).toBeVisible();
    const afterDuplicate = await adminDb().collection('trivia').where('author', '==', teacher.uid).get();
    expect(afterDuplicate.size).toBe(2);
    const copy = afterDuplicate.docs.find((d) => d.data().name.endsWith('(copia)'))!.data();
    expect(copy).toMatchObject({ isPublic: true, source: 'usuario', level: 1, playCount: 0 }); // se copian todos los campos, no solo los visibles

    // ── Editar (la copia) ──
    const copyRow = page.locator('div', { hasText: 'Trivia creada en el navegador (copia)' }).filter({ has: page.getByRole('button', { name: 'Editar trivia' }) }).last();
    await copyRow.getByRole('button', { name: 'Editar trivia' }).click();
    await expect(page.getByRole('heading', { name: 'Editar trivia' })).toBeVisible();
    await page.locator('#trivia-name').fill('Trivia editada');
    await page.getByRole('button', { name: 'Actualizar trivia' }).click();
    await expect(page.getByText('¡Trivia actualizada exitosamente!')).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Trivia editada', exact: true })).toBeVisible();

    // ── Borrar ──
    const editedRow = page.locator('div', { hasText: 'Trivia editada' }).filter({ has: page.getByRole('button', { name: 'Eliminar trivia' }) }).last();
    await editedRow.getByRole('button', { name: 'Eliminar trivia' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar', exact: true }).click();
    await expect(page.getByText('¡Trivia eliminada exitosamente!')).toBeVisible();
    await expect(page.getByText('Trivia editada', { exact: true })).toHaveCount(0);
    const afterDelete = await adminDb().collection('trivia').where('author', '==', teacher.uid).get();
    expect(afterDelete.size).toBe(1);

    expect(problems).toEqual([]);
  });
});
