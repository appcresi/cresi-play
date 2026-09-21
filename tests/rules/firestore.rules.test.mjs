// Pruebas de firestore.rules contra el emulador.
//
//   npm run test:rules
//
// Necesita Java (el emulador de Firestore corre en la JVM). El script npm
// levanta el emulador, corre este archivo y lo apaga. Sin framework a
// propósito: es un script plano que sale con código 1 si algo falla.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { deleteDoc, doc, getDoc, setDoc, updateDoc, increment, setLogLevel } from 'firebase/firestore';

setLogLevel('silent'); // los PERMISSION_DENIED esperados no son ruido útil

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8085').split(':');
const env = await initializeTestEnvironment({
  projectId: 'demo-cresi',
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) },
});

let pass = 0;
let fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log('ok  ', name); }
  catch (e) { fail++; console.log('FAIL', name, '-', String(e.message).split('\n')[0]); }
};

const game = (o = {}) => ({ totalScore: 0, totalLives: 3, streak: 0, ...o });
const asUser = (uid) => env.authenticatedContext(uid).firestore();
const asAdmin = env.authenticatedContext('adm', { admin: true }).firestore();
const anon = env.unauthenticatedContext().firestore();
const seed = (path, data) => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), path), data));

// ── users/{uid}.game: el puntaje lo escribe solo el servidor ───────────
// (app/api/sync-score con el Admin SDK, que ignora las reglas)
await t('crear con puntaje 0: permitido', () =>
  assertSucceeds(setDoc(doc(asUser('a'), 'users/a'), { uid: 'a', game: game() })));
await t('crear con puntaje 500: denegado', () =>
  assertFails(setDoc(doc(asUser('b'), 'users/b'), { uid: 'b', game: game({ totalScore: 500 }) })));
await t('crear con scoreBudget: denegado', () =>
  assertFails(setDoc(doc(asUser('b2'), 'users/b2'), { uid: 'b2', game: game({ scoreBudget: 99999 }) })));

await seed('users/c', { uid: 'c', game: game({ totalScore: 100, scoreSyncedAt: 5, scoreBudget: 10 }), progress: {} });
const c = () => doc(asUser('c'), 'users/c');
await t('dueño sube totalScore: denegado', () => assertFails(updateDoc(c(), { 'game.totalScore': 999999 })));
await t('dueño baja totalScore: denegado', () => assertFails(updateDoc(c(), { 'game.totalScore': 0 })));
await t('dueño toca scoreBudget: denegado', () => assertFails(updateDoc(c(), { 'game.scoreBudget': 999999 })));
await t('dueño toca scoreSyncedAt: denegado', () => assertFails(updateDoc(c(), { 'game.scoreSyncedAt': 1 })));
await t('dueño reemplaza game entero: denegado', () => assertFails(updateDoc(c(), { game: game({ totalScore: 9 }) })));
await t('dueño actualiza vidas y racha por campo: permitido', () =>
  assertSucceeds(updateDoc(c(), { 'game.totalLives': 2, 'game.streak': 4, lastSyncedAt: 'x' })));
await t('vidas > 3: denegado', () => assertFails(updateDoc(c(), { 'game.totalLives': 9 })));
await t('otro usuario: denegado', () => assertFails(updateDoc(doc(asUser('zzz'), 'users/c'), { 'game.totalLives': 1 })));
await t('admin corrige game: permitido', () => assertSucceeds(updateDoc(doc(asAdmin, 'users/c'), { game: game({ totalScore: 60000 }) })));
await t('admin toca otro campo: denegado', () => assertFails(updateDoc(doc(asAdmin, 'users/c'), { uid: 'x' })));

// Documento viejo sin game.totalScore: el cliente manda el puntaje al
// servidor ANTES de actualizar vidas/racha (lib/userDataSync.ts); si no,
// este update falla.
await seed('users/old', { uid: 'old', game: { totalLives: 3, streak: 0 }, progress: {} });
await t('doc viejo sin totalScore: update de vidas denegado', () =>
  assertFails(updateDoc(doc(asUser('old'), 'users/old'), { 'game.totalLives': 2 })));
await env.withSecurityRulesDisabled((ctx) =>
  updateDoc(doc(ctx.firestore(), 'users/old'), { 'game.totalScore': 0, 'game.scoreSyncedAt': 1, 'game.scoreBudget': 0 })); // lo que hace el servidor
await t('doc viejo tras el push del servidor: update de vidas permitido', () =>
  assertSucceeds(updateDoc(doc(asUser('old'), 'users/old'), { 'game.totalLives': 2 })));

// ── classrooms/{id}/estudiantes/{uid}: no declarar más que lo validado ──
await seed('classrooms/cl', { profesorId: 'prof' });
await seed('users/st', { game: game({ totalScore: 300 }) });
const est = (uid) => doc(asUser(uid), 'classrooms/cl/estudiantes/st');
await t('alumno copia puntaje <= validado: permitido', () =>
  assertSucceeds(setDoc(est('st'), { progress: { totalScore: 300, streak: 1 } }, { merge: true })));
await t('alumno copia puntaje 301: denegado', () =>
  assertFails(setDoc(est('st'), { progress: { totalScore: 301 } }, { merge: true })));
await t('alumno sin totalScore: permitido', () =>
  assertSucceeds(setDoc(est('st'), { progress: { streak: 2 } }, { merge: true })));
await t('alumno sincroniza lessonTimes: permitido', () =>
  assertSucceeds(setDoc(est('st'), { progress: { lessonTimes: { Pubertad: 2 } } }, { merge: true })));
await t('docente escribe: permitido', () =>
  assertSucceeds(setDoc(doc(asUser('prof'), 'classrooms/cl/estudiantes/st'), { nota: 'x' }, { merge: true })));
await t('alumno borra su documento: permitido', () => assertSucceeds(deleteDoc(est('st'))));

// ── lecciones/{id}.timesCompleted: solo lo suma /api/track (Admin SDK) ──
await seed('lecciones/l1', { title: 'Pubertad', author: 'CRESI', lecciones: [] });
await t('anónimo suma timesCompleted desde el cliente: denegado', () =>
  assertFails(updateDoc(doc(anon, 'lecciones/l1'), { timesCompleted: increment(1) })));
await t('alumno suma timesCompleted desde el cliente: denegado', () =>
  assertFails(updateDoc(doc(asUser('st'), 'lecciones/l1'), { timesCompleted: increment(1) })));
await t('alumno suma timesCompleted y toca otro campo: denegado', () =>
  assertFails(updateDoc(doc(asUser('st'), 'lecciones/l1'), { timesCompleted: increment(1), title: 'X' })));
await t('alumno edita el contenido: denegado', () =>
  assertFails(updateDoc(doc(asUser('st'), 'lecciones/l1'), { title: 'X' })));
await t('admin edita el contenido: permitido', () =>
  assertSucceeds(updateDoc(doc(asAdmin, 'lecciones/l1'), { title: 'Editado' })));

// ── classrooms/{id}/estudiantesPendientes: la contraseña es cosa del servidor ──
await seed('classrooms/cl2', { profesorId: 'prof2' });
await seed('classrooms/cl2/estudiantesPendientes/p1', { username: 'ana', passwordEnc: 'v1.x.y.z', claimed: false, claimedUid: null });
const pend = (uid) => doc(asUser(uid), 'classrooms/cl2/estudiantesPendientes/p1');
await t('docente lee los pendientes de su clase: permitido', () => assertSucceeds(getDoc(pend('prof2'))));
await t('otro usuario lee los pendientes: denegado', () => assertFails(getDoc(pend('intruso'))));
await t('docente crea un pendiente desde el cliente: denegado (lo hace el servidor)', () =>
  assertFails(setDoc(doc(asUser('prof2'), 'classrooms/cl2/estudiantesPendientes/nuevo'), { username: 'b', password: 'texto-plano', claimed: false })));
await t('docente escribe una contraseña en texto plano: denegado', () => assertFails(updateDoc(pend('prof2'), { password: 'texto-plano' })));
await t('docente cambia el usuario desde el cliente: denegado (va por el servidor)', () => assertFails(updateDoc(pend('prof2'), { username: 'otro' })));
await t('docente pisa passwordEnc: denegado', () => assertFails(updateDoc(pend('prof2'), { passwordEnc: 'v1.a.b.c' })));
await t('docente reinicia el acceso (claimed/claimedUid): permitido', () => assertSucceeds(updateDoc(pend('prof2'), { claimed: false, claimedUid: null })));
await t('un usuario reclama un pendiente libre: permitido', () => assertSucceeds(updateDoc(pend('alumno9'), { claimed: true, claimedUid: 'alumno9' })));
await seed('classrooms/cl2/estudiantesPendientes/p2', { username: 'bea', passwordEnc: 'v1.x.y.z', claimed: false, claimedUid: null });
await t('quien reclama NO puede pisar la contraseña de paso: denegado', () =>
  assertFails(updateDoc(doc(asUser('alumno9'), 'classrooms/cl2/estudiantesPendientes/p2'), { claimedUid: 'alumno9', passwordEnc: 'v1.a.b.c' })));
await t('docente borra un pendiente: permitido', () => assertSucceeds(deleteDoc(pend('prof2'))));

// ── rateLimits: contadores de /api/join-class, solo del servidor ──────
await seed('rateLimits/abc123', { count: 4, windowStart: 1, expiresAt: new Date() });
await t('rateLimits: un usuario logueado no puede leer un contador', () => assertFails(getDoc(doc(asUser('st'), 'rateLimits/abc123'))));
await t('rateLimits: un anónimo no puede leer un contador', () => assertFails(getDoc(doc(anon, 'rateLimits/abc123'))));
await t('rateLimits: un usuario no puede borrar su contador (evita saltearse el límite)', () => assertFails(deleteDoc(doc(asUser('st'), 'rateLimits/abc123'))));
await t('rateLimits: un usuario no puede inflar un contador ajeno (bloquear a otro)', () => assertFails(setDoc(doc(asUser('st'), 'rateLimits/abc123'), { count: 999, windowStart: 1 })));
await t('rateLimits: ni el docente ni el admin escriben desde el cliente', async () => {
  await assertFails(setDoc(doc(asUser('prof'), 'rateLimits/x1'), { count: 1 }));
  await assertFails(setDoc(doc(asAdmin, 'rateLimits/x2'), { count: 1 }));
});

console.log(`\n${pass} ok, ${fail} fallos`);
await env.cleanup();
process.exit(fail ? 1 : 0);
