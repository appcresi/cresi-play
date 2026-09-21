// lib/securityHeaders.js
//
// Encabezados de seguridad de todas las respuestas (los aplica next.config.js).
// Es .js (no .ts) a propósito: next.config.js lo carga directamente con
// `require`, sin pasar por el compilador de TypeScript. Las pruebas están en
// lib/securityHeaders.test.ts.
//
// ── Lo que se APLICA ya ───────────────────────────────────────────────────
//   X-Content-Type-Options  nosniff: el navegador no adivina el tipo de un archivo.
//   Referrer-Policy         a otros sitios solo se manda el origen, no la ruta
//                           completa (que puede llevar códigos de clase).
//   Permissions-Policy      cámara, micrófono, geolocalización y pagos cerrados:
//                           el sitio no usa ninguno.
//   X-Frame-Options         SAMEORIGIN: nadie puede meter el sitio en un iframe
//                           ajeno (clickjacking). No se usan iframes propios.
//   (No se agrega HSTS: Vercel ya lo pone. Tampoco COOP: rompe el popup de
//    inicio de sesión con Google.)
//
// ── Lo que se OBSERVA por ahora ───────────────────────────────────────────
//   Content-Security-Policy-Report-Only: el navegador NO bloquea nada, solo
//   informa a /api/csp-report qué habría bloqueado. El sitio carga Google
//   Analytics, AdSense y Firebase, y AdSense en particular abre muchos
//   dominios: una política que bloquea sin haberla observado rompe anuncios,
//   analytics o el inicio de sesión. Cuando el log (`CSP (observación)`) lleve
//   unos días sin líneas de cosas legítimas, se pasa a modo que bloquea con
//   una sola variable de entorno: CSP_ENFORCE=1 (Vercel → Environment
//   Variables, y volver a desplegar). Eso cambia el encabezado a
//   `Content-Security-Policy` y suma `upgrade-insecure-requests`, que solo
//   tiene sentido al bloquear (en observación el navegador lo ignora y avisa
//   en la consola de cada visitante). Para volver atrás: quitar la variable.
//
// `script-src` lleva 'unsafe-inline' porque Next inyecta scripts en línea y
// una política con nonce obligaría a renderizar TODAS las páginas de forma
// dinámica (se perdería la generación estática). Aun así la política cierra lo
// importante: qué DOMINIOS pueden cargar scripts, `object-src`, `base-uri`,
// `form-action` y `frame-ancestors`.

const GOOGLE_SCRIPTS = [
  'https://www.googletagmanager.com',
  'https://pagead2.googlesyndication.com',
  'https://*.googlesyndication.com',
  'https://*.doubleclick.net',
  'https://*.adtrafficquality.google',
  'https://apis.google.com',
  'https://*.gstatic.com',
  'https://*.google.com',
];

const GOOGLE_CONNECT = [
  'https://*.googleapis.com', // Firestore, Auth (identitytoolkit, securetoken)
  'https://*.firebaseio.com',
  'wss://*.firebaseio.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
  'https://*.googletagmanager.com',
  'https://*.doubleclick.net',
  'https://*.googlesyndication.com',
  'https://*.adtrafficquality.google',
  'https://*.gstatic.com',
  'https://*.google.com',
];

const GOOGLE_FRAMES = [
  'https://accounts.google.com',
  'https://*.firebaseapp.com',
  'https://*.google.com',
  'https://*.doubleclick.net',
  'https://*.googlesyndication.com',
  'https://*.adtrafficquality.google',
];

/**
 * @param {{ dev?: boolean, emulators?: boolean, authDomain?: string, enforce?: boolean }} options
 *   dev        `next dev`: hace falta 'unsafe-eval' (recarga en caliente) y WebSockets locales.
 *   emulators  pruebas en navegador (NEXT_PUBLIC_E2E_EMULATORS=1): habla con los emuladores locales.
 *   authDomain dominio de autenticación de Firebase (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN).
 *   enforce    la política BLOQUEA (CSP_ENFORCE=1): recién ahí se suma `upgrade-insecure-requests`.
 */
function buildCsp({ dev = false, emulators = false, authDomain = '', enforce = false } = {}) {
  const script = ["'self'", "'unsafe-inline'", ...GOOGLE_SCRIPTS];
  const connect = ["'self'", ...GOOGLE_CONNECT];
  const frames = ["'self'", ...GOOGLE_FRAMES];

  if (authDomain) {
    // El popup y el iframe de inicio de sesión salen del dominio de auth del proyecto.
    frames.push(`https://${authDomain}`);
    connect.push(`https://${authDomain}`);
  }
  if (dev) {
    script.push("'unsafe-eval'");
    connect.push('ws://localhost:*', 'ws://127.0.0.1:*', 'http://localhost:*');
  }
  if (emulators) {
    connect.push('http://127.0.0.1:*', 'ws://127.0.0.1:*');
  }

  const directives = {
    'default-src': ["'self'"],
    'script-src': script,
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': connect,
    'frame-src': frames,
    'media-src': ["'self'", 'data:', 'blob:', 'https:'],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'self'"],
  };

  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(' ')}`);
  // Solo al bloquear: en modo observación el navegador la ignora y lo dice en la consola.
  if (enforce && !dev) parts.push('upgrade-insecure-requests');
  parts.push('report-uri /api/csp-report');
  return parts.join('; ');
}

/** Lista para `headers()` de next.config.js. */
function securityHeaders(options = {}) {
  return [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    // Por defecto SOLO observación; con `enforce` (CSP_ENFORCE=1) bloquea. Ver el comentario del principio.
    {
      key: options.enforce ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
      value: buildCsp(options),
    },
  ];
}

module.exports = { buildCsp, securityHeaders };
