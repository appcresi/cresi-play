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
  PENDING_PASSWORD_KEY: randomBytes(32).toString('base64'),
  JWT_SECRET: 'secreto-de-prueba',
  HEALTH_TOKEN: 'token-de-salud-de-prueba',
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

  // ── /docente/trivias: misma sesión, otra página ──
  const { Timestamp } = await import('firebase-admin/firestore');
  const q = (n) => ({ question: `Pregunta ${n}`, answer: 'a', options: { first: 'a', second: 'b', third: 'c' }, resume: 'r' });
  await db.collection('trivia').doc('t-1').set({ id: 't-1', name: 'Trivia de la profe', author: teacher.localId, questions: [q(1), q(2), q(3)], playCount: 7, level: 1, isPublic: true, created_at: '2026-01-01T00:00:00Z' });
  // `Timestamp` real de Firestore: sin el sanitizador (lib/plain.ts) rompe el render del servidor.
  await db.collection('trivia').doc('t-2').set({ id: 't-2', name: 'Trivia con Timestamp', author: teacher.localId, questions: [q(1)], playCount: 1, created_at: Timestamp.fromDate(new Date('2026-02-03T04:05:06Z')) });
  await db.collection('trivia').doc('t-3').set({ id: 't-3', name: 'TRIVIA SECRETA de otra docente', author: other.localId, questions: [q(1)], playCount: 99 });
  await db.collection('trivia').doc('t-4').set({ id: 't-4', name: 'Trivia oficial de CrESI', author: 'CRESI', questions: [q(1)], playCount: 500 });

  const triviasPage = async (cookie) => {
    const r = await fetch(`${BASE}/docente/trivias`, { headers: cookie ? { cookie: `cresi_session=${cookie}` } : {}, redirect: 'manual' });
    return { status: r.status, html: await r.text() };
  };
  let tp = await triviasPage(null);
  check('trivias sin cookie: pide iniciar sesión', tp.status === 200 && tp.html.includes('Debes estar logueado'), tp.status);
  check('trivias sin cookie: no filtra ninguna trivia', !/Trivia de la profe|SECRETA|oficial de CrESI/.test(tp.html));

  tp = await triviasPage(cookie);
  check('trivias con cookie: llegan SUS trivias ya en el HTML', tp.status === 200 && tp.html.includes('Trivia de la profe') && tp.html.includes('Trivia con Timestamp'), tp.html.slice(0, 200));
  check('trivias con cookie: el documento con Timestamp no rompe el render', !/Application error|Unhandled Runtime Error|Only plain objects/.test(tp.html));
  check('trivias con cookie: NO aparece la de otra docente ni la de CrESI', !tp.html.includes('SECRETA') && !tp.html.includes('oficial de CrESI'));
  check('trivias con cookie: muestra el contador de partidas', tp.html.includes('7') && tp.html.includes('partidas'));
  check('trivias con cookie: dice "2 trivias creadas"', /2\s*(<!-- -->)?\s*trivias?\s*(<!-- -->)?\s*creadas?/.test(tp.html) || tp.html.replace(/<!-- -->/g, '').includes('2 trivias creadas'), '');
  check('trivias con cookie: ya no muestra "Debes estar logueado"', !tp.html.includes('Debes estar logueado'));

  tp = await triviasPage(forge(other.localId));
  check('trivias: la otra docente ve SOLO la suya', tp.html.includes('TRIVIA SECRETA') && !tp.html.includes('Trivia de la profe'));
  tp = await triviasPage(forge(teacher.localId, { iat: Math.floor(Date.now() / 1000) - 8000, exp: Math.floor(Date.now() / 1000) - 800 }));
  check('trivias: cookie vencida → sin sesión', tp.html.includes('Debes estar logueado') && !tp.html.includes('Trivia de la profe'));
  tp = await triviasPage(forge(teacher.localId, { secret: 'un-secreto-que-no-es-el-real-1234567890' }));
  check('trivias: cookie firmada con otro secreto → sin sesión', tp.html.includes('Debes estar logueado') && !tp.html.includes('Trivia de la profe'));

  // ── /docente/completapalabras ──
  const part = { text: 'La {pubertad} es una etapa', extraWords: ['otra'] };
  await db.collection('completapalabras').doc('c-1').set({ id: 'c-1', title: 'Lección de la profe', author: teacher.localId, lecciones: [part], created_at: '2026-01-01T00:00:00Z' });
  await db.collection('completapalabras').doc('c-2').set({ id: 'c-2', title: 'Lección con Timestamp', author: teacher.localId, lecciones: [part], created_at: Timestamp.fromDate(new Date('2026-03-04T05:06:07Z')) });
  await db.collection('completapalabras').doc('c-3').set({ id: 'c-3', title: 'LECCION SECRETA de otra docente', author: other.localId, lecciones: [part] });
  await db.collection('completapalabras').doc('c-4').set({ id: 'c-4', title: 'Lección oficial de CrESI', author: 'CRESI', lecciones: [part] });

  const cpPage = async (cookie) => {
    const r = await fetch(`${BASE}/docente/completapalabras`, { headers: cookie ? { cookie: `cresi_session=${cookie}` } : {}, redirect: 'manual' });
    return { status: r.status, html: await r.text() };
  };
  let cp = await cpPage(null);
  check('completapalabras sin cookie: pide iniciar sesión', cp.status === 200 && cp.html.includes('Debés estar logueado'), cp.status);
  check('completapalabras sin cookie: no filtra ninguna lección', !/Lección de la profe|SECRETA|oficial de CrESI/.test(cp.html));

  cp = await cpPage(cookie);
  check('completapalabras con cookie: llegan SUS lecciones ya en el HTML', cp.status === 200 && cp.html.includes('Lección de la profe') && cp.html.includes('Lección con Timestamp'), cp.html.slice(0, 200));
  check('completapalabras con cookie: el Timestamp no rompe el render', !/Application error|Unhandled Runtime Error|Only plain objects/.test(cp.html));
  check('completapalabras con cookie: NO aparece la de otra docente ni la de CrESI', !cp.html.includes('SECRETA') && !cp.html.includes('oficial de CrESI'));
  cp = await cpPage(forge(other.localId));
  check('completapalabras: la otra docente ve SOLO la suya', cp.html.includes('LECCION SECRETA') && !cp.html.includes('Lección de la profe'));
  cp = await cpPage(forge(teacher.localId, { secret: 'un-secreto-que-no-es-el-real-1234567890' }));
  check('completapalabras: cookie con otro secreto → sin sesión', cp.html.includes('Debés estar logueado') && !cp.html.includes('Lección de la profe'));

  // ── /docente/trivia-en-vivo ──
  await db.collection('livetrivias').doc('LIVE1').set({ code: 'LIVE1', teacherId: teacher.localId, triviaId: 't-1', triviaName: 'Partida de la profe', questions: [], phase: 'lobby', currentQuestionIndex: 0, createdAt: '2026-01-05T00:00:00Z' });
  await db.collection('livetrivias').doc('LIVE2').set({ code: 'LIVE2', teacherId: other.localId, triviaId: 't-3', triviaName: 'PARTIDA SECRETA de otra docente', questions: [], phase: 'lobby', currentQuestionIndex: 0, createdAt: '2026-01-06T00:00:00Z' });

  const livePage = async (cookie) => {
    const r = await fetch(`${BASE}/docente/trivia-en-vivo`, { headers: cookie ? { cookie: `cresi_session=${cookie}` } : {}, redirect: 'manual' });
    return { status: r.status, html: await r.text() };
  };
  let lv = await livePage(null);
  check('trivia-en-vivo sin cookie: pide iniciar sesión', lv.status === 200 && lv.html.includes('Debes estar logueado'), lv.status);
  check('trivia-en-vivo sin cookie: no filtra trivias ni partidas', !/Trivia de la profe|Partida de la profe|SECRET/.test(lv.html));

  lv = await livePage(cookie);
  check('trivia-en-vivo con cookie: llegan SUS partidas ya en el HTML', lv.status === 200 && lv.html.includes('Partida de la profe'), lv.html.slice(0, 200));
  check('trivia-en-vivo con cookie: puede elegir sus trivias y las de CrESI', lv.html.includes('Trivia de la profe') && lv.html.includes('Trivia oficial de CrESI'));
  check('trivia-en-vivo con cookie: NO aparece nada de otra docente', !lv.html.includes('SECRETA'));
  lv = await livePage(forge(other.localId));
  check('trivia-en-vivo: la otra docente ve SOLO lo suyo (y las de CrESI)', lv.html.includes('PARTIDA SECRETA') && lv.html.includes('TRIVIA SECRETA') && !lv.html.includes('Partida de la profe') && !lv.html.includes('Trivia de la profe'));
  lv = await livePage(forge(teacher.localId, { iat: Math.floor(Date.now() / 1000) - 8000, exp: Math.floor(Date.now() / 1000) - 800 }));
  check('trivia-en-vivo: cookie vencida → sin sesión', lv.html.includes('Debes estar logueado') && !lv.html.includes('Partida de la profe'));

  // ── /api/sync-score: un token malo es 401 (antes salía como 500 mudo) ──
  const sync = (token, score) => fetch(`${BASE}/api/sync-score`, { method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ score }) });
  res = await sync(null, 10);
  check('sync-score sin token → 401', res.status === 401, res.status);
  res = await sync('token-roto', 10);
  const brokenBody = await res.json();
  check('sync-score con token roto → 401 INVALID_TOKEN (no 500)', res.status === 401 && brokenBody.error === 'INVALID_TOKEN', JSON.stringify(brokenBody));
  res = await sync(teacher.idToken, -5);
  check('sync-score con puntaje inválido → 400', res.status === 400, res.status);
  res = await sync(teacher.idToken, 50);
  check('sync-score de un usuario sin documento → 404 (el cliente reintenta al crearlo)', res.status === 404, res.status);
  await db.collection('users').doc(teacher.localId).set({ game: { totalScore: 100, totalLives: 3, streak: 0 } });
  res = await sync(teacher.idToken, 150);
  const okBody = await res.json();
  check('sync-score con token y documento válidos → 200 y guarda el puntaje', res.status === 200 && okBody.score === 150, JSON.stringify(okBody));
  check('sync-score: quedó guardado en Firestore', (await db.collection('users').doc(teacher.localId).get()).data()?.game?.totalScore === 150);

  // ── /api/health ──
  res = await fetch(`${BASE}/api/health`);
  let health = await res.json();
  check('health: 200 y ok con la configuración completa', res.status === 200 && health.ok === true, JSON.stringify(health));
  check('health: verifica el Admin SDK', health.checks?.adminSdk === 'ok' && health.checks?.sessionSecret === 'ok' && health.checks?.passwordKey === 'ok', JSON.stringify(health));
  check('health: informa la versión de Node', /^v\d+\./.test(health.node ?? ''), health.node);
  check('health: no se cachea', (res.headers.get('cache-control') ?? '').includes('no-store'));
  check('health: NO filtra ningún secreto', !JSON.stringify(health).includes(SECRET) && !JSON.stringify(health).includes('secreto-de-prueba'));
  check('health: la versión superficial no toca Firestore', health.deep === false && health.checks?.firestore === undefined);

  res = await fetch(`${BASE}/api/health?deep=1`);
  check('health deep sin token → 401', res.status === 401, res.status);
  res = await fetch(`${BASE}/api/health?deep=1`, { headers: { authorization: 'Bearer token-incorrecto' } });
  check('health deep con token incorrecto → 401', res.status === 401, res.status);
  res = await fetch(`${BASE}/api/health?deep=1`, { headers: { authorization: 'Bearer token-de-salud-de-prueba' } });
  health = await res.json();
  check('health deep con token correcto → 200 y lee Firestore', res.status === 200 && health.checks?.firestore === 'ok', JSON.stringify(health));

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
