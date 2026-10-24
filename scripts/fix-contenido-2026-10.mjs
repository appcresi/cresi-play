/**
 * scripts/fix-contenido-2026-10.mjs
 *
 * Mejoras de contenido a partir del informe de insights del 23/10/2026:
 *
 *   1. Corrige las 5 preguntas con más error (el problema estaba en la
 *      pregunta, no en quien responde): ansiedad, depresión, útero,
 *      densidad ósea y stealthing.
 *   2. Corrige 11 preguntas de Diversidad desactualizadas o con errores.
 *   3. Suma 50 preguntas nuevas de Diversidad en 3 niveles (la categoría
 *      tenía 25, todas de nivel 1, y en la ruleta se agotaba enseguida).
 *
 * Las correcciones se aplican al banco (`questions`) y a las copias dentro
 * de las trivias de CrESI (author 'CRESI'). Las trivias de docentes NO se
 * tocan: se listan para avisarle a quien corresponda. En cada pregunta
 * corregida de una trivia se reinicia su `questionStats`, para que el % de
 * error del panel mida la versión nueva y no mezcle con la vieja.
 *
 * Datos: scripts/data/correcciones-contenido-2026-10.mjs y
 *        scripts/data/diversidad-questions.mjs
 *
 * SEGURO POR DEFECTO: corre en modo simulación — no escribe nada hasta que
 * lo corras con --apply. Con --apply, antes de escribir guarda un backup de
 * todo lo que va a tocar en ../backups-firestore/.
 *
 * Cómo correrlo:
 *   1. Ver qué cambiaría, sin tocar nada:
 *        node scripts/fix-contenido-2026-10.mjs
 *   2. Si se ve bien, aplicar de verdad (solo los puntos 1 y 2):
 *        node scripts/fix-contenido-2026-10.mjs --apply
 *   3. Las 50 preguntas nuevas (punto 3) se suben solo si se agrega
 *      --incluir-nuevas, después de que el equipo de ESI las revise:
 *        node scripts/fix-contenido-2026-10.mjs --incluir-nuevas --apply
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { correccionesError, correccionesDiversidad } from './data/correcciones-contenido-2026-10.mjs';
import { questions as preguntasNuevasDiversidad } from './data/diversidad-questions.mjs';

config({ path: '.env.local' });

const { FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY } = process.env;

if (!FIREBASE_ADMIN_PROJECT_ID || !FIREBASE_ADMIN_CLIENT_EMAIL || !FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('❌ Faltan variables de entorno en .env.local (FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const APPLY = process.argv.includes('--apply');
// Las 50 preguntas nuevas esperan una revisión más exhaustiva del equipo de
// ESI: solo se suben si se pide explícitamente.
const INCLUIR_NUEVAS = process.argv.includes('--incluir-nuevas');
const nuevasDiversidad = INCLUIR_NUEVAS ? preguntasNuevasDiversidad : [];
const CRESI_AUTHOR = 'CRESI';
const DIVERSIDAD = 'Diversidad';
const BACKUP_DIR = path.resolve('..', 'backups-firestore');

/** Comparación sin mayúsculas, tildes de más ni espacios repetidos. */
const norm = (s) => String(s ?? '').normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();

const correcciones = [
  ...correccionesError.map((c) => ({ ...c, grupo: 'error' })),
  ...correccionesDiversidad.map((c) => ({ ...c, grupo: 'diversidad' })),
];

async function main() {
  console.log(APPLY ? '🔧 Modo APLICAR — se va a escribir en Firestore.\n' : '👀 Modo SIMULACIÓN — no se escribe nada.\n');

  const [bancoSnap, triviaSnap] = await Promise.all([db.collection('questions').get(), db.collection('trivia').get()]);
  const problemas = [];

  // ── 1 y 2. Correcciones ──────────────────────────────────────────────
  const bancoUpdates = []; // { ref, antes, despues }
  const triviaUpdates = new Map(); // triviaId -> { ref, nombre, antes, indices: Map(i -> set) }
  const triviasDocentes = []; // copias que no se tocan

  for (const c of correcciones) {
    const target = norm(c.match);

    const enBanco = bancoSnap.docs.filter((d) => norm(d.data().question) === target);
    if (enBanco.length !== 1) problemas.push(`Banco: "${c.match}" aparece ${enBanco.length} veces (se esperaba 1).`);
    for (const d of enBanco) bancoUpdates.push({ ref: d.ref, id: d.id, antes: d.data(), set: c.set, grupo: c.grupo });

    for (const t of triviaSnap.docs) {
      const data = t.data();
      (data.questions || []).forEach((q, i) => {
        if (norm(q.question) !== target) return;
        if (data.author !== CRESI_AUTHOR) {
          triviasDocentes.push({ trivia: data.name, id: t.id, pregunta: c.match });
          return;
        }
        if (!triviaUpdates.has(t.id)) triviaUpdates.set(t.id, { ref: t.ref, nombre: data.name, antes: data, indices: new Map() });
        triviaUpdates.get(t.id).indices.set(i, c.set);
      });
    }
  }

  console.log(`1-2. Correcciones: ${correcciones.length} preguntas`);
  for (const c of correcciones) {
    const cambia = norm(c.match) !== norm(c.set.question);
    console.log(`  • [${c.grupo}] ${c.match}${cambia ? `\n      → ${c.set.question}` : ''}\n      ✔ ${c.set.answer}`);
  }
  console.log(`\n   Banco: ${bancoUpdates.length} documentos a actualizar`);
  console.log(`   Trivias de CrESI: ${[...triviaUpdates.values()].map((t) => `${t.nombre} (${t.indices.size})`).join(', ') || 'ninguna'}`);
  if (triviasDocentes.length) {
    console.log('   Trivias de docentes con la pregunta vieja (NO se tocan):');
    triviasDocentes.forEach((t) => console.log(`     - "${t.trivia}" (${t.id}): ${t.pregunta}`));
  }

  // ── 3. Preguntas nuevas de Diversidad ────────────────────────────────
  const existentes = new Set(bancoSnap.docs.map((d) => norm(d.data().question)));
  const corregidas = new Set(correcciones.map((c) => norm(c.set.question)));
  const repetidas = nuevasDiversidad.filter((q) => existentes.has(norm(q.question)) || corregidas.has(norm(q.question)));
  if (repetidas.length) problemas.push(`Preguntas nuevas que ya existen en el banco: ${repetidas.map((q) => q.question).join(' | ')}`);

  const porNivel = nuevasDiversidad.reduce((acc, q) => ({ ...acc, [q.level]: (acc[q.level] || 0) + 1 }), {});
  console.log(INCLUIR_NUEVAS
    ? `\n3. Preguntas nuevas de Diversidad: ${nuevasDiversidad.length} (por nivel: ${JSON.stringify(porNivel)})`
    : `\n3. Preguntas nuevas de Diversidad: NO se suben (${preguntasNuevasDiversidad.length} pendientes de revisión; para incluirlas, agregá --incluir-nuevas).`);
  nuevasDiversidad.forEach((q, i) => console.log(`  ${String(i + 1).padStart(2)}. [N${q.level}] ${q.question}`));

  // Controles de calidad de cada pregunta nueva.
  for (const q of nuevasDiversidad) {
    const opciones = Object.values(q.options || {});
    if (opciones.length !== 3) problemas.push(`"${q.question}": tiene ${opciones.length} distractores (se esperan 3).`);
    if (opciones.some((o) => norm(o) === norm(q.answer))) problemas.push(`"${q.question}": la respuesta correcta aparece también como distractor.`);
    if (new Set(opciones.map(norm)).size !== opciones.length) problemas.push(`"${q.question}": distractores repetidos.`);
    if (!q.resume) problemas.push(`"${q.question}": falta el resumen.`);
  }

  if (problemas.length) {
    console.log('\n⚠️  Problemas encontrados:');
    problemas.forEach((p) => console.log(`   - ${p}`));
    if (APPLY) {
      console.log('\n❌ No se aplicó nada: corregí los problemas y volvé a correr.');
      process.exit(1);
    }
  }

  if (!APPLY) {
    console.log('\nEsto fue una simulación — no se escribió nada.');
    console.log('Si todo se ve bien, corré:\n  node scripts/fix-contenido-2026-10.mjs --apply');
    process.exit(0);
  }

  // ── Backup ───────────────────────────────────────────────────────────
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = path.join(BACKUP_DIR, `contenido-antes-fix-2026-10-${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({
    banco: bancoUpdates.map((u) => ({ id: u.id, data: u.antes })),
    trivias: [...triviaUpdates.entries()].map(([id, t]) => ({ id, data: t.antes })),
  }, null, 2));
  console.log(`\n💾 Backup guardado en ${backupFile}`);

  // ── Escritura ────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const batch = db.batch();

  for (const u of bancoUpdates) {
    batch.update(u.ref, { ...u.set, updated_at: now });
  }

  for (const [, t] of triviaUpdates) {
    const preguntas = (t.antes.questions || []).map((q, i) => (t.indices.has(i) ? { ...q, ...t.indices.get(i) } : q));
    const update = { questions: preguntas, updated_at: now };
    for (const i of t.indices.keys()) update[`questionStats.${i}`] = FieldValue.delete();
    batch.update(t.ref, update);
  }

  const coleccion = db.collection('questions');
  for (const q of nuevasDiversidad) {
    batch.set(coleccion.doc(), {
      question: q.question,
      options: q.options,
      answer: q.answer,
      level: q.level,
      category: DIVERSIDAD,
      tag: q.tag,
      resume: q.resume,
      created_at: now,
      updated_at: now,
    });
  }

  await batch.commit();
  console.log(`✅ Listo: ${bancoUpdates.length} preguntas corregidas en el banco, ${triviaUpdates.size} trivias de CrESI actualizadas y ${nuevasDiversidad.length} preguntas nuevas de Diversidad.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error corriendo el script:', err);
  process.exit(1);
});
