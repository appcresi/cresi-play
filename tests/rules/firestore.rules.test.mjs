// Pruebas de firestore.rules contra el emulador.
//
//   npm run test:rules
//
// Necesita Java (el emulador de Firestore corre en la JVM). El script npm
// levanta el emulador, corre este archivo y lo apaga. Sin framework a
// propósito: es un script plano que sale con código 1 si algo falla.
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { deleteDoc, doc, setDoc, updateDoc, increment, setLogLevel } from 'firebase/firestore';

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

// ── lecciones/{id}.timesCompleted: contador abierto, solo ese campo ────
await seed('lecciones/l1', { title: 'Pubertad', author: 'CRESI', lecciones: [] });
await t('anónimo suma timesCompleted: permitido', () =>
  assertSucceeds(updateDoc(doc(anon, 'lecciones/l1'), { timesCompleted: increment(1) })));
await t('alumno suma timesCompleted: permitido', () =>
  assertSucceeds(updateDoc(doc(asUser('st'), 'lecciones/l1'), { timesCompleted: increment(1) })));
await t('alumno suma timesCompleted y toca otro campo: denegado', () =>
  assertFails(updateDoc(doc(asUser('st'), 'lecciones/l1'), { timesCompleted: increment(1), title: 'X' })));
await t('alumno edita el contenido: denegado', () =>
  assertFails(updateDoc(doc(asUser('st'), 'lecciones/l1'), { title: 'X' })));
await t('admin edita el contenido: permitido', () =>
  assertSucceeds(updateDoc(doc(asAdmin, 'lecciones/l1'), { title: 'Editado' })));

console.log(`\n${pass} ok, ${fail} fallos`);
await env.cleanup();
process.exit(fail ? 1 : 0);
