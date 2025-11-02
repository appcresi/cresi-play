import UserDataSync from '@/lib/userDataSync';
import { auth } from '@/lib/firebase';

interface MoodRecord {
  date: string;
  mood: number;
  label: string;
  intensity: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  date?: string;
}

interface UserData {
  profile: {
    character: { id: number; name: string; image: string };
    username: string;
    createdAt: string;
    lastLogin: string;
  };
  game: { totalScore: number; totalLives: number; streak: number };
  progress: {
    completedActivities: string[];
    activityScores: { [key: string]: number };
    activityTimes: { [key: string]: string };
    lastVisits: { [key: string]: string };
  };
  mood: { history: MoodRecord[]; lastEntry: MoodRecord | null };
  achievements: Achievement[];
  settings: { notifications: boolean; theme: 'light' | 'dark'; language: 'es' | 'en' };
  dashboard: { visibleActivities: string[]; activityOrder: string[] };
}

const DEFAULT_FEATURES = [
  "trivias", "pasapalabras", "simulador", "completa", "datamuncher",
  "moodtracker", "meme", "literatura", "biopuzzle", "condon", "lecciones", "saludmental", "vocacion"
];

class UserDataManager {
  private static readonly STORAGE_KEY = 'cresi_user_data';

  public static getDefaultUserData(): UserData {
    return {
      profile: {
        character: { id: 0, name: '', image: '' },
        username: 'Estudiante',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
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
      
      // Sincronizar con Firestore si el usuario NO es anónimo
      const currentUser = auth.currentUser;
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
    } catch (error) {
      console.error('❌ Error saving user data:', error);
    }
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

  /**
   * Actualizar visibilidad de actividades en el dashboard
   * Sincroniza tanto en localStorage como en Firestore (si el usuario está registrado)
   */
  static updateDashboardVisibility(visibleActivities: string[]): UserData {
    const userData = this.loadUserData();
    if (!userData.dashboard) {
      userData.dashboard = {
        visibleActivities: DEFAULT_FEATURES,
        activityOrder: DEFAULT_FEATURES
      };
    }
    userData.dashboard.visibleActivities = visibleActivities;
    console.log('✅ Actualizando visibilidad de actividades');
    console.log(`   Actividades visibles: ${visibleActivities.length}/${DEFAULT_FEATURES.length}`);
    this.saveUserData(userData);
    
    // Sincronizar solo el dashboard si el usuario está registrado
    this.syncDashboardIfAuthenticated(userData);
    
    return userData;
  }

  /**
   * Actualizar orden de actividades en el dashboard
   * Sincroniza tanto en localStorage como en Firestore (si el usuario está registrado)
   */
  static updateActivityOrder(activityOrder: string[]): UserData {
    const userData = this.loadUserData();
    if (!userData.dashboard) {
      userData.dashboard = {
        visibleActivities: DEFAULT_FEATURES,
        activityOrder: DEFAULT_FEATURES
      };
    }
    userData.dashboard.activityOrder = activityOrder;
    console.log('✅ Actualizando orden de actividades');
    this.saveUserData(userData);
    
    // Sincronizar solo el dashboard si el usuario está registrado
    this.syncDashboardIfAuthenticated(userData);
    
    return userData;
  }

  /**
   * Resetear dashboard a su estado por defecto
   * Sincroniza tanto en localStorage como en Firestore (si el usuario está registrado)
   */
  static resetDashboard(): UserData {
    const userData = this.loadUserData();
    userData.dashboard = {
      visibleActivities: DEFAULT_FEATURES,
      activityOrder: DEFAULT_FEATURES
    };
    console.log('✅ Reseteando dashboard');
    this.saveUserData(userData);
    
    // Sincronizar solo el dashboard si el usuario está registrado
    this.syncDashboardIfAuthenticated(userData);
    
    return userData;
  }

  /**
   * Sincronizar configuración del dashboard con Firestore si el usuario está registrado
   * @private
   */
  private static syncDashboardIfAuthenticated(userData: UserData): void {
    const currentUser = auth.currentUser;
    if (currentUser && !currentUser.isAnonymous) {
      console.log('📤 Iniciando sincronización de dashboard con Firestore...');
      setTimeout(() => {
        UserDataSync.syncDashboardConfig(userData.dashboard)
          .then(() => {
            console.log('✅ Configuración del dashboard sincronizada exitosamente');
          })
          .catch(err => {
            console.error('❌ Error sincronizando dashboard:', err);
          });
      }, 100);
    }
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