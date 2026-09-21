import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// UserDataManager habla con Firebase y con localStorage: se simulan los
// bordes y se prueba lo que sí es lógica nuestra (qué se guarda y qué se le
// manda al docente).
const authMock = vi.hoisted(() => ({ currentUser: null as null | { uid: string; isAnonymous: boolean } }));
const syncStudentProgress = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const getServerScore = vi.hoisted(() => vi.fn<() => number | null>(() => null));

vi.mock('@/lib/firebaseAuth', () => ({ auth: authMock }));
vi.mock('@/lib/userDataSync', () => ({
  default: { syncCompleteData: vi.fn().mockResolvedValue(undefined), getServerScore },
}));
vi.mock('@/lib/classroomService', () => ({ default: { syncStudentProgress } }));

import UserDataManager from './userDataManager';
import { ACTIVITIES } from './activities';
import { countCompletedCatalog, recordActivityProgress } from './activityProgress';

function stubBrowser() {
  const store = new Map<string, string>();
  vi.stubGlobal('window', {});
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  stubBrowser();
  syncStudentProgress.mockClear();
  getServerScore.mockReturnValue(null);
  authMock.currentUser = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('guardado local', () => {
  it('lo que se anota con recordActivityProgress sobrevive a guardar y volver a cargar', () => {
    const data = UserDataManager.getDefaultUserData();
    data.progress = recordActivityProgress(data.progress, [
      { key: 'Trivias', score: 300, complete: true },
      { key: 'trivia-abc', score: 300, complete: true },
    ]);
    UserDataManager.saveUserData(data);

    const loaded = UserDataManager.loadUserData();
    expect(loaded.progress.completedActivities).toEqual(['Trivias', 'trivia-abc']);
    expect(loaded.progress.activityScores).toEqual({ Trivias: 300, 'trivia-abc': 300 });
  });
});

describe('resumen que recibe el docente', () => {
  const saveInClass = (mutate: (d: ReturnType<typeof UserDataManager.getDefaultUserData>) => void) => {
    authMock.currentUser = { uid: 'alumno-1', isAnonymous: true }; // anónimo: no dispara la sync de users
    const data = UserDataManager.getDefaultUserData();
    data.profile.classroomId = 'clase-1';
    mutate(data);
    UserDataManager.saveUserData(data);
    vi.advanceTimersByTime(1000);
  };

  it('manda solo títulos del catálogo, sin claves finas ni duplicados', () => {
    saveInClass((d) => {
      d.progress.completedActivities = ['Trivias', 'trivia-abc', 'Lecciones', 'Trivias', 'BioPuzzle-Óseo'];
    });

    expect(syncStudentProgress).toHaveBeenCalledTimes(1);
    const [classroomId, uid, progress] = syncStudentProgress.mock.calls[0];
    expect([classroomId, uid]).toEqual(['clase-1', 'alumno-1']);
    expect(progress.completedActivities).toEqual(['Trivias', 'Lecciones']);
  });

  it('el conteo del docente nunca supera el catálogo', () => {
    saveInClass((d) => {
      d.progress.completedActivities = [...ACTIVITIES.map((a) => a.title), ...Array.from({ length: 30 }, (_, i) => `trivia-${i}`)];
    });
    const progress = syncStudentProgress.mock.calls[0][2];
    expect(progress.completedActivities).toHaveLength(ACTIVITIES.length);
  });

  it('incluye las veces que se hizo cada lección, solo las que se hicieron', () => {
    saveInClass((d) => {
      d.progress.lessonProgress = {
        Pubertad: { percentage: 80, completed: true, timesCompleted: 3 },
        Sexualidad: { percentage: 10, completed: false },
      };
    });
    expect(syncStudentProgress.mock.calls[0][2].lessonTimes).toEqual({ Pubertad: 3 });
  });

  it('no declara puntaje si el servidor todavía no confirmó ninguno', () => {
    saveInClass((d) => { d.game.totalScore = 9999; });
    expect(syncStudentProgress.mock.calls[0][2].totalScore).toBeUndefined();
  });

  it('nunca declara más que lo validado por el servidor', () => {
    getServerScore.mockReturnValue(400);
    saveInClass((d) => { d.game.totalScore = 9999; });
    expect(syncStudentProgress.mock.calls[0][2].totalScore).toBe(400);
  });

  it('no manda de más si el puntaje local es menor al validado', () => {
    getServerScore.mockReturnValue(400);
    saveInClass((d) => { d.game.totalScore = 150; });
    expect(syncStudentProgress.mock.calls[0][2].totalScore).toBe(150);
  });

  it('un alumno sin clase no dispara ninguna sincronización', () => {
    authMock.currentUser = { uid: 'x', isAnonymous: true };
    UserDataManager.saveUserData(UserDataManager.getDefaultUserData());
    vi.advanceTimersByTime(1000);
    expect(syncStudentProgress).not.toHaveBeenCalled();
  });
});

describe('contador de actividades completadas', () => {
  it('con el catálogo real no pasa de 100% aunque haya claves finas', () => {
    const completed = [...ACTIVITIES.map((a) => a.title), 'trivia-1', 'trivia-2', 'Lecciones-Pubertad'];
    expect(countCompletedCatalog(completed, ACTIVITIES.map((a) => a.title))).toBe(ACTIVITIES.length);
  });
});

// 2026-09-18 es viernes; 09-21 lunes; 09-22 martes; 09-23 miércoles.
const at = (iso: string) => vi.setSystemTime(new Date(`${iso}T12:00:00`));

describe('racha diaria', () => {
  it('sumar puntos cuenta el día, pero abrir la pantalla (mismo puntaje) no', () => {
    at('2026-09-21');
    UserDataManager.updateGameScore(0);
    expect(UserDataManager.getStreakView(UserDataManager.loadUserData()).current).toBe(0);

    UserDataManager.updateGameScore(100);
    const view = UserDataManager.getStreakView(UserDataManager.loadUserData());
    expect(view.current).toBe(1);
    expect(view.playedToday).toBe(true);
  });

  it('varias jugadas el mismo día no suman más de un día', () => {
    at('2026-09-21');
    UserDataManager.updateGameScore(100);
    UserDataManager.updateGameScore(300);
    UserDataManager.registerPlayDay();
    expect(UserDataManager.loadUserData().game.streak).toBe(1);
  });

  it('sube día tras día y game.streak queda igual a la racha (lo que lee el docente)', () => {
    at('2026-09-21');
    UserDataManager.registerPlayDay();
    at('2026-09-22');
    UserDataManager.registerPlayDay();
    const data = UserDataManager.loadUserData();
    expect(data.progress.activityStreak).toEqual({ current: 2, best: 2, lastDay: '2026-09-22' });
    expect(data.game.streak).toBe(2);
  });

  it('el fin de semana no la corta, pero un día hábil sin jugar sí', () => {
    at('2026-09-18'); // viernes
    UserDataManager.registerPlayDay();
    at('2026-09-21'); // lunes
    UserDataManager.registerPlayDay();
    expect(UserDataManager.loadUserData().game.streak).toBe(2);

    at('2026-09-23'); // miércoles, faltó el martes
    UserDataManager.registerPlayDay();
    const data = UserDataManager.loadUserData();
    expect(data.game.streak).toBe(1);
    expect(data.progress.activityStreak?.best).toBe(2);
  });

  it('al docente le llega la racha de HOY, no una guardada de hace días', () => {
    authMock.currentUser = { uid: 'alumno-1', isAnonymous: true };
    at('2026-09-21');
    const data = UserDataManager.getDefaultUserData();
    data.profile.classroomId = 'clase-1';
    data.progress.activityStreak = { current: 5, best: 5, lastDay: '2026-09-21' };
    data.game.streak = 5;
    UserDataManager.saveUserData(data);
    vi.advanceTimersByTime(1000);
    expect(syncStudentProgress.mock.calls.at(-1)![2].streak).toBe(5);

    at('2026-09-25'); // jueves: faltaron el martes y el miércoles
    UserDataManager.saveUserData(data);
    vi.advanceTimersByTime(1000);
    expect(syncStudentProgress.mock.calls.at(-1)![2].streak).toBe(0);
  });

  it('registrar el ánimo ya no pisa la racha diaria ni la cuenta como "días de ánimo"', () => {
    at('2026-09-21');
    UserDataManager.registerPlayDay();
    const entry = { date: new Date().toISOString(), mood: 8, label: 'Feliz', intensity: 5 };
    UserDataManager.updateMoodEntry(entry);
    UserDataManager.updateMoodStreakAndRewards();
    expect(UserDataManager.loadUserData().game.streak).toBe(1);

    const history = UserDataManager.loadUserData().mood.history;
    expect(UserDataManager.getMoodStreak(history)).toBe(1);
  });

  it('resetear el progreso reinicia la racha', () => {
    at('2026-09-21');
    UserDataManager.registerPlayDay();
    UserDataManager.resetGameData();
    const data = UserDataManager.loadUserData();
    expect(data.game.streak).toBe(0);
    expect(data.progress.activityStreak).toBeUndefined();
  });
});

describe('reto del día', () => {
  const candidates = ['trivias', 'pasapalabras', 'condon'];

  it('se fija una vez por día y no cambia aunque la lista sí', () => {
    at('2026-09-21');
    const first = UserDataManager.ensureDailyChallenge(candidates).view!;
    expect(candidates).toContain(first.activityId);
    expect(first.done).toBe(false);

    const again = UserDataManager.ensureDailyChallenge(['datamuncher', 'impostor']).view!;
    expect(again.activityId).toBe(first.activityId);
  });

  it('completar OTRA actividad no lo cumple; completar la del reto sí, una sola vez', () => {
    at('2026-09-21');
    const { view } = UserDataManager.ensureDailyChallenge(candidates);
    const other = ACTIVITIES.find((a) => a.id !== view!.activityId && candidates.includes(a.id))!;
    expect(UserDataManager.completeDailyChallenge(other.title)).toBe(false);

    const target = ACTIVITIES.find((a) => a.id === view!.activityId)!;
    expect(UserDataManager.completeDailyChallenge(target.title)).toBe(true);
    expect(UserDataManager.completeDailyChallenge(target.title)).toBe(false);
    const data = UserDataManager.loadUserData();
    expect(data.progress.dailyChallenge?.done).toBe(true);
    expect(data.progress.challengesCompleted).toBe(1);
  });

  it('sin haber visto el reto de hoy, no se marca nada', () => {
    at('2026-09-21');
    expect(UserDataManager.completeDailyChallenge('Trivias')).toBe(false);
    expect(UserDataManager.loadUserData().progress.challengesCompleted).toBeUndefined();
  });

  it('al día siguiente hay un reto nuevo, sin cumplir, y los retos cumplidos se conservan', () => {
    at('2026-09-21');
    const { view } = UserDataManager.ensureDailyChallenge(candidates);
    UserDataManager.completeDailyChallenge(ACTIVITIES.find((a) => a.id === view!.activityId)!.title);

    at('2026-09-22');
    const next = UserDataManager.ensureDailyChallenge(candidates);
    expect(next.view!.done).toBe(false);
    expect(next.data.progress.challengesCompleted).toBe(1);
  });
});
