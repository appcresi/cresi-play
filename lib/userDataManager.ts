import UserDataSync from '@/lib/userDataSync';
import ClassroomService from '@/lib/classroomService';
import { auth } from '@/lib/firebase';
import type { UserData, MoodRecord, Achievement, UserRole } from '@/types/user';
import { ACTIVITY_IDS as DEFAULT_FEATURES } from '@/lib/activities';

export type { UserData, UserRole };

class UserDataManager {
  private static readonly STORAGE_KEY = 'cresi_user_data';

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
      notes: []
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
      console.log('✅ Datos guardados en localStorage');
      
      const currentUser = auth.currentUser;

      // Sincronizar con Firestore (colección `users`) si el usuario NO es anónimo
      if (currentUser && !currentUser.isAnonymous) {
        console.log('📤 Iniciando sincronización completa con Firestore...');
        console.log('   Usuario:', currentUser.uid);
        console.log('   Email:', currentUser.email);
        
        // Ejecutar en background sin esperar
        setTimeout(() => {
          UserDataSync.syncCompleteData(userData)
            .then(() => {
              console.log('✅ Datos completos sincronizados exitosamente con Firestore');
            })
            .catch(err => {
              console.error('❌ Error sincronizando con Firestore:', err);
            });
        }, 100);
      } else if (currentUser?.isAnonymous) {
        console.log('⚠️ Usuario anónimo - solo se guarda en localStorage');
      } else {
        console.log('⚠️ Usuario no autenticado - solo se guarda en localStorage');
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

    setTimeout(() => {
      ClassroomService.syncStudentProgress(classroomId, currentUser.uid, {
        totalScore: userData.game.totalScore,
        streak: userData.game.streak,
        completedActivities: userData.progress.completedActivities,
        activityScores: userData.progress.activityScores,
        lastActive,
      }).catch(err => {
        console.error('❌ Error sincronizando progreso con la clase:', err);
      });
    }, 100);
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
    if (!userData.progress.completedActivities.includes(activityTitle)) {
      userData.progress.completedActivities.push(activityTitle);
    }
    userData.progress.activityScores[activityTitle] = score;
    userData.progress.activityTimes[activityTitle] = new Date().toISOString();
    userData.game.totalScore += score;
    this.saveUserData(userData);
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
   * Calcula la racha de días consecutivos con al menos un registro de
   * humor, actualiza `game.streak`, y da una recompensa (recupera una
   * vida si falta alguna, si no, puntos).
   */
  static updateMoodStreakAndRewards(moodEntry: MoodRecord): UserData {
    const userData = this.loadUserData();
    const streak = this.calculateMoodStreak([...userData.mood.history, moodEntry]);
    userData.game.streak = streak;

    if (userData.game.totalLives < 3) {
      userData.game.totalLives += 1;
    } else {
      userData.game.totalScore += 200;
    }

    this.saveUserData(userData);
    return userData;
  }

  private static calculateMoodStreak(history: MoodRecord[]): number {
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

    if (activityName) {
      userData.progress.activityScores[activityName] =
        newScore - previousScore + (userData.progress.activityScores[activityName] || 0);
    }

    this.saveUserData(userData);
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