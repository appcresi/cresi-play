import { describe, expect, it } from 'vitest';
import { advanceStreak, dayKey, daysBetween, readStreak, reachedMilestone, viewStreak, nextPlayDayLabel } from './dailyStreak';
import { CHALLENGE_POOL, challengeCandidates, pickDailyChallenge, viewDailyChallenge } from './dailyChallenge';
import { ACTIVITIES } from './activities';

// 2026-09-18 es viernes, 19 sábado, 20 domingo, 21 lunes, 22 martes, 23 miércoles.
const VIE = '2026-09-18';
const LUN = '2026-09-21';
const MAR = '2026-09-22';
const MIE = '2026-09-23';

describe('dayKey y daysBetween', () => {
  it('usa la fecha local, con ceros', () => {
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(dayKey(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31');
  });

  it('cuenta días de calendario, también cruzando mes y año', () => {
    expect(daysBetween('2026-09-21', '2026-09-22')).toBe(1);
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
    expect(daysBetween('2026-02-28', '2026-03-01')).toBe(1);
    expect(daysBetween('2026-09-22', '2026-09-21')).toBe(-1);
  });
});

describe('advanceStreak', () => {
  it('el primer día arranca en 1', () => {
    const r = advanceStreak(undefined, LUN);
    expect(r.status).toBe('first');
    expect(r.streak).toEqual({ current: 1, best: 1, lastDay: LUN });
    expect(r.daysAway).toBeNull();
  });

  it('jugar dos veces el mismo día no suma', () => {
    const first = advanceStreak(undefined, LUN).streak;
    const again = advanceStreak(first, LUN);
    expect(again.status).toBe('same-day');
    expect(again.streak).toEqual(first);
  });

  it('el día siguiente suma y actualiza el mejor', () => {
    let s = advanceStreak(undefined, LUN).streak;
    s = advanceStreak(s, MAR).streak;
    const r = advanceStreak(s, MIE);
    expect(r.status).toBe('continued');
    expect(r.streak).toEqual({ current: 3, best: 3, lastDay: MIE });
  });

  it('el fin de semana no corta la racha (viernes → lunes)', () => {
    const s = { current: 4, best: 4, lastDay: VIE };
    const r = advanceStreak(s, LUN);
    expect(r.status).toBe('continued');
    expect(r.streak.current).toBe(5);
  });

  it('un día hábil de por medio SÍ la corta (lunes → miércoles)', () => {
    const s = { current: 4, best: 6, lastDay: LUN };
    const r = advanceStreak(s, MIE);
    expect(r.status).toBe('restarted');
    expect(r.streak).toEqual({ current: 1, best: 6, lastDay: MIE });
  });

  it('un reloj atrasado no rompe nada', () => {
    const s = { current: 3, best: 3, lastDay: MIE };
    const r = advanceStreak(s, LUN);
    expect(r.status).toBe('same-day');
    expect(r.streak).toEqual(s);
  });

  it('cruza el fin de año', () => {
    const r = advanceStreak({ current: 2, best: 2, lastDay: '2026-12-31' }, '2027-01-01');
    expect(r.status).toBe('continued');
    expect(r.streak.current).toBe(3);
  });
});

describe('readStreak tolera datos viejos o rotos', () => {
  it('sin datos, vacío', () => {
    expect(readStreak(undefined)).toEqual({ current: 0, best: 0, lastDay: null });
    expect(readStreak(null)).toEqual({ current: 0, best: 0, lastDay: null });
  });

  it('descarta fechas inválidas y números raros', () => {
    expect(readStreak({ current: 5, best: 5, lastDay: 'ayer' })).toEqual({ current: 0, best: 0, lastDay: null });
    expect(readStreak({ current: -2, best: 1.5, lastDay: LUN })).toEqual({ current: 0, best: 0, lastDay: LUN });
    expect(readStreak({ current: 'x' as unknown as number, best: 2, lastDay: LUN }).current).toBe(0);
  });

  it('el mejor nunca es menor que la actual', () => {
    expect(readStreak({ current: 5, best: 2, lastDay: LUN }).best).toBe(5);
  });
});

describe('viewStreak (lo que se muestra hoy)', () => {
  it('sin historia: 0 y sin riesgo', () => {
    expect(viewStreak(undefined, LUN)).toEqual({ current: 0, best: 0, playedToday: false, atRisk: false });
  });

  it('jugó hoy: se muestra y no está en riesgo', () => {
    expect(viewStreak({ current: 4, best: 6, lastDay: LUN }, LUN)).toEqual({ current: 4, best: 6, playedToday: true, atRisk: false });
  });

  it('jugó ayer: sigue viva pero en riesgo hasta que juegue hoy', () => {
    expect(viewStreak({ current: 4, best: 6, lastDay: LUN }, MAR)).toEqual({ current: 4, best: 6, playedToday: false, atRisk: true });
  });

  it('el lunes sigue viva si jugó el viernes', () => {
    expect(viewStreak({ current: 4, best: 4, lastDay: VIE }, LUN).current).toBe(4);
  });

  it('pasado el plazo se muestra 0, pero se recuerda el mejor', () => {
    expect(viewStreak({ current: 4, best: 6, lastDay: LUN }, MIE)).toEqual({ current: 0, best: 6, playedToday: false, atRisk: false });
  });
});

describe('hitos', () => {
  it('solo los días redondos se celebran', () => {
    expect(reachedMilestone(3)).toBe(3);
    expect(reachedMilestone(7)).toBe(7);
    expect(reachedMilestone(4)).toBeNull();
    expect(reachedMilestone(0)).toBeNull();
  });
});

describe('nextPlayDayLabel', () => {
  it('de lunes a jueves es mañana; viernes y sábado, el lunes; domingo, mañana', () => {
    expect(nextPlayDayLabel(LUN)).toBe('mañana');
    expect(nextPlayDayLabel(MIE)).toBe('mañana');
    expect(nextPlayDayLabel(VIE)).toBe('el lunes');
    expect(nextPlayDayLabel('2026-09-19')).toBe('el lunes');
    expect(nextPlayDayLabel('2026-09-20')).toBe('mañana');
  });
});

describe('reto del día', () => {
  const ids = ['trivias', 'pasapalabras', 'completa', 'datamuncher', 'condon'];

  it('es el mismo para el mismo día, sin importar el orden de la lista', () => {
    const a = pickDailyChallenge(ids, LUN);
    expect(a).toBe(pickDailyChallenge([...ids].reverse(), LUN));
    expect(ids).toContain(a);
  });

  it('cambia con los días (no es siempre el mismo)', () => {
    const days = Array.from({ length: 14 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
    const picked = new Set(days.map((d) => pickDailyChallenge(ids, d)));
    expect(picked.size).toBeGreaterThan(2);
  });

  it('sin actividades disponibles, no hay reto', () => {
    expect(pickDailyChallenge([], LUN)).toBeNull();
    expect(viewDailyChallenge([], LUN, undefined)).toBeNull();
  });

  it('si ya hay un reto guardado para hoy, manda ese (aunque la lista cambie)', () => {
    const view = viewDailyChallenge(['trivias'], LUN, { day: LUN, activityId: 'condon', done: true });
    expect(view).toEqual({ activityId: 'condon', done: true });
  });

  it('un reto guardado de otro día no vale: se elige uno nuevo, sin cumplir', () => {
    const view = viewDailyChallenge(ids, LUN, { day: MAR, activityId: 'condon', done: true });
    expect(view?.done).toBe(false);
    expect(ids).toContain(view?.activityId);
  });

  it('el pozo solo tiene actividades que existen en el catálogo', () => {
    const catalog = ACTIVITIES.map((a) => a.id);
    for (const id of CHALLENGE_POOL) expect(catalog).toContain(id);
  });

  it('respeta las actividades que el docente habilitó', () => {
    expect(challengeCandidates(null)).toEqual([...CHALLENGE_POOL]);
    expect(challengeCandidates(['trivias', 'moodtracker'])).toEqual(['trivias']);
    expect(challengeCandidates([])).toEqual([]);
  });
});
