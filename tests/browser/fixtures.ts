// `test` de Playwright con el aviso de cookies ya resuelto. El aviso queda fijo
// abajo y TAPA botones de las pantallas (por ejemplo "Crear trivia" del panel
// docente) hasta que el usuario lo acepta o rechaza; una prueba tiene que
// empezar como un usuario que ya decidió. La clave es la de components/CookieConsent.tsx.
import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  // Toda prueba falla si la política de seguridad (CSP, en modo observación) informa una
  // violación con las funciones PROPIAS del sitio (Firebase, fuentes, imágenes…): significaría
  // que al pasar a modo bloqueo se rompería algo. Chrome las muestra en la consola como
  // "[Report Only] Refused to …".
  page: async ({ page }, use) => {
    const violations: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('[Report Only]') || /Refused to|Content Security Policy/i.test(text)) violations.push(text.slice(0, 220));
    });
    await use(page);
    expect(violations, 'La política de seguridad (CSP) informó violaciones').toEqual([]);
  },
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
