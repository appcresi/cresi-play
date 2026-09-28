// lib/leaderboardServer.ts
//
// Escrituras y lecturas del ranking del modo libre con el Admin SDK (ver
// lib/leaderboard.ts para el modelo). El cliente no puede tocar estas
// colecciones: el puntaje que llega acá es el que ya aceptó /api/sync-score.
import 'server-only';
import {
  FieldValue,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
  type Transaction,
  type WriteBatch,
} from 'firebase-admin/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';
import {
  LEADERBOARD_SIZE,
  isLeaderboardEligible,
  nextWeekReset,
  publicAlias,
  safeCharacterImage,
  weekKey,
  type LeaderboardMe,
  type LeaderboardResponse,
  type LeaderboardRow,
} from '@/lib/leaderboard';

const ALL_TIME = 'leaderboard';
const WEEKS = 'leaderboardWeeks';

export const allTimeRef = (db: Firestore, uid: string) => db.collection(ALL_TIME).doc(uid);
export const weekRef = (db: Firestore, week: string, uid: string) =>
  db.collection(WEEKS).doc(week).collection('entries').doc(uid);

export function isGuestToken(decoded: DecodedIdToken): boolean {
  return decoded.firebase?.sign_in_provider === 'anonymous';
}

/** ¿El documento de `users` + el token habilitan a estar en el ranking? */
export function eligibleFor(user: DocumentData, decoded: DecodedIdToken): boolean {
  return isLeaderboardEligible({
    classStudentClaim: decoded.student,
    role: user.profile?.role,
    classroomId: user.profile?.classroomId,
    blocked: user.leaderboard?.blocked,
  });
}

/** Lo que se muestra públicamente de una persona. Nada más sale de `users`. */
function publicFields(user: DocumentData, decoded: DecodedIdToken) {
  return {
    name: publicAlias(user.profile?.username),
    characterImage: safeCharacterImage(user.profile?.character?.image),
    guest: isGuestToken(decoded),
    updatedAt: Date.now(),
  };
}

/**
 * Deja el ranking al día dentro de la transacción de /api/sync-score.
 * `earned` son los puntos NUEVOS aceptados en este sync: suman a la semana.
 * El histórico muestra el puntaje total (el mismo que ve la persona en su barra).
 * Devuelve los campos a sumar al update de `users/{uid}` que ya hace la
 * transacción (así queda una sola escritura sobre ese documento).
 */
export function writeEntriesInTx(
  tx: Transaction,
  db: Firestore,
  uid: string,
  user: DocumentData,
  decoded: DecodedIdToken,
  score: number,
  earned: number
): Record<string, unknown> {
  const week = weekKey();
  const base = publicFields(user, decoded);
  tx.set(allTimeRef(db, uid), { ...base, score });
  tx.set(
    weekRef(db, week, uid),
    { ...base, weeklyScore: FieldValue.increment(Math.max(0, earned)) },
    { merge: true }
  );
  // Para poder borrar después todas sus semanas (baja o borrado de cuenta)
  // sin una consulta collectionGroup, que pediría un índice aparte.
  const known = Array.isArray(user.leaderboard?.weeks) && user.leaderboard.weeks.includes(week);
  return known ? {} : { 'leaderboard.weeks': FieldValue.arrayUnion(week) };
}

/**
 * Saca a alguien de ambos rankings (todas las semanas en que apareció).
 * Sirve dentro de una transacción o de un batch (borrado de cuenta).
 */
export function deleteEntriesInTx(
  tx: Pick<Transaction, 'delete'> | Pick<WriteBatch, 'delete'>,
  db: Firestore,
  uid: string,
  user: DocumentData | undefined
): void {
  tx.delete(allTimeRef(db, uid));
  const weeks: unknown[] = Array.isArray(user?.leaderboard?.weeks) ? user!.leaderboard.weeks : [];
  for (const week of new Set([...weeks, weekKey()])) {
    if (typeof week === 'string') tx.delete(weekRef(db, week, uid));
  }
}

// ── Lectura pública ────────────────────────────────────────────────────
//
// La landing lo muestra a cada visita: se guarda un minuto en memoria para no
// gastar ~40 lecturas por visita (además del Cache-Control de la ruta).
const CACHE_MS = 60_000;
let cached: { at: number; data: LeaderboardResponse } | null = null;

function toRows(docs: QueryDocumentSnapshot[], field: 'score' | 'weeklyScore'): LeaderboardRow[] {
  return docs
    .map((d) => d.data())
    .filter((d) => Number(d[field]) > 0)
    .map((d, i) => ({
      rank: i + 1,
      name: typeof d.name === 'string' ? d.name : 'Jugador/a',
      characterImage: safeCharacterImage(d.characterImage),
      score: Math.floor(Number(d[field]) || 0),
      guest: d.guest === true,
    }));
}

export async function readLeaderboard(db: Firestore): Promise<LeaderboardResponse> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) return cached.data;

  const week = weekKey();
  const [weekSnap, allSnap] = await Promise.all([
    db.collection(WEEKS).doc(week).collection('entries').orderBy('weeklyScore', 'desc').limit(LEADERBOARD_SIZE).get(),
    db.collection(ALL_TIME).orderBy('score', 'desc').limit(LEADERBOARD_SIZE).get(),
  ]);

  const data: LeaderboardResponse = {
    weekKey: week,
    resetsAt: nextWeekReset().toISOString(),
    week: toRows(weekSnap.docs, 'weeklyScore'),
    allTime: toRows(allSnap.docs, 'score'),
  };
  cached = { at: now, data };
  return data;
}

/** Tras sumarse o bajarse, que la lista pública lo refleje ya en esta instancia. */
export function invalidateLeaderboardCache(): void {
  cached = null;
}

// ── Estado propio ──────────────────────────────────────────────────────

export async function readMe(db: Firestore, uid: string, user: DocumentData, decoded: DecodedIdToken): Promise<LeaderboardMe> {
  const eligible = eligibleFor(user, decoded);
  const optIn = eligible && user.leaderboard?.optIn === true;
  const base = {
    eligible,
    optIn,
    alias: publicAlias(user.profile?.username),
    guest: isGuestToken(decoded),
  };
  if (!optIn) {
    return { ...base, week: { score: 0, rank: null }, allTime: { score: 0, rank: null } };
  }

  const week = weekKey();
  const weekEntries = db.collection(WEEKS).doc(week).collection('entries');
  const [weekDoc, allDoc] = await Promise.all([weekEntries.doc(uid).get(), allTimeRef(db, uid).get()]);
  const weekScore = Math.floor(Number(weekDoc.data()?.weeklyScore) || 0);
  const allScore = Math.floor(Number(allDoc.data()?.score) || 0);

  // Posición = cuántos tienen más puntos + 1 (consultas de conteo: 1 lectura cada 1000).
  const [weekAhead, allAhead] = await Promise.all([
    weekScore > 0 ? weekEntries.where('weeklyScore', '>', weekScore).count().get() : null,
    allScore > 0 ? db.collection(ALL_TIME).where('score', '>', allScore).count().get() : null,
  ]);

  return {
    ...base,
    week: { score: weekScore, rank: weekAhead ? weekAhead.data().count + 1 : null },
    allTime: { score: allScore, rank: allAhead ? allAhead.data().count + 1 : null },
  };
}
