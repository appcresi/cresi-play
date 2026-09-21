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
