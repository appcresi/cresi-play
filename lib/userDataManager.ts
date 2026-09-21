import UserDataSync from '@/lib/userDataSync';
import ClassroomService from '@/lib/classroomService';
import { recordActivityProgress } from '@/lib/activityProgress';
import { auth } from '@/lib/firebaseAuth';
import { trackEvent } from '@/lib/analytics';
import { advanceStreak, dayKey, reachedMilestone, viewStreak, type StreakAdvance, type StreakView } from '@/lib/dailyStreak';
import { viewDailyChallenge, type DailyChallengeView } from '@/lib/dailyChallenge';
import type { UserData, MoodRecord, Achievement, UserRole } from '@/types/user';
import { ACTIVITIES, ACTIVITY_IDS as DEFAULT_FEATURES } from '@/lib/activities';

export type { UserData, UserRole };

class UserDataManager {
  private static readonly STORAGE_KEY = 'cresi_user_data';
  // Timers de sincronización pendientes — permiten "debounce": si
  // `saveUserData` se llama muchas veces seguidas (típico jugando una
  // trivia, sumando puntos rápido), se cancela el envío pendiente y se
  // programa uno nuevo. Así, de 12 llamados seguidos en medio segundo,
  // solo termina saliendo UNA sincronización real a Firestore (con los
  // datos más recientes), no 12.
  private static syncTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private static classroomSyncTimeoutId: ReturnType<typeof setTimeout> | null = null;

  public static getDefaultUserData(): UserData {
    return {
      profile: {
        character: { id: 0, name: '', image: '' },
        username: 'Estudiante',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        role: 'student',
        classroomId: null,
        className: null
      },
      game: { totalScore: 0, totalLives: 3, streak: 0 },
      progress: {
        completedActivities: [],
        activityScores: {},
        activityTimes: {},
        lastVisits: {},
        lessonProgress: {},
        storyProgress: {}
      },
      mood: { history: [], lastEntry: null },
      achievements: [],
      settings: { notifications: true, theme: 'light', language: 'es' },
      dashboard: {
        visibleActivities: DEFAULT_FEATURES,
        activityOrder: DEFAULT_FEATURES
      },
      notes: [],
      searchHistory: []
    };
  }

  static loadUserData(): UserData {
    try {
      if (typeof window === 'undefined') return this.getDefaultUserData();
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData) as UserData;
        parsedData.profile.lastLogin = new Date().toISOString();
        // Compatibilidad con cuentas guardadas antes de agregar este campo.
        if (!parsedData.notes) {
          parsedData.notes = [];
        }
        this.saveUserData(parsedData);
        return parsedData;
      }
      return this.getDefaultUserData();
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      return this.getDefaultUserData();
    }
  }

  static saveUserData(userData: UserData): void {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));

      const currentUser = auth.currentUser;

      // Sincronizar con Firestore (colección `users`) si el usuario NO es anónimo
      if (currentUser && !currentUser.isAnonymous) {
        if (this.syncTimeoutId) {
          clearTimeout(this.syncTimeoutId);
        }
        this.syncTimeoutId = setTimeout(() => {
          this.syncTimeoutId = null;
          UserDataSync.syncCompleteData(userData).catch(err => {
            console.error('❌ Error sincronizando con Firestore:', err);
          });
        }, 800);
      }

      // Sincronizar el RESUMEN de progreso a la clase, si el alumno pertenece a una.
      // Esto corre para cualquier usuario (anónimo o no) siempre que tenga classroomId,
      // ya que es la única forma de que el docente vea el avance de alumnos con código.
      this.syncClassroomProgressIfApplicable(userData);
    } catch (error) {
      console.error('❌ Error saving user data:', error);
    }
  }

  /**
   * Sincroniza un resumen de progreso (puntaje, racha, actividades completadas)
   * a `classrooms/{id}/estudiantes/{uid}` cuando el alumno pertenece a una clase.
   * Deliberadamente NO incluye mood ni respuestas de tests sensibles.
   * @private
   */
  private static syncClassroomProgressIfApplicable(userData: UserData): void {
    const currentUser = auth.currentUser;
    const classroomId = userData.profile.classroomId;
    if (!currentUser || !classroomId) return;

    const lastVisitDates = Object.values(userData.progress.lastVisits || {});
    const lastActive = lastVisitDates.length > 0
      ? lastVisitDates.reduce((latest, current) => (current > latest ? current : latest))
      : null;

    const catalogTitles = new Set(ACTIVITIES.map((a) => a.title));

    if (this.classroomSyncTimeoutId) {
      clearTimeout(this.classroomSyncTimeoutId);
    }
    this.classroomSyncTimeoutId = setTimeout(() => {
      this.classroomSyncTimeoutId = null;
      ClassroomService.syncStudentProgress(classroomId, currentUser.uid, {
        // Las reglas no dejan declarar más que el puntaje validado por
        // el servidor; sin sync todavía, se omite y queda el valor previo.
        totalScore: (() => {
          const accepted = UserDataSync.getServerScore();
          return accepted === null ? undefined : Math.min(userData.game.totalScore, accepted);
        })(),
        // La que corresponde HOY: una guardada de hace días ya se cortó.
        streak: viewStreak(userData.progress.activityStreak).current,
        // Solo los títulos del catálogo: el resto son claves finas (una
        // por trivia, por lección...) que inflaban el conteo del docente.
        completedActivities: Array.from(new Set(
          userData.progress.completedActivities.filter((key) => catalogTitles.has(key))
        )),
        activityScores: userData.progress.activityScores,
        lessonTimes: Object.fromEntries(
          Object.entries(userData.progress.lessonProgress ?? {})
            .filter(([, entry]) => (entry.timesCompleted ?? 0) > 0)
            .map(([title, entry]) => [title, entry.timesCompleted as number])
        ),
        lastActive,
      }).catch(err => {
        console.error('❌ Error sincronizando progreso con la clase:', err);
      });
    }, 800);
  }

  static visitActivity(activityTitle: string): UserData {
    const userData = this.loadUserData();
    if (!userData.progress.lastVisits) {
      userData.progress.lastVisits = {};
    }
    userData.progress.lastVisits[activityTitle] = new Date().toISOString();
    this.saveUserData(userData);
    return userData;
  }

  static completeActivity(activityTitle: string, score: number = 0): UserData {
    const userData = this.loadUserData();
    userData.progress = recordActivityProgress(userData.progress, [
      { key: activityTitle, score, complete: true }
    ]);
    userData.game.totalScore += score;
    const advance = this.applyPlayDay(userData);
    this.saveUserData(userData);
    this.reportStreak(advance);
    return userData;
  }

  static updateMoodEntry(moodRecord: MoodRecord): UserData {
    const userData = this.loadUserData();
    userData.mood.history.push(moodRecord);
    userData.mood.lastEntry = moodRecord;

    // Mantener solo los últimos 90 días para no acumular indefinidamente.
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    userData.mood.history = userData.mood.history.filter(
      (record) => new Date(record.date) >= ninetyDaysAgo
    );

    this.saveUserData(userData);
    return userData;
  }

  /**
   * Agrega un logro, o lo desbloquea si ya existía sin desbloquear.
   * Otorga puntos solo en el momento en que pasa a `unlocked: true`
   * (no se vuelven a dar si ya estaba desbloqueado).
   */
  static addAchievement(achievement: Achievement, points: number = 100): UserData {
    const userData = this.loadUserData();
    const existingIndex = userData.achievements.findIndex((a) => a.id === achievement.id);

    if (existingIndex >= 0) {
      if (!userData.achievements[existingIndex].unlocked && achievement.unlocked) {
        userData.achievements[existingIndex] = {
          ...achievement,
          unlocked: true,
          date: new Date().toISOString()
        };
        userData.game.totalScore += points;
      }
    } else {
      userData.achievements.push(achievement);
      if (achievement.unlocked) {
        userData.game.totalScore += points;
      }
    }

    this.saveUserData(userData);
    return userData;
  }

  /**
   * Da la recompensa por registrar el ánimo (recupera una vida si falta
   * alguna, si no, puntos). Antes esto también pisaba `game.streak` con los
   * días seguidos de registro de ánimo, pero `game.streak` es ahora la racha
   * de días con actividad (ver lib/dailyStreak.ts).
   */
  static updateMoodStreakAndRewards(): UserData {
    const userData = this.loadUserData();

    if (userData.game.totalLives < 3) {
      userData.game.totalLives += 1;
    } else {
      userData.game.totalScore += 200;
    }

    this.saveUserData(userData);
    return userData;
  }

  /**
   * Días seguidos con al menos un registro de ánimo (para la pantalla y los
   * logros del MoodTracker). No es la racha diaria del resto de la
   * plataforma (`viewStreak`), aunque antes compartían `game.streak`.
   */
  static getMoodStreak(history: ReadonlyArray<{ date: string }>): number {
    if (history.length === 0) return 0;

    let streak = 1;
    const today = new Date().setHours(0, 0, 0, 0);
    const yesterday = new Date(today - 86400000).setHours(0, 0, 0, 0);

    const lastEntry = new Date(history[history.length - 1].date).setHours(0, 0, 0, 0);

    if (lastEntry === today || lastEntry === yesterday) {
      for (let i = history.length - 2; i >= 0; i--) {
        const currentDate = new Date(history[i].date).setHours(0, 0, 0, 0);
        const prevDate = new Date(history[i + 1].date).setHours(0, 0, 0, 0);

        if (prevDate - currentDate === 86400000) {
          streak++;
        } else {
          break;
        }
      }
    } else {
      return 0;
    }

    return streak;
  }

  // ── Racha diaria y reto del día ──────────────────────────────────────

  /**
   * Anota HOY como día con actividad, sobre `userData` (sin guardar). Deja la
   * racha en `progress.activityStreak` y una copia en `game.streak`, que es
   * lo que leen el panel del docente y la sync con la clase.
   */
  private static applyPlayDay(userData: UserData): StreakAdvance {
    const advance = advanceStreak(userData.progress.activityStreak);
    if (advance.status !== 'same-day') {
      userData.progress = { ...userData.progress, activityStreak: advance.streak };
    }
    userData.game.streak = advance.streak.current;
    return advance;
  }

  /** Eventos de analítica de una racha que avanzó (no hace nada si fue el mismo día). */
  private static reportStreak(advance: StreakAdvance): void {
    if (advance.status === 'same-day') return;
    const days = advance.streak.current;
    trackEvent('streak_day', { days, status: advance.status });
    // "Regreso": volvió a jugar tras uno o más días. Es la métrica de retención.
    if (advance.daysAway !== null) trackEvent('return_visit', { days_away: advance.daysAway, kept_streak: advance.status === 'continued' });
    if (advance.status === 'continued' && reachedMilestone(days)) trackEvent('streak_milestone', { days });
  }

  /** Anota que hoy la persona jugó. Es seguro llamarlo muchas veces por día. */
  static registerPlayDay(): { data: UserData; advance: StreakAdvance } {
    const data = this.loadUserData();
    const advance = this.applyPlayDay(data);
    if (advance.status !== 'same-day') {
      this.saveUserData(data);
      this.reportStreak(advance);
    }
    return { data, advance };
  }

  /** La racha que corresponde mostrar hoy (una guardada de hace días ya no vale). */
  static getStreakView(userData: UserData): StreakView {
    return viewStreak(userData.progress.activityStreak);
  }

  /**
   * Fija el reto de HOY (una vez por día) y lo devuelve. `candidates` son las
   * actividades que la persona puede ver; si ya hay uno guardado para hoy,
   * se mantiene aunque la lista cambie.
   */
  static ensureDailyChallenge(candidates: readonly string[]): { data: UserData; view: DailyChallengeView | null } {
    const data = this.loadUserData();
    const today = dayKey();
    const view = viewDailyChallenge(candidates, today, data.progress.dailyChallenge);
    if (view && data.progress.dailyChallenge?.day !== today) {
      data.progress = { ...data.progress, dailyChallenge: { day: today, activityId: view.activityId, done: false } };
      this.saveUserData(data);
    }
    return { data, view };
  }

  /**
   * Marca el reto de hoy como cumplido si `activity` (título o id) es la
   * actividad del reto. Devuelve true solo la vez que lo cumple.
   */
  static completeDailyChallenge(activity: string): boolean {
    const data = this.loadUserData();
    const challenge = data.progress.dailyChallenge;
    if (!challenge || challenge.day !== dayKey() || challenge.done) return false;
    const finished = ACTIVITIES.find((a) => a.id === activity || a.title === activity);
    if (!finished || finished.id !== challenge.activityId) return false;

    data.progress = {
      ...data.progress,
      dailyChallenge: { ...challenge, done: true },
      challengesCompleted: (data.progress.challengesCompleted ?? 0) + 1,
    };
    this.saveUserData(data);
    trackEvent('daily_challenge_completed', { activity_id: finished.id });
    return true;
  }

  /**
   * Sincroniza el puntaje mostrado en pantalla (prop `score` de
   * GameStatusBar) con lo guardado. Si se indica `activityName`, también
   * ajusta el puntaje registrado para esa actividad puntual en la misma
   * proporción.
   */
  static updateGameScore(newScore: number, activityName?: string): UserData {
    const userData = this.loadUserData();
    const previousScore = userData.game.totalScore;
    userData.game.totalScore = newScore;

    // Sumar puntos es jugar de verdad (abrir la pantalla no cuenta).
    const advance = newScore > previousScore ? this.applyPlayDay(userData) : null;

    if (activityName) {
      // Ajusta en la misma proporción que el total (puede ser negativo:
      // compras, penalidades), por eso acumula en vez de conservar el mejor.
      userData.progress = recordActivityProgress(userData.progress, [
        { key: activityName, score: newScore - previousScore, scoreMode: 'add', touchTime: false }
      ]);
    }

    this.saveUserData(userData);
    if (advance) this.reportStreak(advance);
    return userData;
  }

  static updateLives(newLives: number): UserData {
    const userData = this.loadUserData();
    userData.game.totalLives = Math.max(0, Math.min(3, newLives));
    this.saveUserData(userData);
    return userData;
  }

  static updateSettings(settings: Partial<UserData['settings']>): UserData {
    const userData = this.loadUserData();
    userData.settings = { ...userData.settings, ...settings };
    this.saveUserData(userData);
    return userData;
  }

  /**
   * Reinicia el progreso de juego manteniendo el perfil (usuario,
   * personaje, configuración). Cubre TODOS los campos de progreso,
   * incluidos los que se fueron agregando con el tiempo (lecciones,
   * cuentos, test vocacional, notas) — antes el reset solo conocía
   * `game`, `progress`, `mood` y `achievements`, y dejaba resabios del
   * resto.
   */
  static resetGameData(): UserData {
    const userData = this.loadUserData();
    const fresh = this.getDefaultUserData();

    userData.game = fresh.game;
    userData.progress = fresh.progress;
    userData.mood = fresh.mood;
    userData.achievements = fresh.achievements;
    userData.notes = fresh.notes;

    this.saveUserData(userData);
    return userData;
  }
}

export default UserDataManager;