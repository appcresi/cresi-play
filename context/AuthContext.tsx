
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider - Proveedor de contexto de autenticación
 * Maneja el estado global de autenticación con Firebase
 * 
 * Uso:
 * 1. Envuelve tu app con <AuthProvider>
 * 2. Usa useAuth() en cualquier componente para acceder a { user, loading, isAuthenticated }
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada en localStorage primero
    const savedProfile = localStorage.getItem('cresi_profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        console.log('✅ Sesión encontrada en localStorage para:', profile.username);
      } catch (e) {
        console.error('❌ Error al parsear sesión de localStorage:', e);
      }
    }

    // Configurar listener de Firebase para cambios de autenticación
    console.log('🔐 Inicializando listener de autenticación...');
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log('✅ Usuario autenticado:', currentUser.uid);
      } else {
        console.log('⏸️ No hay usuario autenticado');
      }
      
      setUser(currentUser);
      setLoading(false); // IMPORTANTE: Marcar como listo cuando Firebase responde
    });

    // Cleanup: desuscribirse cuando el componente se desmonta
    return () => {
      console.log('🧹 Limpiando listener de autenticación');
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user
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