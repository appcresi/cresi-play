import { describe, expect, it } from 'vitest';
import { becameCompleted, countCompletedCatalog, recordActivityProgress } from './activityProgress';
import type { UserProgress } from '@/types/user';

const base = (over: Partial<UserProgress> = {}): UserProgress => ({
  completedActivities: [],
  activityScores: {},
  activityTimes: {},
  lastVisits: {},
  ...over,
});
const NOW = '2026-01-01T00:00:00.000Z';

describe('recordActivityProgress', () => {
  it("'best' conserva el mejor puntaje (por defecto)", () => {
    const p = recordActivityProgress(base({ activityScores: { A: 300 } }), [{ key: 'A', score: 100 }], NOW);
    expect(p.activityScores.A).toBe(300);
    const q = recordActivityProgress(p, [{ key: 'A', score: 500 }], NOW);
    expect(q.activityScores.A).toBe(500);
  });

  it("'add' acumula sobre lo anterior", () => {
    const p = recordActivityProgress(base({ activityScores: { A: 100 } }), [{ key: 'A', score: 50, scoreMode: 'add' }], NOW);
    expect(p.activityScores.A).toBe(150);
  });

  it('sin score no toca activityScores pero sí el tiempo', () => {
    const p = recordActivityProgress(base({ activityScores: { A: 7 } }), [{ key: 'A' }], NOW);
    expect(p.activityScores.A).toBe(7);
    expect(p.activityTimes.A).toBe(NOW);
  });

  it('touchTime: false no actualiza el tiempo', () => {
    const p = recordActivityProgress(base(), [{ key: 'A', score: 1, touchTime: false }], NOW);
    expect(p.activityTimes.A).toBeUndefined();
  });

  it('complete agrega la clave una sola vez', () => {
    const p = recordActivityProgress(base(), [{ key: 'A', complete: true }, { key: 'A', complete: true }], NOW);
    expect(p.completedActivities).toEqual(['A']);
  });

  it('acepta varias claves a la vez (título + clave fina)', () => {
    const p = recordActivityProgress(
      base(),
      [{ key: 'trivia-1', score: 80, complete: true }, { key: 'Trivias', complete: true }],
      NOW
    );
    expect(p.completedActivities).toEqual(['trivia-1', 'Trivias']);
    expect(p.activityScores).toEqual({ 'trivia-1': 80 });
  });

  it('no muta el progreso de entrada', () => {
    const input = base({ completedActivities: ['X'], activityScores: { X: 1 } });
    recordActivityProgress(input, [{ key: 'Y', score: 5, complete: true }], NOW);
    expect(input).toEqual(base({ completedActivities: ['X'], activityScores: { X: 1 } }));
  });

  it('conserva la referencia de completedActivities si no cambió', () => {
    const input = base({ completedActivities: ['A'] });
    expect(recordActivityProgress(input, [{ key: 'A', complete: true }], NOW).completedActivities).toBe(input.completedActivities);
  });

  it('conserva el resto de los campos (lessonProgress, storyProgress...)', () => {
    const input = base({ lessonProgress: { P: { percentage: 50, completed: false } } });
    expect(recordActivityProgress(input, [{ key: 'A', score: 1 }], NOW).lessonProgress).toEqual(input.lessonProgress);
  });
});

describe('becameCompleted', () => {
  it('es true solo en la transición', () => {
    const before = base();
    const after = recordActivityProgress(before, [{ key: 'A', complete: true }], NOW);
    expect(becameCompleted(before, after, 'A')).toBe(true);
    expect(becameCompleted(after, recordActivityProgress(after, [{ key: 'A', complete: true }], NOW), 'A')).toBe(false);
  });
});

describe('countCompletedCatalog', () => {
  it('ignora las claves finas y los duplicados', () => {
    const done = ['Trivias', 'trivia-1', 'trivia-2', 'Lecciones', 'Trivias', 'BioPuzzle-Óseo'];
    expect(countCompletedCatalog(done, ['Trivias', 'Lecciones', 'BioPuzzle'])).toBe(2);
  });
});
