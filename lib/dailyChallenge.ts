// lib/dailyChallenge.ts
//
// "Reto del día": una actividad del catálogo que cambia cada día, igual para
// todos (sale de la fecha, sin pedirle nada al servidor). Cumplirlo se marca
// con un tilde y suma al contador de retos cumplidos.
//
// A propósito NO da puntos ni vidas: las pantallas de juego son dueñas de su
// puntaje y sus vidas (GameStatusBar los pisa con lo que ellas tienen en
// memoria), así que un premio escrito "desde afuera" se perdería al instante.
//
// Es puro: userDataManager.ts guarda el reto de hoy en `progress.dailyChallenge`.
import type { DailyChallengeState } from '@/types/user';

/**
 * Actividades que tienen sentido como reto: juegos y lecciones que se pueden
 * repetir. Quedan afuera los tests personales (salud mental, vocacional,
 * amor, lenguajes del amor), el ánimo, el generador de memes y el buscador.
 */
export const CHALLENGE_POOL = [
  'trivias',
  'pasapalabras',
  'completa',
  'datamuncher',
  'impostor',
  'biopuzzle',
  'lecciones',
  'semaforo',
  'simulador',
  'condon',
] as const;

/** Del pozo, lo que la persona puede ver (`allowed` = null: sin restricción de la clase). */
export function challengeCandidates(allowed: readonly string[] | null): string[] {
  return CHALLENGE_POOL.filter((id) => !allowed || allowed.includes(id));
}

/** Hash chico y estable de un texto (no criptográfico). */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * La actividad del día entre `ids`. Devuelve null si no hay ninguna.
 * Es estable para el mismo día y lista, y no depende del orden de `ids`.
 */
export function pickDailyChallenge(ids: readonly string[], day: string): string | null {
  if (ids.length === 0) return null;
  const sorted = [...ids].sort();
  return sorted[hash(day) % sorted.length];
}

export interface DailyChallengeView {
  activityId: string;
  done: boolean;
}

export function viewDailyChallenge(
  ids: readonly string[],
  day: string,
  state: DailyChallengeState | undefined
): DailyChallengeView | null {
  // Si ya hay uno guardado para hoy, manda ese (no cambia cuando termina de
  // cargar la lista de actividades habilitadas por el docente).
  if (state?.day === day) return { activityId: state.activityId, done: state.done === true };
  const activityId = pickDailyChallenge(ids, day);
  return activityId ? { activityId, done: false } : null;
}
