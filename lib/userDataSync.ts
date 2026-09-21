import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from './firebaseAuth';
import { db } from './firebaseFirestore';
import type { UserData, DashboardConfig, UserRole } from '@/types/user';

export type { UserData, UserRole };

let lastPushed: { uid: string, score: number } | null = null;
let serverScore: { uid: string, score: number } | null = null;

class UserDataSync {
  /**
   * Último puntaje que el servidor aceptó para el usuario actual (null si
   * todavía no hubo sync). Es el techo de lo que las reglas dejan copiar al
   * resumen de progreso de la clase.
   */
  static getServerScore(): number | null {
    const uid = auth.currentUser?.uid;
    return uid && serverScore?.uid === uid ? serverScore.score : null;
  }

  /**
   * El puntaje total NO se escribe directo a Firestore (las reglas lo
   * prohíben): se manda a /api/sync-score, que acota cuánto puede subir.
   * Si el servidor recorta el valor, no se toca el puntaje local — cada
   * sync siguiente vuelve a intentar con más margen acumulado.
   */
  private static async pushScoreToServer(score: number): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.isAnonymous) return;
    if (lastPushed?.uid === currentUser.uid && lastPushed.score === score) return;

    try {
      const send = async (forceRefresh: boolean) => fetch('/api/sync-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await currentUser.getIdToken(forceRefresh)}`
        },
        body: JSON.stringify({ score: Math.max(0, Math.round(score)) })
      });

      let res = await send(false);
      // Token rechazado: se pide uno nuevo a Firebase y se reintenta una vez.
      if (res.status === 401) res = await send(true);

      if (res.status === 404) return; // el documento aún no existe; se reintenta tras crearlo
      if (!res.ok) {
        // El servidor dice en qué paso falló y con qué código (sin datos internos).
        const detail = await res.json().catch(() => ({})) as { error?: string; step?: string; code?: string };
        console.error('❌ /api/sync-score respondió', res.status, detail.error ?? '', detail.step ?? '', detail.code ?? '');
        return;
      }

      const data = await res.json() as { score: number, clamped: boolean };
      serverScore = { uid: currentUser.uid, score: data.score };
      if (data.clamped) {
        console.warn('⚠️ El servidor recortó el puntaje; se reintentará en el próximo guardado.');
      } else {
        lastPushed = { uid: currentUser.uid, score };
      }
    } catch (error) {
      console.error('❌ Error enviando puntaje al servidor:', error);
    }
  }

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

      // Datos completos a guardar. `game.totalScore` va aparte, por
      // /api/sync-score; acá solo vidas y racha (por campo, para no pisar
      // el mapa `game` entero).
      const dataToSave = {
        uid: currentUser.uid,
        email: currentUser.email,
        profile: userData.profile,
        'game.totalLives': userData.game.totalLives,
        'game.streak': userData.game.streak,
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
        // El puntaje va primero: si el documento es viejo y no tiene
        // game.totalScore, el servidor lo crea y recién ahí las reglas
        // aceptan el update de vidas/racha.
        await this.pushScoreToServer(userData.game.totalScore);
        await updateDoc(userDocRef, dataToSave);
      } else {
        // Crear nuevo documento: el puntaje arranca en 0 (lo exigen las
        // reglas) y se sube enseguida por el servidor.
        const { 'game.totalLives': totalLives, 'game.streak': streak, ...rest } = dataToSave;
        await setDoc(userDocRef, {
          ...rest,
          game: { totalScore: 0, totalLives, streak },
          createdAt: new Date().toISOString()
        });
        await this.pushScoreToServer(userData.game.totalScore);
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

      // Puntaje primero (ver syncCompleteData).
      await this.pushScoreToServer(score);
      await updateDoc(userDocRef, {
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
                totalScore: 0,
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
            await this.pushScoreToServer(score);
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