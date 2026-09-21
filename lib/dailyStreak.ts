// lib/dailyStreak.ts
//
// Racha de días con actividad. Todo puro (sin localStorage ni Firestore) para
// poder probarlo sin navegador; userDataManager.ts lo guarda en
// `progress.activityStreak` y lo espeja en `game.streak`.
//
// Antes `game.streak` era la racha del registro de ÁNIMO (días seguidos con
// una entrada en el Mood Tracker), pero se mostraba como "Racha" en todo el
// sitio y en el panel del docente, así que nadie entendía qué contaba.
//
// Un día cuenta cuando la persona JUEGA (suma puntos o completa una
// actividad), no con solo abrir la página.
//
// Los fines de semana no cortan la racha: casi todo el uso es en clase, y una
// racha que se reinicia cada lunes desanima justo a quien más la usa.
// Cambiar FORGIVE_WEEKENDS a false la vuelve estricta.
import type { ActivityStreak } from '@/types/user';

export const FORGIVE_WEEKENDS = true;

/** Fecha LOCAL como 'YYYY-MM-DD' (el día que ve la persona, no el UTC). */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const parseDay = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // mediodía: evita saltos por cambio de horario
};

const isValidDayKey = (key: unknown): key is string => typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key);

/** Días de calendario entre dos claves (b - a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000);
}

const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

/** ¿Se puede pasar de `last` a `today` sin perder la racha? */
function isContinuation(last: string, today: string): boolean {
  const gap = daysBetween(last, today);
  if (gap <= 0) return false;
  if (gap === 1) return true;
  if (!FORGIVE_WEEKENDS) return false;
  // Todos los días de en medio tienen que ser sábado o domingo.
  const start = parseDay(last);
  for (let i = 1; i < gap; i++) {
    const between = new Date(start);
    between.setDate(start.getDate() + i);
    if (!isWeekend(between)) return false;
  }
  return true;
}

export const EMPTY_STREAK: ActivityStreak = { current: 0, best: 0, lastDay: null };

/** Normaliza lo guardado (puede faltar, venir viejo o roto). */
export function readStreak(value: Partial<ActivityStreak> | null | undefined): ActivityStreak {
  const current = Number.isInteger(value?.current) && (value!.current as number) > 0 ? (value!.current as number) : 0;
  const best = Number.isInteger(value?.best) && (value!.best as number) > 0 ? Math.max(value!.best as number, current) : current;
  const lastDay = isValidDayKey(value?.lastDay) ? value!.lastDay! : null;
  return lastDay ? { current, best, lastDay } : { ...EMPTY_STREAK };
}

export type StreakStatus =
  /** Primer día que juega. */
  | 'first'
  /** Ya había jugado hoy: no cambia nada. */
  | 'same-day'
  /** Jugó el día hábil anterior: la racha sube. */
  | 'continued'
  /** Se cortó (o volvió después de un tiempo): arranca de nuevo en 1. */
  | 'restarted';

export interface StreakAdvance {
  streak: ActivityStreak;
  status: StreakStatus;
  /** Días de calendario desde la última vez (null si era la primera). */
  daysAway: number | null;
}

/** Anota que hoy hubo actividad. */
export function advanceStreak(value: Partial<ActivityStreak> | null | undefined, today: string = dayKey()): StreakAdvance {
  const streak = readStreak(value);
  const last = streak.lastDay;

  if (!last) {
    return { streak: { current: 1, best: Math.max(1, streak.best), lastDay: today }, status: 'first', daysAway: null };
  }
  const daysAway = daysBetween(last, today);
  // Reloj atrasado o fecha rara: no se toca nada.
  if (daysAway <= 0) return { streak, status: 'same-day', daysAway: Math.max(0, daysAway) };

  if (isContinuation(last, today)) {
    const current = streak.current + 1;
    return { streak: { current, best: Math.max(streak.best, current), lastDay: today }, status: 'continued', daysAway };
  }
  return { streak: { current: 1, best: streak.best, lastDay: today }, status: 'restarted', daysAway };
}

export interface StreakView {
  /** La racha que corresponde mostrar hoy (0 si ya se cortó). */
  current: number;
  best: number;
  playedToday: boolean;
  /** Tiene racha y todavía no jugó hoy: hoy la puede perder o sumar. */
  atRisk: boolean;
}

/** Lo que se muestra hoy: una racha guardada de hace días ya no vale. */
export function viewStreak(value: Partial<ActivityStreak> | null | undefined, today: string = dayKey()): StreakView {
  const streak = readStreak(value);
  if (!streak.lastDay) return { current: 0, best: streak.best, playedToday: false, atRisk: false };

  if (streak.lastDay === today) {
    return { current: streak.current, best: streak.best, playedToday: true, atRisk: false };
  }
  if (isContinuation(streak.lastDay, today)) {
    return { current: streak.current, best: streak.best, playedToday: false, atRisk: streak.current > 0 };
  }
  return { current: 0, best: streak.best, playedToday: false, atRisk: false };
}

/** Hitos que se celebran. */
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;

export function reachedMilestone(current: number): number | null {
  return (STREAK_MILESTONES as readonly number[]).includes(current) ? current : null;
}

/** Cuándo tiene que volver para no cortar la racha: "mañana", o "el lunes" si mañana es fin de semana y los perdona. */
export function nextPlayDayLabel(today: string = dayKey()): 'mañana' | 'el lunes' {
  if (!FORGIVE_WEEKENDS) return 'mañana';
  const tomorrow = parseDay(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isWeekend(tomorrow) ? 'el lunes' : 'mañana';
}
