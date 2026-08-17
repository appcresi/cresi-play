import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from './firebaseAuth';
import { db } from './firebaseFirestore';
import type { UserData, DashboardConfig, UserRole } from '@/types/user';

export type { UserData, UserRole };

class UserDataSync {
  /**
   * Sincronizar TODOS los datos del usuario con Firestore
   */
  static async syncCompleteData(userData: UserData): Promise<void> {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return;
      }

      if (currentUser.isAnonymous) {
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);

      // Datos completos a guardar
      const dataToSave = {
        uid: currentUser.uid,
        email: currentUser.email,
        profile: userData.profile,
        game: userData.game,
        progress: userData.progress,
        mood: userData.mood,
        achievements: userData.achievements,
        settings: userData.settings,
        dashboard: userData.dashboard || {
          visibleActivities: [],
          activityOrder: []
        },
        lastSyncedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Verificar si el documento existe
      const docSnapshot = await getDoc(userDocRef);

      if (docSnapshot.exists()) {
        // Actualizar documento existente
        await updateDoc(userDocRef, dataToSave);
      } else {
        // Crear nuevo documento
        await setDoc(userDocRef, {
          ...dataToSave,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error('❌ Error sincronizando datos completos:', error);
    }
  }

  /**
   * Sincronizar solo la configuración del dashboard (visibilidad y orden)
   */
  static async syncDashboardConfig(dashboardConfig: DashboardConfig): Promise<void> {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return;
      }

      if (currentUser.isAnonymous) {
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);

      // Intentar actualizar el documento existente
      try {
        await updateDoc(userDocRef, {
          dashboard: dashboardConfig,
          'updatedAt': new Date().toISOString(),
          'lastSyncedAt': new Date().toISOString()
        });
      } catch (error: any) {
        // Si el documento no existe, crearlo
        if (error.code === 'not-found') {
          const defaultUserData = {
            uid: currentUser.uid,
            email: currentUser.email,
            profile: {
              character: { id: 0, name: '', image: '' },
              username: 'Usuario',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              role: 'student',
              classroomId: null,
              className: null
            },
            game: {
              totalScore: 0,
              totalLives: 3,
              streak: 0
            },
            progress: {
              completedActivities: [],
              activityScores: {},
              activityTimes: {},
              lastVisits: {}
            },
            mood: { history: [], lastEntry: null },
            achievements: [],
            settings: {
              notifications: true,
              theme: 'light',
              language: 'es'
            },
            dashboard: dashboardConfig,
            createdAt: new Date().toISOString(),
            lastSyncedAt: new Date().toISOString()
          };

          await setDoc(userDocRef, defaultUserData);
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error('❌ Error sincronizando configuración del dashboard:', error);
    }
  }

  /**
   * Sincronizar solo puntuación (update ligero)
   */
  static async syncScoreOnly(score: number, lives: number): Promise<void> {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return;
      }

      if (currentUser.isAnonymous) {
        return;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);

      await updateDoc(userDocRef, {
        'game.totalScore': score,
        'game.totalLives': lives,
        'lastSyncedAt': new Date().toISOString()
      });
    } catch (error: any) {
      if (error.code === 'not-found') {
        try {
          const currentUser = auth.currentUser;
          if (currentUser && !currentUser.isAnonymous) {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const defaultUserData = {
              uid: currentUser.uid,
              email: currentUser.email,
              profile: {
                character: { id: 0, name: '', image: '' },
                username: 'Usuario',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                role: 'student',
                classroomId: null,
                className: null
              },
              game: {
                totalScore: score,
                totalLives: lives,
                streak: 0
              },
              progress: {
                completedActivities: [],
                activityScores: {},
                activityTimes: {},
                lastVisits: {}
              },
              mood: { history: [], lastEntry: null },
              achievements: [],
              settings: {
                notifications: true,
                theme: 'light',
                language: 'es'
              },
              dashboard: {
                visibleActivities: [],
                activityOrder: []
              },
              createdAt: new Date().toISOString(),
              lastSyncedAt: new Date().toISOString()
            };

            await setDoc(userDocRef, defaultUserData);
          }
        } catch (createError) {
          console.error('❌ Error creando documento:', createError);
        }
      } else {
        console.error('❌ Error sincronizando puntuación:', error);
      }
    }
  }

  /**
   * Cargar datos del usuario desde Firestore
   */
  static async loadFromFirestore(): Promise<UserData | null> {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        return null;
      }

      if (currentUser.isAnonymous) {
        return null;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnapshot = await getDoc(userDocRef);

      if (docSnapshot.exists()) {
        return docSnapshot.data() as UserData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error cargando datos desde Firestore:', error);
      return null;
    }
  }

  /**
   * Cargar solo la configuración del dashboard desde Firestore
   */
  static async loadDashboardConfigFromFirestore(): Promise<DashboardConfig | null> {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser || currentUser.isAnonymous) {
        return null;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnapshot = await getDoc(userDocRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        return data.dashboard ?? null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('❌ Error cargando dashboard desde Firestore:', error);
      return null;
    }
  }
}

export default UserDataSync;