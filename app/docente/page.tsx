"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { Fredoka } from 'next/font/google';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import UserDataSync from '@/lib/userDataSync';
import { useAuth } from '@/context/AuthContext';
import { IconBrandGoogle, IconLoader, IconArrowLeft } from '@tabler/icons-react';
import TeacherDashboard from '@/components/TeacherDashboard';
import type { UserData } from '@/types/user';
import { ACTIVITY_IDS as DEFAULT_FEATURES_IDS } from '@/lib/activities';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });

const googleProvider = new GoogleAuthProvider();

export default function DocentePage() {
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');

  const buildTeacherData = (username: string): UserData => ({
    profile: {
      character: { id: 0, name: '', image: '' },
      username,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      role: 'teacher',
      classroomId: null,
      className: null,
    },
    game: { totalScore: 0, totalLives: 3, streak: 0 },
    progress: { completedActivities: [], activityScores: {}, activityTimes: {}, lastVisits: {} },
    mood: { history: [], lastEntry: null },
    achievements: [],
    settings: { notifications: true, theme: 'light', language: 'es' },
    dashboard: { visibleActivities: DEFAULT_FEATURES_IDS, activityOrder: DEFAULT_FEATURES_IDS },
    notes: [],
    searchHistory: [],
  });

  const handleTeacherGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      setError('');
      const result = await signInWithPopup(auth, googleProvider);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      const existingData = await UserDataSync.loadFromFirestore();
      // El nombre de Google manda siempre en el contexto docente: si la
      // cuenta ya tenía un perfil de ALUMNO (con un nombre puesto ahí,
      // como "Estudiante" de una prueba anterior), no queremos arrastrar
      // ese nombre viejo al pasar a ser docente.
      const displayName = result.user.displayName || existingData?.profile?.username || 'Docente';

      if (existingData?.profile?.role === 'teacher') {
        // Ya tenía cuenta de docente: restauramos la sesión, refrescando
        // el nombre por si cambió en Google.
        const usernameChanged = existingData.profile.username !== displayName;
        existingData.profile.username = displayName;
        localStorage.setItem('cresi_user_data', JSON.stringify(existingData));
        if (usernameChanged) {
          await UserDataSync.syncCompleteData(existingData);
        }
      } else if (existingData?.profile) {
        // Tenía cuenta pero como alumno: la reconvertimos a docente y
        // pisamos el nombre con el de Google.
        existingData.profile.role = 'teacher';
        existingData.profile.username = displayName;
        localStorage.setItem('cresi_user_data', JSON.stringify(existingData));
        await UserDataSync.syncCompleteData(existingData);
      } else {
        // Primera vez: perfil de docente nuevo, con el nombre de Google.
        localStorage.setItem('cresi_user_data', JSON.stringify(buildTeacherData(displayName)));
      }

      window.dispatchEvent(new Event('cresi-session-updated'));
      // No hace falta redirigir: seguimos en /docente. Apenas `user`/`role`
      // se actualicen en el contexto, este mismo componente muestra el dashboard.
    } catch (err) {
      console.error('❌ Error:', err);
      setError('Error al iniciar sesión con Google');
    } finally {
      setSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B6B]" />
      </div>
    );
  }

  if (user) {
    // app/docente/layout.tsx ya garantizó que, si hay rol, es "teacher".
    return <TeacherDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF8] to-[#E6F7F5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full border border-[#241B37]/8 p-6">
        <div className="flex items-center justify-center mb-4">
          <img src="/logocresi.svg" alt="CrESI" className="w-16 h-16" />
        </div>
        <h1 className={`${fredoka.className} text-2xl text-[#241B37] text-center mb-1`}>
          Acceso para docentes
        </h1>
        <p className="text-[#241B37]/60 text-center text-xs mb-6">
          Ingresá con tu cuenta de Google. Si es tu primera vez, se crea automáticamente.
        </p>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl mb-4">
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}

        <button
          onClick={handleTeacherGoogleSignIn}
          disabled={signingIn}
          className="w-full bg-white border border-[#241B37]/15 hover:bg-gray-50 text-[#241B37] py-3 px-3
                   rounded-full transition-colors font-bold text-sm flex items-center justify-center gap-2
                   disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {signingIn ? <IconLoader className="w-4 h-4 animate-spin" /> : <IconBrandGoogle className="w-4 h-4 text-[#4285F4]" />}
          Continuar con Google
        </button>

        <Link href="/" className="flex items-center justify-center gap-1 text-xs text-[#241B37]/40 hover:text-[#241B37]/70">
          <IconArrowLeft className="w-3.5 h-3.5" /> ¿Sos alumno o alumna? Volver al inicio
        </Link>
      </div>
    </div>
  );
}