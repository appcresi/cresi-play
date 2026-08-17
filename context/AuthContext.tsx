'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseAuth';
import type { UserData, UserRole } from '@/types/user';


const PROFILE_STORAGE_KEY = 'cresi_user_data';
const LEGACY_PROFILE_KEY = 'cresi_profile';

interface AuthContextType {
 
  user: User | null;
 
  loading: boolean;
  isAuthenticated: boolean;
  
  profile: UserData | null;
  role: UserRole | null;
 
  refreshProfile: () => void;
  
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
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
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
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cresi-session-updated', handleSessionUpdated);
    };
  }, [refreshProfile]);


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