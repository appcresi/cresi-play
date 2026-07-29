'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import type { UserData, UserRole } from '@/types/user';

// Únicas claves de localStorage relacionadas a sesión en toda la app.
// Si el día de mañana cambian, se tocan acá y en ningún otro lado.
const PROFILE_STORAGE_KEY = 'cresi_user_data';
const LEGACY_PROFILE_KEY = 'cresi_profile';

interface AuthContextType {
  /** Usuario de Firebase Auth (puede ser anónimo). */
  user: User | null;
  /** true mientras Firebase todavía no resolvió el estado de auth. */
  loading: boolean;
  isAuthenticated: boolean;
  /**
   * Perfil "rápido" leído de localStorage (username, avatar, role, classroomId...).
   * Se inicializa de forma SINCRÓNICA al montar, así componentes que necesitan
   * saber el rol para decidir qué renderizar (ComicHome, TeacherDashboard) no
   * tienen que esperar un tick — eso es lo que evita el "flash" de contenido
   * equivocado. Para el alumno registrado, esto puede no reflejar todavía los
   * últimos datos sincronizados desde Firestore; para eso está el merge propio
   * que hace Features.tsx al cargar.
   */
  profile: UserData | null;
  role: UserRole | null;
  /** Fuerza una relectura de `profile` desde localStorage. Normalmente no hace
   * falta llamarlo a mano: el contexto ya escucha los eventos que indican que
   * la sesión cambió. */
  refreshProfile: () => void;
  /** Cierra sesión, limpia todo el localStorage de sesión y notifica a quien escuche. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readProfileFromStorage(): UserData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch (e) {
    console.error('❌ Error al parsear el perfil de localStorage:', e);
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [profile, setProfile] = useState<UserData | null>(() => readProfileFromStorage());

  const refreshProfile = useCallback(() => {
    setProfile(readProfileFromStorage());
  }, []);

  useEffect(() => {
    console.log('🔐 Inicializando listener de autenticación...');
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log('✅ Usuario autenticado:', currentUser.uid);
      } else {
        console.log('⏸️ No hay usuario autenticado');
      }

      setUser(currentUser);
      setFirebaseLoading(false);
      // Releemos el perfil cada vez que cambia el usuario de Firebase
      // (cubre login/logout dentro de la misma pestaña).
      refreshProfile();
    });

    // Cambios hechos desde OTRAS pestañas.
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PROFILE_STORAGE_KEY || e.key === LEGACY_PROFILE_KEY) {
        refreshProfile();
      }
    };

    // Cambios hechos en la MISMA pestaña: el evento nativo 'storage' no
    // dispara ahí, por eso todo lo que guarda sesión (AuthModal) dispara
    // este evento custom apenas escribe en localStorage.
    const handleSessionUpdated = () => refreshProfile();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('cresi-session-updated', handleSessionUpdated);

    return () => {
      console.log('🧹 Limpiando listener de autenticación');
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cresi-session-updated', handleSessionUpdated);
    };
  }, [refreshProfile]);

  // Firebase confirma la sesión (`user`) casi al instante, pero el perfil
  // local (con el `role`) recién se escribe después — sobre todo en los
  // logins con Google/email, que esperan ~1s y consultan Firestore antes de
  // guardar nada. En esa ventana, `user` ya existe pero `profile` todavía
  // no, y cualquier pantalla que decidiera qué mostrar mirando solo `user`
  // terminaba mostrando el contenido de alumno un instante antes de que el
  // rol de docente terminara de resolverse.
  //
  // Por eso `loading` sigue en `true` mientras haya un `user` sin `profile`
  // todavía — con un tope de 2.5s para no colgar la UI si por lo que sea
  // nunca aparece un perfil (por ejemplo, localStorage borrado a mano).
  const [waitingForProfile, setWaitingForProfile] = useState(false);

  useEffect(() => {
    if (firebaseLoading || !user || profile) {
      setWaitingForProfile(false);
      return;
    }
    setWaitingForProfile(true);
    const timeout = setTimeout(() => setWaitingForProfile(false), 2500);
    return () => clearTimeout(timeout);
  }, [firebaseLoading, user, profile]);

  const loading = firebaseLoading || waitingForProfile;

  const logout = useCallback(async () => {
    await signOut(auth);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
    setProfile(null);
    window.dispatchEvent(new Event('cresi-session-updated'));
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    profile,
    role: profile?.profile?.role ?? null,
    refreshProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      '❌ useAuth() debe usarse dentro de un <AuthProvider>. ' +
      'Asegúrate de envolver tu aplicación con AuthProvider en el layout o componente padre.'
    );
  }

  return context;
};

export default AuthContext;