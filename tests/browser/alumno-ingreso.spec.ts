import { randomBytes } from 'crypto';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import { adminAuth, adminDb, watchProblems } from './helpers';

// Ingreso de un alumno con código de clase, usuario y contraseña (/clase/[codigo]):
// pasa por /api/join-class, el límite de intentos y el inicio de sesión con token.
async function seedClass() {
  const code = randomBytes(3).toString('hex').toUpperCase();
  const classId = `clase-${code}`;
  const db = adminDb();
  await db.collection('classrooms').doc(classId).set({ code, name: 'Clase de prueba', profesorId: 'un-docente' });
  await db
    .collection('classrooms')
    .doc(classId)
    .collection('estudiantesPendientes')
    .doc(`al-${code}`)
    .set({ username: 'Lucía', password: 'clave-lucia', claimed: false, claimedUid: null });
  return { code, classId, studentUid: `al-${code}` };
}

async function fillAndJoin(page: Page, code: string, username: string, password: string) {
  await page.goto(`/clase/${code}`);
  await page.getByPlaceholder('El usuario que te dio tu docente').fill(username);
  await page.getByPlaceholder('La contraseña que te dio tu docente').fill(password);
  await page.getByRole('button', { name: 'Aventurero' }).click();
  await page.getByRole('button', { name: 'Unirme a la clase' }).click();
}

test.describe('Ingreso de un alumno a su clase', () => {
  test('con usuario y contraseña correctos entra al escritorio y queda registrado en la clase', async ({ page }) => {
    const { code, classId, studentUid } = await seedClass();
    const problems = watchProblems(page);
    await fillAndJoin(page, code, 'lucía', 'clave-lucia'); // el usuario no distingue mayúsculas
    await page.waitForURL('**/escritorio');

    const student = await adminDb().collection('classrooms').doc(classId).collection('estudiantes').doc(studentUid).get();
    expect(student.exists).toBe(true);
    expect(student.data()).toMatchObject({ addedManually: true });
    // Entró con un token: Firebase creó su cuenta con el uid estable del alumno. (Su documento
    // `users/{uid}` se crea recién en el primer guardado de progreso, no al ingresar.)
    expect((await adminAuth().getUser(studentUid)).uid).toBe(studentUid);

    // La contraseña vieja (texto plano) se cifró al primer ingreso.
    const pending = (
      await adminDb().collection('classrooms').doc(classId).collection('estudiantesPendientes').doc(studentUid).get()
    ).data()!;
    expect(pending.password).toBeUndefined();
    expect(String(pending.passwordEnc)).toMatch(/^v1\./);

    await page.waitForTimeout(2000);
    expect(problems).toEqual([]);
  });

  test('con contraseña incorrecta muestra el error y no entra', async ({ page }) => {
    const { code } = await seedClass();
    await fillAndJoin(page, code, 'Lucía', 'incorrecta');
    await expect(page.getByText('Usuario o contraseña incorrectos')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/clase/${code}$`));
  });

  test('con un código que no existe lo dice', async ({ page }) => {
    await fillAndJoin(page, 'ZZZZZZ', 'Lucía', 'clave-lucia');
    await expect(page.getByText('Código inválido')).toBeVisible();
  });

  test('tras demasiados intentos fallidos avisa cuánto esperar, aun con la contraseña correcta', async ({ page, request }) => {
    const { code } = await seedClass();
    for (let i = 0; i < 10; i++) {
      const res = await request.post('/api/join-class', {
        data: { code, username: 'Lucía', password: `mala-${i}` },
        headers: { 'x-forwarded-for': `9.9.9.${i}` },
      });
      expect(res.status()).toBe(401);
    }
    await fillAndJoin(page, code, 'Lucía', 'clave-lucia');
    await expect(page.getByText(/Hiciste demasiados intentos\. Esperá \d+ minutos? y probá de nuevo\./)).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`/clase/${code}$`));
  });
});
