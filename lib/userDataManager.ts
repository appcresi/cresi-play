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
        lastVisits: {}
      },
      mood: { history: [], lastEntry: null },
      achievements: [],
      settings: { notifications: true, theme: 'light', language: 'es' },
      dashboard: {
        visibleActivities: DEFAULT_FEATURES,
        activityOrder: DEFAULT_FEATURES
      }
    };
  }

  static loadUserData(): UserData {
    try {
      if (typeof window === 'undefined') return this.getDefaultUserData();
      const storedData = localStorage.getItem(this.STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData) as UserData;
        parsedData.profile.lastLogin = new Date().toISOString();
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
    this.saveUserData(userData);
    return userData;
  }

  static addAchievement(achievement: Achievement): UserData {
    const userData = this.loadUserData();
    if (!userData.achievements.find(a => a.id === achievement.id)) {
      userData.achievements.push(achievement);
    }
    this.saveUserData(userData);
    return userData;
  }

  static updateSettings(settings: Partial<UserData['settings']>): UserData {
    const userData = this.loadUserData();
    userData.settings = { ...userData.settings, ...settings };
    this.saveUserData(userData);
    return userData;
  }
}

export default UserDataManager;