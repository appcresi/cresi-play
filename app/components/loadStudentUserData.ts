// app/components/loadStudentUserData.ts
//
// Resuelve el UserData "definitivo" combinando localStorage y Firestore,
// con prioridad por `lastLogin` (quien tenga el más reciente gana). Como
// efecto secundario, sincroniza lo que corresponda para que local y
// Firestore queden alineados.
//
// La comparten Features.tsx (panel de juego, para alumnos sin clase o con
// todas las actividades habilitadas) y ClassroomDesk.tsx (aula virtual,
// para alumnos que entraron con código) — es la misma persona entrando por
// dos vistas distintas, no dos lógicas de datos distintas.
import type { User } from 'firebase/auth';
import UserDataManager from '@/lib/userDataManager';
import UserDataSync from '@/lib/userDataSync';
import type { UserData } from '@/types/user';
import { ACTIVITY_IDS } from '@/lib/activities';

export async function loadStudentUserData(user: User | null): Promise<UserData> {
  const localData = UserDataManager.loadUserData();
  const defaultDashboard = {
    visibleActivities: ACTIVITY_IDS,
    activityOrder: ACTIVITY_IDS,
  };

  if (user && !user.isAnonymous) {
    try {
      const firestoreData = await UserDataSync.loadFromFirestore();

      if (firestoreData) {
        const firestoreTime = new Date(firestoreData.profile?.lastLogin ?? 0).getTime();
        const localTime = new Date(localData.profile?.lastLogin ?? 0).getTime();
        const localIsNewer = localTime > firestoreTime;

        if (localIsNewer) {
          // localStorage gana en game/progress/mood/achievements; Firestore
          // gana en dashboard solo si localStorage no tiene nada propio.
          const mergedData: UserData = {
            ...firestoreData,
            ...localData,
            dashboard: (localData.dashboard?.visibleActivities?.length ?? 0) > 0
              ? localData.dashboard
              : (firestoreData.dashboard ?? defaultDashboard),
          };
          if (!mergedData.dashboard || mergedData.dashboard.visibleActivities.length === 0) {
            mergedData.dashboard = defaultDashboard;
          }
          UserDataManager.saveUserData(mergedData);
          return mergedData;
        }

        const mergedData: UserData = {
          ...localData,
          ...firestoreData,
          dashboard: firestoreData.dashboard || localData.dashboard,
        };
        if (!mergedData.dashboard || mergedData.dashboard.visibleActivities.length === 0) {
          mergedData.dashboard = defaultDashboard;
        }
        UserDataManager.saveUserData(mergedData);
        return mergedData;
      }

      if (!localData.dashboard || localData.dashboard.visibleActivities.length === 0) {
        localData.dashboard = defaultDashboard;
      }
      return localData;
    } catch (error) {
      console.error('❌ Error cargando de Firestore:', error);
      if (!localData.dashboard || localData.dashboard.visibleActivities.length === 0) {
        localData.dashboard = defaultDashboard;
      }
      return localData;
    }
  }

  // Usuario anónimo (o sin sesión): solo localStorage.
  if (!localData.dashboard || localData.dashboard.visibleActivities.length === 0) {
    localData.dashboard = defaultDashboard;
  }
  return localData;
}