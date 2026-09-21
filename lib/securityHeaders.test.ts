import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { buildCsp, securityHeaders } = require('./securityHeaders') as {
  buildCsp: (o?: { dev?: boolean; emulators?: boolean; authDomain?: string; enforce?: boolean }) => string;
  securityHeaders: (o?: { dev?: boolean; emulators?: boolean; authDomain?: string; enforce?: boolean }) => Array<{ key: string; value: string }>;
};

const directive = (csp: string, name: string) => csp.split('; ').find((d) => d.startsWith(name + ' '))?.slice(name.length + 1) ?? '';

describe('securityHeaders', () => {
  const headers = securityHeaders({ authDomain: 'proyecto.firebaseapp.com' });
  const get = (key: string) => headers.find((h) => h.key === key)?.value;

  it('trae los encabezados que se aplican ya', () => {
    expect(get('X-Content-Type-Options')).toBe('nosniff');
    expect(get('X-Frame-Options')).toBe('SAMEORIGIN');
    expect(get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
  });

  it('cierra cámara, micrófono, geolocalización y pagos', () => {
    const p = get('Permissions-Policy')!;
    for (const feature of ['camera', 'microphone', 'geolocation', 'payment']) expect(p).toContain(`${feature}=()`);
  });

  it('la política de contenido va en modo SOLO OBSERVACIÓN (no bloquea)', () => {
    expect(get('Content-Security-Policy-Report-Only')).toBeTruthy();
    expect(get('Content-Security-Policy')).toBeUndefined();
  });

  it('no pone COOP (rompería el popup de Google) ni HSTS (lo pone Vercel)', () => {
    expect(get('Cross-Origin-Opener-Policy')).toBeUndefined();
    expect(get('Strict-Transport-Security')).toBeUndefined();
  });
});

describe('buildCsp (producción)', () => {
  const csp = buildCsp({ authDomain: 'proyecto.firebaseapp.com' });

  it('cierra lo importante', () => {
    expect(directive(csp, 'default-src')).toBe("'self'");
    expect(directive(csp, 'object-src')).toBe("'none'");
    expect(directive(csp, 'base-uri')).toBe("'self'");
    expect(directive(csp, 'form-action')).toBe("'self'");
    expect(directive(csp, 'frame-ancestors')).toBe("'self'");
  });

  it('permite lo que el sitio usa: Analytics, AdSense y Firebase', () => {
    expect(directive(csp, 'script-src')).toContain('https://www.googletagmanager.com');
    expect(directive(csp, 'script-src')).toContain('https://pagead2.googlesyndication.com');
    expect(directive(csp, 'connect-src')).toContain('https://*.googleapis.com');
    expect(directive(csp, 'connect-src')).toContain('https://*.google-analytics.com');
    expect(directive(csp, 'frame-src')).toContain('https://accounts.google.com');
  });

  it('agrega el dominio de autenticación del proyecto para el popup de inicio de sesión', () => {
    expect(directive(csp, 'frame-src')).toContain('https://proyecto.firebaseapp.com');
    expect(directive(csp, 'connect-src')).toContain('https://proyecto.firebaseapp.com');
  });

  it('en producción NO permite eval ni WebSockets locales', () => {
    expect(directive(csp, 'script-src')).not.toContain('unsafe-eval');
    expect(csp).not.toContain('localhost');
    expect(csp).not.toContain('127.0.0.1');
  });

  it('informa a /api/csp-report', () => {
    expect(csp).toContain('report-uri /api/csp-report');
  });

  it('en observación NO lleva upgrade-insecure-requests (el navegador la ignora y avisa en la consola de cada visitante)', () => {
    expect(csp).not.toContain('upgrade-insecure-requests');
  });

  it('no deja abierto "*" en scripts ni en conexiones', () => {
    for (const d of ['script-src', 'connect-src', 'frame-src']) {
      expect(directive(csp, d).split(' ')).not.toContain('*');
    }
  });
});

describe('buildCsp (desarrollo y pruebas)', () => {
  it('en desarrollo permite eval y WebSockets locales (la recarga en caliente los necesita)', () => {
    const csp = buildCsp({ dev: true });
    expect(directive(csp, 'script-src')).toContain("'unsafe-eval'");
    expect(directive(csp, 'connect-src')).toContain('ws://localhost:*');
    expect(csp).not.toContain('upgrade-insecure-requests'); // en localhost es http
  });

  it('en desarrollo no fuerza https ni siquiera al bloquear (localhost es http)', () => {
    expect(buildCsp({ dev: true, enforce: true })).not.toContain('upgrade-insecure-requests');
  });

  it('las pruebas en navegador habilitan los emuladores locales, pero solo con esa opción', () => {
    expect(directive(buildCsp({ emulators: true }), 'connect-src')).toContain('http://127.0.0.1:*');
    expect(directive(buildCsp({}), 'connect-src')).not.toContain('127.0.0.1');
  });
});

describe('modo que bloquea (CSP_ENFORCE=1)', () => {
  const enforcing = securityHeaders({ enforce: true, authDomain: 'p.firebaseapp.com' });
  const get = (key: string) => enforcing.find((h) => h.key === key)?.value;

  it('usa Content-Security-Policy y deja de usar Report-Only', () => {
    expect(get('Content-Security-Policy')).toBeTruthy();
    expect(get('Content-Security-Policy-Report-Only')).toBeUndefined();
  });

  it('suma upgrade-insecure-requests recién al bloquear', () => {
    expect(get('Content-Security-Policy')).toContain('upgrade-insecure-requests');
  });

  it('la política es la MISMA que en observación (solo cambia el encabezado): lo observado vale para lo que se bloquea', () => {
    const observing = securityHeaders({ authDomain: 'p.firebaseapp.com' }).find((h) => h.key === 'Content-Security-Policy-Report-Only')!.value;
    expect(get('Content-Security-Policy')!.replace('; upgrade-insecure-requests', '')).toBe(observing);
  });
});
