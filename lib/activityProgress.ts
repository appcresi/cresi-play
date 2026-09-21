// lib/activityProgress.ts
//
// Único lugar que sabe cómo se anota el avance de una actividad dentro de
// `UserData.progress`. Antes cada pantalla repetía a mano el mismo bloque
// (cargar, mezclar `activityScores` / `activityTimes` / `completedActivities`,
// guardar), con dos criterios de puntaje distintos según el juego — de ahí
// que copias casi idénticas fueran divergiendo.
//
// Todo acá es puro (no toca localStorage ni Firestore) para poder
// probarlo sin navegador. Las pantallas siguen decidiendo qué pasa con
// `game.totalScore`; esto solo cubre `progress`.
import type { UserProgress } from '@/types/user';

export interface ActivityRecord {
  /** Clave en `activityScores` / `activityTimes` / `completedActivities`:
   *  el título de la actividad, o una clave más fina (una trivia, una
   *  lección, un sistema de BioPuzzle). */
  key: string;
  /** Puntaje a registrar. Omitido: no se toca `activityScores[key]`. */
  score?: number;
  /** 'best' (por defecto) conserva el mejor puntaje de una sesión;
   *  'add' acumula (juegos donde cada acción suma). */
  scoreMode?: 'best' | 'add';
  /** Marca `key` como completada. */
  complete?: boolean;
  /** Actualiza `activityTimes[key]` (por defecto sí). */
  touchTime?: boolean;
}

export function recordActivityProgress(
  progress: UserProgress,
  records: ActivityRecord[],
  now: string = new Date().toISOString()
): UserProgress {
  const activityScores = { ...progress.activityScores };
  const activityTimes = { ...progress.activityTimes };
  const completed = new Set(progress.completedActivities);

  for (const { key, score, scoreMode = 'best', complete = false, touchTime = true } of records) {
    if (score !== undefined) {
      const previous = activityScores[key] || 0;
      activityScores[key] = scoreMode === 'add' ? previous + score : Math.max(previous, score);
    }
    if (touchTime) activityTimes[key] = now;
    if (complete) completed.add(key);
  }

  return {
    ...progress,
    activityScores,
    activityTimes,
    // Solo se reconstruye el arreglo si algo cambió, para no romper
    // comparaciones por referencia en quien lo mire.
    completedActivities: completed.size === progress.completedActivities.length
      ? progress.completedActivities
      : Array.from(completed),
  };
}

/** ¿`key` pasó a estar completada con este cambio (y no lo estaba antes)? */
export function becameCompleted(before: UserProgress, after: UserProgress, key: string): boolean {
  return !before.completedActivities.includes(key) && after.completedActivities.includes(key);
}

/**
 * Cuántas de las actividades del catálogo están completadas.
 * `completedActivities` también guarda claves finas (una por trivia, por
 * lección, por sistema de BioPuzzle), así que contar `.length` infla el
 * número — hay que filtrar contra los títulos reales.
 */
export function countCompletedCatalog(completedActivities: string[], catalogTitles: Iterable<string>): number {
  const titles = new Set(catalogTitles);
  return new Set(completedActivities.filter((key) => titles.has(key))).size;
}
