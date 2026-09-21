// Prueba de punta a punta de la sesión del servidor (lib/session.ts) contra un
// servidor Next real y los emuladores de Auth y Firestore.
//
//   npm run test:session
//
// Necesita Java (emuladores). La primera compilación de `next dev` tarda.
import { spawn } from 'child_process';
import { createHmac, generateKeyPairSync, randomBytes } from 'crypto';

const PORT = 3111;
const BASE = `http://127.0.0.1:${PORT}`;
const SECRET = randomBytes(48).toString('base64');
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });

const env = {
  ...process.env,
  PORT: String(PORT),
  SESSION_SECRET: SECRET,
  FIREBASE_ADMIN_PROJECT_ID: 'demo-cresi',
  FIREBASE_ADMIN_CLIENT_EMAIL: 'x@demo-cresi.iam.gserviceaccount.com',
  FIREBASE_ADMIN_PRIVATE_KEY: privateKey.replace(/\n/g, '\\n'),
  NEXT_PUBLIC_FIREBASE_API_KEY: 'x',
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'demo-cresi.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'demo-cresi',
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'demo-cresi.appspot.com',
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '1',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:1:web:1',
  NEXT_TELEMETRY_DISABLED: '1',
};

const isWindows = process.platform === 'win32';
const server = spawn('npx', ['next', 'dev', '-p', String(PORT)], { cwd: process.cwd(), env, shell: true, detached: !isWindows, stdio: ['ignore', 'pipe', 'pipe'] });
let serverLog = '';
server.stdout.on('data', (d) => (serverLog += d));
server.stderr.on('data', (d) => (serverLog += d));
// Hay que matar todo el árbol: `npx` lanza a `next`, que lanza a sus workers.
const stop = () => {
  try {
    if (isWindows) spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { shell: true });
    else process.kill(-server.pid, 'SIGKILL');
  } catch {}
};

let fail = 0;
const check = (name, cond, extra) => { if (!cond) fail++; console.log(cond ? 'ok  ' : 'FAIL', name, cond ? '' : String(extra).slice(0, 400)); };

const b64 = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v)).toString('base64url');
const forge = (uid, { secret = SECRET, iat = Math.floor(Date.now() / 1000), exp = iat + 7200 } = {}) => {
  const h = b64({ alg: 'HS256', typ: 'JWT' });
  const p = b64({ uid, iat, exp });
  return `${h}.${p}.${createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url')}`;
};
const page = async (cookie) => {
  const res = await fetch(`${BASE}/docente/nube-de-palabras`, { headers: cookie ? { cookie: `cresi_session=${cookie}` } : {}, redirect: 'manual' });
  return { status: res.status, html: await res.text() };
};
const signUp = async (email) => {
  const r = await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(email ? { email, password: '123456' } : { returnSecureToken: true }) });
  return await r.json();
};
const setCookieOf = (res) => (res.headers.getSetCookie?.() ?? []).find((c) => c.startsWith('cresi_session=')) ?? '';

try {
  // esperar al servidor (la primera compilación de Next tarda)
  const t0 = Date.now();
  let up = false;
  while (Date.now() - t0 < 180000) {
    try { const r = await fetch(`${BASE}/api/session`, { method: 'POST' }); if (r.status) { up = true; break; } } catch {}
    await new Promise((r) => setTimeout(r, 1500));
  }
  check('el servidor Next levantó', up, serverLog.slice(-800));
  if (!up) throw new Error('sin servidor');

  const { getApps, initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  if (!getApps().length) initializeApp({ credential: cert({ projectId: 'demo-cresi', clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL, privateKey }) });
  const db = getFirestore();

  const teacher = await signUp('prof@x.com');
  const other = await signUp('otra@x.com');
  const anon = await signUp(null);
  await db.collection('wordclouds').doc('AAAAA').set({ code: 'AAAAA', title: 'Consigna de la profe', teacherId: teacher.localId, active: true, createdAt: '2026-01-02T00:00:00Z' });
  await db.collection('wordclouds').doc('BBBBB').set({ code: 'BBBBB', title: 'Otra consigna de la profe', teacherId: teacher.localId, active: false, createdAt: '2026-01-01T00:00:00Z' });
  await db.collection('wordclouds').doc('CCCCC').set({ code: 'CCCCC', title: 'SECRETO de otra docente', teacherId: other.localId, active: true, createdAt: '2026-01-03T00:00:00Z' });

  // ── /api/session ──
  let res = await fetch(`${BASE}/api/session`, { method: 'POST' });
  check('POST sin token → 401', res.status === 401, res.status);
  res = await fetch(`${BASE}/api/session`, { method: 'POST', headers: { authorization: 'Bearer basura' } });
  check('POST con token basura → 401', res.status === 401, res.status);
  res = await fetch(`${BASE}/api/session`, { method: 'POST', headers: { authorization: `Bearer ${anon.idToken}` } });
  check('POST de un usuario anónimo → 403 (no se le emite sesión)', res.status === 403 && !setCookieOf(res), res.status);

  res = await fetch(`${BASE}/api/session`, { method: 'POST', headers: { authorization: `Bearer ${teacher.idToken}` } });
  const cookieHeader = setCookieOf(res);
  check('POST válido → 200', res.status === 200, res.status);
  check('la cookie es HttpOnly', /HttpOnly/i.test(cookieHeader), cookieHeader);
  check('la cookie es SameSite=Lax y Path=/', /SameSite=lax/i.test(cookieHeader) && /Path=\//i.test(cookieHeader), cookieHeader);
  check('la cookie dura 2 horas', /Max-Age=7200/i.test(cookieHeader), cookieHeader);
  check('la respuesta no se cachea', (res.headers.get('cache-control') ?? '').includes('no-store'));
  const cookie = cookieHeader.split(';')[0].split('=').slice(1).join('=');

  // ── página renderizada en el servidor ──
  let p = await page(null);
  check('sin cookie: la página pide iniciar sesión', p.status === 200 && p.html.includes('Debes estar logueado'), p.status);
  check('sin cookie: no hay ninguna consigna en el HTML', !p.html.includes('Consigna de la profe') && !p.html.includes('SECRETO'));

  p = await page(cookie);
  check('con cookie: llegan SUS nubes ya en el HTML', p.html.includes('Consigna de la profe') && p.html.includes('Otra consigna de la profe'), p.html.slice(0, 300));
  check('con cookie: NO aparece la nube de otra docente', !p.html.includes('SECRETO'));
  check('con cookie: ya no muestra "Debes estar logueado"', !p.html.includes('Debes estar logueado'));
  check('con cookie: el contador dice 2/5', /2\/5/.test(p.html.replace(/<!-- -->/g, '')), '');

  // ── falsificaciones ──
  p = await page(cookie.slice(0, -3) + 'xyz');
  check('cookie con la firma alterada → como si no hubiera sesión', p.html.includes('Debes estar logueado') && !p.html.includes('Consigna de la profe'));
  p = await page(forge(teacher.localId, { secret: 'un-secreto-que-no-es-el-real-1234567890' }));
  check('cookie firmada con otro secreto → sin sesión', p.html.includes('Debes estar logueado'));
  p = await page(forge(teacher.localId, { iat: Math.floor(Date.now() / 1000) - 8000, exp: Math.floor(Date.now() / 1000) - 800 }));
  check('cookie vencida → sin sesión', p.html.includes('Debes estar logueado'));
  p = await page('esto.no.es.un.token');
  check('cookie basura → sin sesión (y sin romper la página)', p.status === 200 && p.html.includes('Debes estar logueado'));

  // ── aislamiento entre usuarios ──
  p = await page(forge(other.localId));
  check('la otra docente ve SOLO lo suyo', p.html.includes('SECRETO de otra docente') && !p.html.includes('Consigna de la profe'));
  p = await page(forge('uid-sin-nubes'));
  check('un usuario sin nubes ve la lista vacía', p.html.includes('Todavía no creaste ninguna') && !p.html.includes('SECRETO'));

  // ── cierre de sesión ──
  res = await fetch(`${BASE}/api/session`, { method: 'DELETE' });
  const cleared = setCookieOf(res);
  check('DELETE borra la cookie', res.status === 200 && (/Max-Age=0/i.test(cleared) || /Expires=Thu, 01 Jan 1970/i.test(cleared)), cleared);
} catch (err) {
  fail++;
  console.log('ERROR', err);
} finally {
  stop();
  console.log(fail ? `\n${fail} FALLOS` : '\ntodo ok');
  setTimeout(() => process.exit(fail ? 1 : 0), 1500);
}
