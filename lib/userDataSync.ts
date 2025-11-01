import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

interface DashboardConfig {
  visibleActivities: string[];
  activityOrder: string[];
}

interface UserData {
  profile: {
    character: {
      id: number;
      name: string;
      image: string;
    };
    username: string;
    createdAt: string;
    lastLogin: string;
  };
  game: {
    totalScore: number;
    totalLives: number;
    streak: number;
  };
  progress: {
    completedActivities: string[];
    activityScores: { [key: string]: number };
    activityTimes: { [key: string]: string };
    lastVisits: { [key: string]: string };
  };
  mood: {
    history: any[];
    lastEntry: any | null;
  };
  achievements: any[];
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'es' | 'en';
  };
  dashboard?: {
    visibleActivities: string[];
    activityOrder: string[];
  };
}

class UserDataSync {
  /**
   * Sincronizar TODOS los datos del usuario con Firestore
   */
  static async syncCompleteData(userData: UserData): Promise<void> {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('❌ No hay usuario autenticado');
        return;
      }

      if (currentUser.isAnonymous) {
        console.log('⚠️ Usuario anónimo - no se sincroniza con Firestore');
        return;
      }

      console.log(`📤 Sincronizando TODOS los datos para usuario: ${currentUser.uid}`);

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
        console.log('✅ Datos COMPLETOS sincronizados (actualizado)');
        console.log('   Dashboard guardado:', userData.dashboard);
      } else {
        // Crear nuevo documento
        await setDoc(userDocRef, {
          ...dataToSave,
          createdAt: new Date().toISOString()
        });
        console.log('✅ Datos COMPLETOS sincronizados (creado nuevo)');
        console.log('   Dashboard guardado:', userData.dashboard);
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
        console.log('❌ No hay usuario autenticado');
        return;
      }

      if (currentUser.isAnonymous) {
        console.log('⚠️ Usuario anónimo - no se sincroniza con Firestore');
        return;
      }

      console.log(`📤 Sincronizando configuración del dashboard para usuario: ${currentUser.uid}`);
      console.log('   Actividades visibles:', dashboardConfig.visibleActivities.length);
      console.log('   Orden personalizado:', dashboardConfig.activityOrder.length);

      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Intentar actualizar el documento existente
      try {
        await updateDoc(userDocRef, {
          dashboard: dashboardConfig,
          'updatedAt': new Date().toISOString(),
          'lastSyncedAt': new Date().toISOString()
        });
        console.log('✅ Configuración del dashboard sincronizada correctamente');
      } catch (error: any) {
        // Si el documento no existe, crearlo
        if (error.code === 'not-found') {
          console.log('⚠️ Documento no existe, creando uno nuevo...');
          const defaultUserData = {
            uid: currentUser.uid,
            email: currentUser.email,
            profile: {
              character: { id: 0, name: '', image: '' },
              username: 'Usuario',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
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
          console.log('✅ Documento creado con configuración del dashboard');
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
        console.log('❌ No hay usuario autenticado');
        return;
      }

      if (currentUser.isAnonymous) {
        console.log('⚠️ Usuario anónimo - no se sincroniza con Firestore');
        return;
      }

      console.log(`📤 Sincronizando puntuación para usuario: ${currentUser.uid}`);
      console.log(`   Puntos: ${score}, Vidas: ${lives}`);

      const userDocRef = doc(db, 'users', currentUser.uid);
      
      await updateDoc(userDocRef, {
        'game.totalScore': score,
        'game.totalLives': lives,
        'lastSyncedAt': new Date().toISOString()
      });

      console.log('✅ Puntuación sincronizada correctamente');
    } catch (error: any) {
      if (error.code === 'not-found') {
        console.log('⚠️ Documento no existe, creando uno nuevo...');
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
                lastLogin: new Date().toISOString()
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
            console.log('✅ Documento creado y puntuación sincronizada');
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
      
      console.log('🔍 Intentando cargar datos de Firestore...');
      console.log('   Usuario actual:', currentUser?.uid);
      console.log('   ¿Es anónimo?:', currentUser?.isAnonymous);

      if (!currentUser) {
        console.log('❌ No hay usuario autenticado');
        return null;
      }

      if (currentUser.isAnonymous) {
        console.log('⚠️ Usuario es anónimo - solo se usa localStorage');
        return null;
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      
      console.log('📚 Buscando documento en: users/' + currentUser.uid);
      const docSnapshot = await getDoc(userDocRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data() as UserData;
        console.log('✅ Datos encontrados en Firestore');
        console.log('   Puntos:', data.game.totalScore);
        console.log('   Usuario:', data.profile.username);
        console.log('   Actividades completadas:', data.progress.completedActivities.length);
        console.log('   Dashboard configurado:', data.dashboard?.visibleActivities.length || 0, 'actividades visibles');
        return data;
      } else {
        console.log('⚠️ No existe documento en Firestore para este usuario');
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
        console.log('⚠️ Usuario no autenticado o es anónimo');
        return null;
      }

      console.log('🔍 Cargando configuración del dashboard desde Firestore...');
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnapshot = await getDoc(userDocRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data.dashboard) {
          console.log('✅ Configuración del dashboard encontrada');
          console.log('   Actividades visibles:', data.dashboard.visibleActivities.length);
          return data.dashboard;
        } else {
          console.log('⚠️ No hay configuración de dashboard en Firestore');
          return null;
        }
      } else {
        console.log('⚠️ No existe documento en Firestore');
        return null;
      }
    } catch (error) {
      console.error('❌ Error cargando dashboard desde Firestore:', error);
      return null;
    }
  }
}

export default UserDataSync;