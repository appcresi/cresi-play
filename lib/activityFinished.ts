// lib/activityFinished.ts
//
// Único lugar al que avisa una pantalla cuando la persona TERMINA una
// actividad (cada vez, no solo la primera). De acá salen:
//   - los eventos de analítica (`activity_completed` la primera vez,
//     `activity_finished` siempre),
//   - la racha diaria y el reto del día,
//   - la pantalla final "qué sigue" (components/ActivityFinishedSheet.tsx).
//
// Antes cada pantalla llamaba a trackEvent('activity_completed', ...) por su
// cuenta, solo la primera vez y con nombres de parámetro distintos
// (activity_title / activity_id), y no había nada que se ejecutara al terminar
// una repetición.
import { trackEvent } from '@/lib/analytics';
import UserDataManager from '@/lib/userDataManager';
import { auth } from '@/lib/firebaseAuth';

export const ACTIVITY_FINISHED_EVENT = 'cresi:activity-finished';

export interface ActivityFinishedDetail {
  /** Título del catálogo (o clave de la actividad) que terminó. */
  title: string;
  /** true solo la vez que cumplió el reto del día. */
  challengeJustDone: boolean;
}

export interface ActivityFinishedOptions {
  /** ¿Es la primera vez que completa esta actividad? (para `activity_completed`). */
  firstTime?: boolean;
  /** Datos extra para la analítica (p. ej. la lección o el cuento). */
  extra?: Record<string, unknown>;
  /** No mostrar la pantalla final (uso embebido dentro de una tarea). */
  silent?: boolean;
}

export function reportActivityFinished(title: string, options: ActivityFinishedOptions = {}): void {
  const { firstTime = false, extra, silent = false } = options;
  try {
    if (firstTime) trackEvent('activity_completed', { activity_title: title, ...extra });
    trackEvent('activity_finished', { activity_title: title, first_time: firstTime, ...extra });

    // Sin ninguna sesión (ni siquiera anónima) no se guarda racha ni reto: así
    // no se crea un perfil "fantasma" en localStorage de alguien que nunca
    // ingresó (mismo criterio que GameStatusBar).
    let challengeJustDone = false;
    if (auth.currentUser) {
      UserDataManager.registerPlayDay();
      challengeJustDone = UserDataManager.completeDailyChallenge(title);
    }

    if (!silent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<ActivityFinishedDetail>(ACTIVITY_FINISHED_EVENT, { detail: { title, challengeJustDone } }));
    }
  } catch (err) {
    // Nunca debe romper el final de un juego.
    console.error('No se pudo registrar el final de la actividad:', err);
  }
}
