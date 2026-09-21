// Pruebas de firestore.rules para las colecciones que NO cubre
// firestore.rules.test.mjs (users/lecciones/pendientes/puntaje): contenido
// (questions, blog_posts, infografias, resources, completapalabras, lecciones,
// trivia), clases y tareas, y las salas sin login (nube de palabras, trivia en vivo).
//
//   npm run test:rules
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import {
  collectionGroup, deleteDoc, doc, getDoc, getDocs, increment, query, setDoc, setLogLevel, updateDoc, where,
} from 'firebase/firestore';

setLogLevel('silent');

const [host, port] = (process.env.FIRESTORE_EMULATOR_HOST ?? '127.0.0.1:8085').split(':');
const env = await initializeTestEnvironment({
  projectId: 'demo-cresi-colecciones',
  firestore: { rules: readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8'), host, port: Number(port) },
});

let pass = 0;
let fail = 0;
const t = async (name, fn) => {
  try { await fn(); pass++; console.log('ok  ', name); }
  catch (e) { fail++; console.log('FAIL', name, '-', String(e.message).split('\n')[0]); }
};

const HARDCODED_ADMIN = 'feHhnkE3m1Yzbwn4AgEA7rJjsul1';
const asUser = (uid) => env.authenticatedContext(uid).firestore();
const asAdmin = env.authenticatedContext('admin-1', { admin: true }).firestore();
const asHardcodedAdmin = env.authenticatedContext(HARDCODED_ADMIN).firestore();
const anon = env.unauthenticatedContext().firestore();
// Alumno que entró con código de clase: /api/join-class le pone la marca `student` al token.
const asStudent = (uid) => env.authenticatedContext(uid, { student: true }).firestore();
const seed = (path, data) => env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), path), data));
const d = (db, path) => doc(db, path);

// ── Contenido de solo lectura pública: questions / blog_posts ─────────────
for (const col of ['questions', 'blog_posts']) {
  await seed(`${col}/x`, { title: 'oficial' });
  await t(`${col}: lectura pública (anónimo)`, () => assertSucceeds(getDoc(d(anon, `${col}/x`))));
  await t(`${col}: un usuario común no escribe`, () => assertFails(setDoc(d(asUser('u1'), `${col}/y`), { title: 'nuevo' })));
  await t(`${col}: un usuario común no edita`, () => assertFails(updateDoc(d(asUser('u1'), `${col}/x`), { title: 'pisado' })));
  await t(`${col}: un usuario común no borra`, () => assertFails(deleteDoc(d(asUser('u1'), `${col}/x`))));
  await t(`${col}: el admin (claim) escribe`, () => assertSucceeds(setDoc(d(asAdmin, `${col}/z`), { title: 'admin' })));
  await t(`${col}: el admin fijo por uid escribe`, () => assertSucceeds(setDoc(d(asHardcodedAdmin, `${col}/w`), { title: 'admin uid' })));
}

// ── preguntas: solo usuarios logueados leen; escribe el admin ─────────────
await seed('preguntas/p1', { q: 1 });
await t('preguntas: un anónimo no lee', () => assertFails(getDoc(d(anon, 'preguntas/p1'))));
await t('preguntas: un usuario logueado lee', () => assertSucceeds(getDoc(d(asUser('u1'), 'preguntas/p1'))));
await t('preguntas: un usuario común no escribe', () => assertFails(setDoc(d(asUser('u1'), 'preguntas/p2'), { q: 2 })));
await t('preguntas: el admin escribe', () => assertSucceeds(setDoc(d(asAdmin, 'preguntas/p2'), { q: 2 })));

// ── infografias / resources: contador de descargas abierto pero solo de a +1 ──
for (const col of ['infografias', 'resources']) {
  await seed(`${col}/i1`, { title: 'i', downloads: 5 });
  await t(`${col}: lectura pública`, () => assertSucceeds(getDoc(d(anon, `${col}/i1`))));
  await t(`${col}: un anónimo suma 1 descarga`, () => assertSucceeds(updateDoc(d(anon, `${col}/i1`), { downloads: 6 })));
  await t(`${col}: no se puede sumar de a 2`, () => assertFails(updateDoc(d(anon, `${col}/i1`), { downloads: 8 })));
  await t(`${col}: no se puede bajar el contador`, () => assertFails(updateDoc(d(anon, `${col}/i1`), { downloads: 1 })));
  await t(`${col}: no se puede tocar otro campo junto con el contador`, () => assertFails(updateDoc(d(anon, `${col}/i1`), { downloads: 7, title: 'hack' })));
  await t(`${col}: un usuario común no crea`, () => assertFails(setDoc(d(asUser('u1'), `${col}/nuevo`), { title: 'n', downloads: 0 })));
  await t(`${col}: un usuario común no borra`, () => assertFails(deleteDoc(d(asUser('u1'), `${col}/i1`))));
  await t(`${col}: el admin edita cualquier campo`, () => assertSucceeds(updateDoc(d(asAdmin, `${col}/i1`), { title: 'editado por admin' })));
  await t(`${col}: el admin crea`, () => assertSucceeds(setDoc(d(asAdmin, `${col}/nuevo`), { title: 'n', downloads: 0 })));
}

// ── completapalabras: contenido del docente; nadie puede hacerse pasar por CRESI ──
await seed('completapalabras/c1', { title: 'de ana', author: 'ana', lecciones: [] });
await seed('completapalabras/c-oficial', { title: 'oficial', author: 'CRESI', lecciones: [] });
await t('completapalabras: lectura pública', () => assertSucceeds(getDoc(d(anon, 'completapalabras/c1'))));
await t('completapalabras: un docente crea la suya', () => assertSucceeds(setDoc(d(asUser('ana'), 'completapalabras/nueva-ana'), { title: 't', author: 'ana', lecciones: [] })));
await t('completapalabras: no se puede crear a nombre de otro', () => assertFails(setDoc(d(asUser('ana'), 'completapalabras/x1'), { title: 't', author: 'beto', lecciones: [] })));
await t('completapalabras: no se puede crear como oficial (CRESI)', () => assertFails(setDoc(d(asUser('ana'), 'completapalabras/x2'), { title: 't', author: 'CRESI', lecciones: [] })));
await t('completapalabras: el dueño edita su contenido', () => assertSucceeds(updateDoc(d(asUser('ana'), 'completapalabras/c1'), { title: 'editada' })));
await t('completapalabras: otro docente no edita', () => assertFails(updateDoc(d(asUser('beto'), 'completapalabras/c1'), { title: 'pisada' })));
await t('completapalabras: un docente NO puede tocar una oficial', () => assertFails(updateDoc(d(asUser('ana'), 'completapalabras/c-oficial'), { title: 'pisada' })));
await t('completapalabras: el dueño NO puede cambiar el autor a "CRESI" (se haría pasar por oficial)', () => assertFails(updateDoc(d(asUser('ana'), 'completapalabras/c1'), { author: 'CRESI' })));
await t('completapalabras: el dueño NO puede regalar su lección cambiando el autor', () => assertFails(updateDoc(d(asUser('ana'), 'completapalabras/c1'), { author: 'beto' })));
await t('completapalabras: el dueño borra la suya', () => assertSucceeds(deleteDoc(d(asUser('ana'), 'completapalabras/nueva-ana'))));
await t('completapalabras: otro docente no borra', () => assertFails(deleteDoc(d(asUser('beto'), 'completapalabras/c1'))));

// ── lecciones ─────────────────────────────────────────────────────────────
await seed('lecciones/l-oficial', { title: 'oficial', author: 'CRESI', lecciones: [] });
await seed('lecciones/l-ana', { title: 'de ana', author: 'ana', lecciones: [] });
await t('lecciones: el admin crea una oficial', () => assertSucceeds(setDoc(d(asAdmin, 'lecciones/l-nueva-oficial'), { title: 'o', author: 'CRESI', lecciones: [] })));
await t('lecciones: un docente NO crea una oficial', () => assertFails(setDoc(d(asUser('ana'), 'lecciones/l-falsa'), { title: 'f', author: 'CRESI', lecciones: [] })));
await t('lecciones: un docente crea la suya', () => assertSucceeds(setDoc(d(asUser('ana'), 'lecciones/l-ana-2'), { title: 'a', author: 'ana', lecciones: [] })));
await t('lecciones: un docente NO edita una oficial', () => assertFails(updateDoc(d(asUser('ana'), 'lecciones/l-oficial'), { title: 'pisada' })));
await t('lecciones: el admin edita una oficial', () => assertSucceeds(updateDoc(d(asAdmin, 'lecciones/l-oficial'), { title: 'corregida' })));
await t('lecciones: el dueño NO puede cambiar el autor a "CRESI" (se haría pasar por oficial)', () => assertFails(updateDoc(d(asUser('ana'), 'lecciones/l-ana'), { author: 'CRESI' })));
// Hoy el admin solo edita contenido OFICIAL (author == "CRESI"), no el de los docentes.
await t('lecciones: el admin NO edita el contenido de un docente', () => assertFails(updateDoc(d(asAdmin, 'lecciones/l-ana'), { title: 'moderada' })));
await t('lecciones: otro docente no borra', () => assertFails(deleteDoc(d(asUser('beto'), 'lecciones/l-ana-2'))));
await t('lecciones: el dueño borra la suya', () => assertSucceeds(deleteDoc(d(asUser('ana'), 'lecciones/l-ana-2'))));

// ── trivia ────────────────────────────────────────────────────────────────
await seed('trivia/t-ana', { name: 'de ana', author: 'ana', playCount: 0, questions: [] });
await seed('trivia/t-legacy', { name: 'vieja', userId: 'lola', playCount: 0, questions: [] });
await seed('trivia/t-oficial', { name: 'oficial', author: 'CRESI', playCount: 0, questions: [] });
await t('trivia: lectura pública', () => assertSucceeds(getDoc(d(anon, 'trivia/t-oficial'))));
await t('trivia: un docente crea la suya', () => assertSucceeds(setDoc(d(asUser('ana'), 'trivia/t-nueva'), { name: 'n', author: 'ana', questions: [] })));
await t('trivia: no se puede crear como oficial (CRESI)', () => assertFails(setDoc(d(asUser('ana'), 'trivia/t-falsa'), { name: 'f', author: 'CRESI', questions: [] })));
await t('trivia: el dueño edita la suya', () => assertSucceeds(updateDoc(d(asUser('ana'), 'trivia/t-ana'), { name: 'editada' })));
await t('trivia: un docente NO edita una oficial', () => assertFails(updateDoc(d(asUser('ana'), 'trivia/t-oficial'), { name: 'pisada' })));
await t('trivia: el admin edita una oficial', () => assertSucceeds(updateDoc(d(asAdmin, 'trivia/t-oficial'), { name: 'corregida' })));
await t('trivia: el dueño NO puede cambiar el autor a "CRESI" (se haría pasar por oficial)', () => assertFails(updateDoc(d(asUser('ana'), 'trivia/t-ana'), { author: 'CRESI' })));
await t('trivia: el dueño de una trivia vieja (userId) sigue pudiendo editarla', () => assertSucceeds(updateDoc(d(asUser('lola'), 'trivia/t-legacy'), { name: 'editada' })));
await t('trivia: cualquiera suma partidas (playCount)', () => assertSucceeds(updateDoc(d(anon, 'trivia/t-ana'), { playCount: increment(1) })));
await t('trivia: cualquiera registra estadísticas de preguntas (questionStats)', () => assertSucceeds(updateDoc(d(anon, 'trivia/t-ana'), { questionStats: { 0: { shown: 1, wrong: 0 } } })));
await t('trivia: un anónimo NO edita otro campo', () => assertFails(updateDoc(d(anon, 'trivia/t-ana'), { name: 'pisada' })));
await t('trivia: un anónimo NO cambia el autor junto con el contador', () => assertFails(updateDoc(d(anon, 'trivia/t-ana'), { playCount: 5, author: 'CRESI' })));
await t('trivia: otro docente no borra', () => assertFails(deleteDoc(d(asUser('beto'), 'trivia/t-ana'))));
await t('trivia: el dueño borra la suya', () => assertSucceeds(deleteDoc(d(asUser('ana'), 'trivia/t-nueva'))));

// ── classrooms ────────────────────────────────────────────────────────────
await seed('classrooms/k1', { name: 'clase 1', profesorId: 'prof1', code: 'AAA111' });
await t('classrooms: un docente crea su clase', () => assertSucceeds(setDoc(d(asUser('prof2'), 'classrooms/k2'), { name: 'c2', profesorId: 'prof2', code: 'BBB222' })));
await t('classrooms: no se puede crear una clase a nombre de otro docente', () => assertFails(setDoc(d(asUser('prof2'), 'classrooms/k3'), { name: 'c3', profesorId: 'prof1', code: 'CCC333' })));
await t('classrooms: un anónimo no lee clases', () => assertFails(getDoc(d(anon, 'classrooms/k1'))));
await t('classrooms: un usuario logueado lee (así busca una clase por código)', () => assertSucceeds(getDoc(d(asUser('alumno1'), 'classrooms/k1'))));
await t('classrooms: el docente dueño edita', () => assertSucceeds(updateDoc(d(asUser('prof1'), 'classrooms/k1'), { name: 'renombrada' })));
await t('classrooms: otro usuario NO edita', () => assertFails(updateDoc(d(asUser('alumno1'), 'classrooms/k1'), { name: 'pisada' })));
await t('classrooms: otro docente NO borra', () => assertFails(deleteDoc(d(asUser('prof2'), 'classrooms/k1'))));

// ── tareas y entregas ─────────────────────────────────────────────────────
await seed('classrooms/k1/tareas/tarea1', { title: 'tarea' });
await t('tareas: el docente de la clase crea', () => assertSucceeds(setDoc(d(asUser('prof1'), 'classrooms/k1/tareas/tarea2'), { title: 't2' })));
await t('tareas: un alumno NO crea tareas', () => assertFails(setDoc(d(asUser('alumno1'), 'classrooms/k1/tareas/tarea3'), { title: 't3' })));
await t('tareas: otro docente NO crea tareas en una clase ajena', () => assertFails(setDoc(d(asUser('prof2'), 'classrooms/k1/tareas/tarea4'), { title: 't4' })));
await t('tareas: un alumno logueado lee las tareas', () => assertSucceeds(getDoc(d(asUser('alumno1'), 'classrooms/k1/tareas/tarea1'))));
await t('tareas: un alumno NO edita una tarea', () => assertFails(updateDoc(d(asUser('alumno1'), 'classrooms/k1/tareas/tarea1'), { title: 'pisada' })));

const entrega = (uid) => d(asUser(uid), `classrooms/k1/tareas/tarea1/entregas/${uid}`);
await t('entregas: un alumno entrega la suya', () => assertSucceeds(setDoc(entrega('alumno1'), { studentUid: 'alumno1', status: 'submitted', classroomId: 'k1', tareaId: 'tarea1' })));
await t('entregas: un alumno NO escribe la de otro', () => assertFails(setDoc(d(asUser('alumno1'), 'classrooms/k1/tareas/tarea1/entregas/alumno2'), { studentUid: 'alumno2', status: 'submitted' })));
await t('entregas: el alumno edita su respuesta', () => assertSucceeds(updateDoc(entrega('alumno1'), { responseText: 'mi respuesta' })));
await t('entregas: un alumno NO puede ponerse nota al crear la entrega', () => assertFails(setDoc(entrega('alumno3'), { studentUid: 'alumno3', status: 'submitted', grade: 10 })));
await t('entregas: un alumno NO puede ponerse nota al editarla', () => assertFails(updateDoc(entrega('alumno1'), { grade: 10 })));
await t('entregas: un alumno NO puede escribir la devolución del docente', () => assertFails(updateDoc(entrega('alumno1'), { feedback: 'excelente', gradedAt: '2026-01-01' })));
await t('entregas: un alumno NO puede apuntar su entrega a otra clase (classroomId)', () => assertFails(setDoc(entrega('alumno4'), { studentUid: 'alumno4', status: 'submitted', classroomId: 'otra-clase' })));
await t('entregas (app classroom): el alumno NO puede ponerse nota con "calificacion"', () => assertFails(updateDoc(entrega('alumno1'), { calificacion: 10 })));
await t('entregas (app classroom): el alumno NO puede escribir "comentarios" del docente', () => assertFails(updateDoc(entrega('alumno1'), { comentarios: 'sobresaliente' })));
await t('entregas (app classroom): el alumno NO puede crear su entrega con nota', () => assertFails(setDoc(entrega('alumno5'), { estudianteId: 'alumno5', enviado: true, calificacion: 10 })));
await t('entregas (app classroom): el alumno NO puede apuntar su entrega a otra clase (claseId)', () => assertFails(setDoc(entrega('alumno6'), { estudianteId: 'alumno6', enviado: true, claseId: 'otra-clase' })));
await t('entregas (app classroom): el envío legítimo del alumno sigue funcionando', () =>
  assertSucceeds(setDoc(entrega('alumno7'), { tareaId: 'tarea1', claseId: 'k1', estudianteId: 'alumno7', estudianteNombre: 'Ana', contenido: 'mi tarea', enviado: true, fechaEnvio: '2026-01-01' }, { merge: true })));
await t('entregas (app classroom): el docente califica con "calificacion" y "comentarios"', () =>
  assertSucceeds(updateDoc(d(asUser('prof1'), 'classrooms/k1/tareas/tarea1/entregas/alumno7'), { calificacion: 8, comentarios: 'bien' })));
await t('entregas: el alumno puede volver a entregar sin borrarse la nota que puso el docente', () =>
  assertSucceeds(setDoc(entrega('alumno7'), { contenido: 'versión corregida', enviado: true }, { merge: true })));
await t('entregas: el docente califica', () => assertSucceeds(updateDoc(d(asUser('prof1'), 'classrooms/k1/tareas/tarea1/entregas/alumno1'), { grade: 9, feedback: 'bien', gradedAt: '2026-01-02' })));
await t('entregas: otro docente NO califica en una clase ajena', () => assertFails(updateDoc(d(asUser('prof2'), 'classrooms/k1/tareas/tarea1/entregas/alumno1'), { grade: 1 })));
await t('entregas: el alumno lee su entrega (con la nota)', () => assertSucceeds(getDoc(entrega('alumno1'))));
await t('entregas: otro alumno NO la lee', () => assertFails(getDoc(d(asUser('alumno9'), 'classrooms/k1/tareas/tarea1/entregas/alumno1'))));
await t('entregas: el docente lee todas las de su clase con una consulta de grupo', () =>
  assertSucceeds(getDocs(query(collectionGroup(asUser('prof1'), 'entregas'), where('classroomId', '==', 'k1')))));
await t('entregas: otro docente NO puede leer las entregas de esa clase por consulta de grupo', () =>
  assertFails(getDocs(query(collectionGroup(asUser('prof2'), 'entregas'), where('classroomId', '==', 'k1')))));
await t('entregas: un alumno NO puede listar las entregas de la clase', () =>
  assertFails(getDocs(query(collectionGroup(asUser('alumno1'), 'entregas'), where('classroomId', '==', 'k1')))));

// ── Nube de palabras (sala con código, sin login) ─────────────────────────
await seed('wordclouds/NUBE1', { code: 'NUBE1', teacherId: 'prof1', title: 't', active: true, createdAt: 'x' });
await t('wordclouds: un docente crea su sala', () => assertSucceeds(setDoc(d(asUser('prof1'), 'wordclouds/NUBE2'), { code: 'NUBE2', teacherId: 'prof1', title: 't', active: true, createdAt: 'x' })));
await t('wordclouds: no se puede crear una sala a nombre de otro docente', () => assertFails(setDoc(d(asUser('prof1'), 'wordclouds/NUBE3'), { code: 'NUBE3', teacherId: 'prof2', title: 't', active: true, createdAt: 'x' })));
await t('wordclouds: un anónimo no crea salas', () => assertFails(setDoc(d(anon, 'wordclouds/NUBE4'), { code: 'NUBE4', teacherId: 'nadie' })));
await t('wordclouds: cualquiera lee la sala', () => assertSucceeds(getDoc(d(anon, 'wordclouds/NUBE1'))));
await t('wordclouds: otro usuario no cierra la sala', () => assertFails(updateDoc(d(asUser('alumno1'), 'wordclouds/NUBE1'), { active: false })));
await t('wordclouds: el dueño cierra la sala', () => assertSucceeds(updateDoc(d(asUser('prof1'), 'wordclouds/NUBE1'), { active: false })));
const word = (id, data) => setDoc(d(anon, `wordclouds/NUBE1/words/${id}`), data);
await t('palabras: un anónimo manda una palabra válida', () => assertSucceeds(word('amor', { text: 'amor', count: 1, updatedAt: 'x' })));
await t('palabras: texto vacío: denegado', () => assertFails(word('v', { text: '', count: 1, updatedAt: 'x' })));
await t('palabras: texto de más de 30 caracteres: denegado', () => assertFails(word('l', { text: 'x'.repeat(31), count: 1, updatedAt: 'x' })));
await t('palabras: contador 0: denegado', () => assertFails(word('c0', { text: 'a', count: 0, updatedAt: 'x' })));
await t('palabras: contador enorme: denegado', () => assertFails(word('cx', { text: 'a', count: 1_000_000, updatedAt: 'x' })));
await t('palabras: campo de más: denegado', () => assertFails(word('e', { text: 'a', count: 1, updatedAt: 'x', admin: true })));
await t('palabras: solo el docente dueño borra una palabra', async () => {
  await assertFails(deleteDoc(d(anon, 'wordclouds/NUBE1/words/amor')));
  await assertFails(deleteDoc(d(asUser('alumno1'), 'wordclouds/NUBE1/words/amor')));
  await assertSucceeds(deleteDoc(d(asUser('prof1'), 'wordclouds/NUBE1/words/amor')));
});

// ── Trivia en vivo (sala con código, sin login) ───────────────────────────
await seed('livetrivias/LIVE1', { code: 'LIVE1', teacherId: 'prof1', triviaId: 't', phase: 'lobby' });
await t('livetrivias: un docente crea su partida', () => assertSucceeds(setDoc(d(asUser('prof1'), 'livetrivias/LIVE2'), { code: 'LIVE2', teacherId: 'prof1', phase: 'lobby' })));
await t('livetrivias: no se puede crear a nombre de otro docente', () => assertFails(setDoc(d(asUser('prof1'), 'livetrivias/LIVE3'), { code: 'LIVE3', teacherId: 'prof2', phase: 'lobby' })));
await t('livetrivias: cualquiera lee la partida', () => assertSucceeds(getDoc(d(anon, 'livetrivias/LIVE1'))));
await t('livetrivias: un anónimo no avanza la partida', () => assertFails(updateDoc(d(anon, 'livetrivias/LIVE1'), { phase: 'finished' })));
await t('livetrivias: el docente dueño avanza la partida', () => assertSucceeds(updateDoc(d(asUser('prof1'), 'livetrivias/LIVE1'), { phase: 'question' })));
const player = (id) => d(anon, `livetrivias/LIVE1/players/${id}`);
await t('jugadores: un anónimo entra con nombre válido y puntaje 0', () => assertSucceeds(setDoc(player('j1'), { name: 'Lu', score: 0, joinedAt: 'x' })));
await t('jugadores: no se puede entrar con puntaje inicial', () => assertFails(setDoc(player('j2'), { name: 'Lu', score: 500, joinedAt: 'x' })));
await t('jugadores: nombre vacío: denegado', () => assertFails(setDoc(player('j3'), { name: '', score: 0, joinedAt: 'x' })));
await t('jugadores: nombre de más de 30 caracteres: denegado', () => assertFails(setDoc(player('j4'), { name: 'x'.repeat(31), score: 0, joinedAt: 'x' })));
await t('jugadores: solo se puede sumar puntaje', () => assertSucceeds(updateDoc(player('j1'), { score: increment(100) })));
await t('jugadores: no se puede cambiar el nombre', () => assertFails(updateDoc(player('j1'), { name: 'Otro' })));
await t('jugadores: solo el docente dueño saca a un jugador', async () => {
  await assertFails(deleteDoc(player('j1')));
  await assertSucceeds(deleteDoc(d(asUser('prof1'), 'livetrivias/LIVE1/players/j1')));
});
const answer = (id, data) => setDoc(d(anon, `livetrivias/LIVE1/answers/${id}`), data);
const ok = { playerId: 'j1', questionIndex: 0, optionIndex: 1, correct: true, pointsEarned: 800, answeredAt: 'x' };
await t('respuestas: se manda una respuesta válida', () => assertSucceeds(answer('j1_0', ok)));
await t('respuestas: una respuesta ya enviada no se puede pisar', () => assertFails(answer('j1_0', { ...ok, pointsEarned: 1000 })));
await t('respuestas: más de 1000 puntos por pregunta: denegado', () => assertFails(answer('j1_1', { ...ok, questionIndex: 1, pointsEarned: 5000 })));
await t('respuestas: puntos negativos: denegado', () => assertFails(answer('j1_2', { ...ok, questionIndex: 2, pointsEarned: -1 })));
await t('respuestas: campo de más: denegado', () => assertFails(answer('j1_3', { ...ok, questionIndex: 3, extra: 1 })));

// ── Alumnos con código de clase (token con la marca "student"): sin funciones de docente ──
await t('alumno con código: NO crea una clase', () => assertFails(setDoc(d(asStudent('al1'), 'classrooms/k-alumno'), { name: 'mia', profesorId: 'al1', code: 'ZZZ999' })));
await t('alumno con código: NO crea una trivia', () => assertFails(setDoc(d(asStudent('al1'), 'trivia/t-alumno'), { name: 'n', author: 'al1', questions: [] })));
await t('alumno con código: NO crea una lección de completa palabras', () => assertFails(setDoc(d(asStudent('al1'), 'completapalabras/c-alumno'), { title: 't', author: 'al1', lecciones: [] })));
await t('alumno con código: NO crea una lección', () => assertFails(setDoc(d(asStudent('al1'), 'lecciones/l-alumno'), { title: 't', author: 'al1', lecciones: [] })));
await t('alumno con código: NO crea una nube de palabras', () => assertFails(setDoc(d(asStudent('al1'), 'wordclouds/NUBEA'), { code: 'NUBEA', teacherId: 'al1', title: 't', active: true, createdAt: 'x' })));
await t('alumno con código: NO crea una partida de trivia en vivo', () => assertFails(setDoc(d(asStudent('al1'), 'livetrivias/LIVEA'), { code: 'LIVEA', teacherId: 'al1', phase: 'lobby' })));
await t('un usuario SIN la marca (docente, o alumno con Google) sí crea una clase', () => assertSucceeds(setDoc(d(asUser('docente-x'), 'classrooms/k-docente'), { name: 'mia', profesorId: 'docente-x', code: 'DDD444' })));
await t('alumno con código: sigue leyendo clases (así se busca por código)', () => assertSucceeds(getDoc(d(asStudent('al1'), 'classrooms/k1'))));
await t('alumno con código: sigue entregando SU tarea', () => assertSucceeds(setDoc(d(asStudent('al1'), 'classrooms/k1/tareas/tarea1/entregas/al1'), { status: 'entregada', classroomId: 'k1', tareaId: 'tarea1' })));
await t('alumno con código: sigue sumando partidas a una trivia (playCount)', () => assertSucceeds(updateDoc(d(asStudent('al1'), 'trivia/t-ana'), { playCount: increment(1) })));
await t('alumno con código: sigue sumando "veces completada" a una lección', () => assertSucceeds(updateDoc(d(asStudent('al1'), 'lecciones/l-oficial'), { timesCompleted: increment(1) })));
await t('alumno con código: su marca no se puede poner desde el cliente (viene firmada por Firebase)', () => assertFails(setDoc(d(asUser('al2'), 'users/al2'), { student: false, game: { totalScore: 500, totalLives: 3, streak: 0 } })));

// ── Todo lo demás está cerrado ────────────────────────────────────────────
await t('colección desconocida: un usuario logueado no lee ni escribe', async () => {
  await assertFails(getDoc(d(asUser('u1'), 'secretos/x')));
  await assertFails(setDoc(d(asUser('u1'), 'secretos/x'), { a: 1 }));
});
await t('colección desconocida: ni el admin (por reglas de cliente)', () => assertFails(setDoc(d(asAdmin, 'secretos/x'), { a: 1 })));

console.log(`\n${pass} ok, ${fail} fallos`);
await env.cleanup();
process.exit(fail ? 1 : 0);
