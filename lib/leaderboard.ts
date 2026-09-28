// Ranking del modo libre (quien juega por su cuenta, sin clase). Todo acá es
// puro — sin Firestore ni navegador — para poder probarlo y usarlo tanto en
// el servidor (sync-score, /api/leaderboard) como en el cliente.
//
// Dónde vive cada cosa:
//   leaderboard/{uid}                              → ranking histórico
//   leaderboardWeeks/{weekKey}/entries/{uid}       → ranking de la semana
//   users/{uid}.leaderboard { optIn, since, weeks, blocked }
// Las tres las escribe solo el servidor (ver firestore.rules).

/** Cuántas personas muestra cada ranking. */
export const LEADERBOARD_SIZE = 20;

/** Las semanas se cortan el lunes a las 00:00 de Argentina (UTC-3, sin horario de verano). */
const AR_OFFSET_MS = -3 * 60 * 60 * 1000;

/**
 * Semana ISO en hora argentina, como '2026-W39'. Es la clave de
 * `leaderboardWeeks/{weekKey}`: al cambiar, el ranking semanal arranca de cero
 * solo, sin tener que borrar nada.
 */
export function weekKey(now: Date = new Date()): string {
  const local = new Date(now.getTime() + AR_OFFSET_MS);
  // Algoritmo ISO 8601: el jueves de la semana decide a qué año pertenece.
  const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  const weekday = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

/** Cuándo se reinicia el ranking semanal (próximo lunes 00:00 de Argentina). */
export function nextWeekReset(now: Date = new Date()): Date {
  const local = new Date(now.getTime() + AR_OFFSET_MS);
  const weekday = local.getUTCDay() || 7;
  const monday = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 8 - weekday);
  return new Date(monday - AR_OFFSET_MS);
}

// Lista corta a propósito: no pretende ser un filtro completo, solo evitar lo
// obvio en una lista que se ve en la página pública. Para lo demás está
// `users/{uid}.leaderboard.blocked` (lo pone el admin a mano).
const BLOCKED_WORDS = [
  // Sin palabras que también son nombres o partes de nombres (Concha, Penélope...).
  'puto', 'puta', 'trolo', 'trola', 'pija', 'verga', 'culo', 'forro', 'forra',
  'pelotudo', 'pelotuda', 'boludo', 'boluda', 'mierda', 'garch', 'coger', 'cogid', 'chupala',
  'hdp', 'nazi', 'hitler', 'mogolic', 'retrasad', 'porno', 'vagina',
];

const FALLBACK_ALIAS = 'Jugador/a';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[0@]/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/[5$]/g, 's');
}

/**
 * Nombre que se muestra en el ranking público. En /unirse se pide "tu
 * nombre", así que puede ser el nombre real de un/a menor: se muestra solo la
 * primera palabra y la inicial de la segunda ("Juana Pérez" → "Juana P.").
 * Si no queda nada legible o tiene una palabra bloqueada, sale un genérico.
 */
export function publicAlias(username: unknown): string {
  if (typeof username !== 'string') return FALLBACK_ALIAS;
  const words = username
    .replace(/[^\p{L}\p{N} _.-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return FALLBACK_ALIAS;

  const first = words[0].slice(0, 15);
  const initial = words[1] ? ` ${words[1][0].toUpperCase()}.` : '';
  const alias = `${first}${initial}`;

  const flat = normalize(words.join(' '));
  const compact = flat.replace(/[\s_.-]/g, '');
  if (BLOCKED_WORDS.some((w) => flat.includes(w) || compact.includes(w.replace(/\s/g, '')))) {
    return FALLBACK_ALIAS;
  }
  return alias;
}

/** Solo las imágenes de personaje que existen en /public; cualquier otra cosa, ninguna. */
export function safeCharacterImage(image: unknown): string | null {
  return typeof image === 'string' && /^\/personaje\d{1,2}\.webp$/.test(image) ? image : null;
}

interface EligibilityInput {
  /** Marca `student` del token: entró con código de clase (/api/join-class). */
  classStudentClaim?: unknown;
  role?: unknown;
  classroomId?: unknown;
  blocked?: unknown;
}

/**
 * ¿Puede estar en el ranking? Solo el modo libre: ni docentes ni alumnos de
 * una clase (esos tienen su propio ranking dentro del aula). Anónimos sí.
 */
export function isLeaderboardEligible({ classStudentClaim, role, classroomId, blocked }: EligibilityInput): boolean {
  if (classStudentClaim === true) return false;
  if (role === 'teacher') return false;
  if (typeof classroomId === 'string' && classroomId.length > 0) return false;
  if (blocked === true) return false;
  return true;
}

/** Una fila del ranking tal como la devuelve /api/leaderboard. */
export interface LeaderboardRow {
  rank: number;
  name: string;
  characterImage: string | null;
  score: number;
  /** Juega como invitado (sin Google): se muestra con una marca. */
  guest: boolean;
}

export interface LeaderboardResponse {
  weekKey: string;
  /** ISO de cuándo arranca la próxima semana. */
  resetsAt: string;
  week: LeaderboardRow[];
  allTime: LeaderboardRow[];
}

/** Estado propio, de /api/leaderboard/me. */
export interface LeaderboardMe {
  eligible: boolean;
  optIn: boolean;
  alias: string;
  guest: boolean;
  week: { score: number; rank: number | null };
  allTime: { score: number; rank: number | null };
}
