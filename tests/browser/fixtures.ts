// `test` de Playwright con el aviso de cookies ya resuelto. El aviso queda fijo
// abajo y TAPA botones de las pantallas (por ejemplo "Crear trivia" del panel
// docente) hasta que el usuario lo acepta o rechaza; una prueba tiene que
// empezar como un usuario que ya decidió. La clave es la de components/CookieConsent.tsx.
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      try {
        localStorage.setItem('cresi_cookie_consent', 'rejected');
      } catch {
        // sin localStorage
      }
    });
    await use(context);
  },
});

export { expect };
