"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { Fredoka } from 'next/font/google';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import UserDataSync from '@/lib/userDataSync';
import { useAuth } from '@/context/AuthContext';
import {
  IconBrandGoogle,
  IconLoader,
  IconArrowLeft,
  IconUsers,
  IconListCheck,
  IconChartBar,
  IconKey,
} from '@tabler/icons-react';
import TeacherDashboard from '@/components/TeacherDashboard';
import type { UserData } from '@/types/user';
import { ACTIVITY_IDS as DEFAULT_FEATURES_IDS } from '@/lib/activities';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });

const googleProvider = new GoogleAuthProvider();

const FEATURES = [
  {
    icon: <IconKey className="w-4 h-4" />,
    title: 'Clase con código propio',
    text: 'Creá tu clase y compartí un código para que tus alumnos se sumen, con o sin cuenta.',
  },
  {
    icon: <IconListCheck className="w-4 h-4" />,
    title: 'Contenido a tu medida',
    text: 'Elegís qué trivias y actividades de ESI ve cada clase — nada que no quieras mostrar todavía.',
  },
  {
    icon: <IconChartBar className="w-4 h-4" />,
    title: 'Progreso en vivo',
    text: 'Seguí cómo le va a cada alumno y alumna, actividad por actividad.',
  },
  {
    icon: <IconUsers className="w-4 h-4" />,
    title: 'Sin fricción para el aula',
    text: 'Tus alumnos entran con su usuario, sin necesidad de crear una cuenta de correo propia.',
  },
];

export default function DocentePage() {
  const { user } = useAuth();
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

  // app/docente/layout.tsx (vía TeacherAreaShell) ya garantizó que, si hay
  // rol, es "teacher". Mientras `user` no esté confirmado (incluido durante
  // la carga inicial y para cualquier visita sin sesión, como la de un
  // buscador) mostramos esta landing pública en vez de una pantalla vacía o
  // un spinner — así el contenido real queda disponible para indexar.
  if (user) {
    return <TeacherDashboard />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-10 sm:py-16 grid lg:grid-cols-2 gap-12 items-center">
        {/* Columna izquierda: propuesta de valor */}
        <div>
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-ink/40 hover:text-ink/70 mb-6">
            <IconArrowLeft className="w-3.5 h-3.5" /> Volver al inicio
          </Link>

          <div className="inline-flex items-center gap-1.5 bg-mint text-mint-text text-xs font-bold px-3 py-1.5 rounded-full mb-5">
            Para docentes
          </div>

          <h1 className={`${fredoka.className} text-3xl sm:text-4xl leading-[1.1] text-ink mb-4`}>
            Tu aula virtual de Educación Sexual Integral
          </h1>

          <p className="text-base sm:text-lg text-ink/70 leading-relaxed mb-8 max-w-md">
            Armá tu clase, elegí qué actividades y trivias de ESI ven tus alumnos, y seguí
            su progreso en tiempo real. Gratis, sin instalar nada.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-mint text-mint-text flex items-center justify-center shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <p className="font-bold text-sm text-ink leading-tight">{feature.title}</p>
                  <p className="text-xs text-ink/60 leading-relaxed mt-0.5">{feature.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha: acceso */}
        <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full mx-auto border border-ink/8 p-6">
          <div className="flex items-center justify-center mb-4">
            <img src="/logocresi.svg" alt="CrESI" className="w-16 h-16" />
          </div>
          <h2 className={`${fredoka.className} text-2xl text-ink text-center mb-1`}>
            Acceso para docentes
          </h2>
          <p className="text-ink/60 text-center text-xs mb-6">
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
            className="w-full bg-white border border-ink/15 hover:bg-cream text-ink py-3 px-3
                     rounded-full transition-colors font-bold text-sm flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {signingIn ? <IconLoader className="w-4 h-4 animate-spin" /> : <IconBrandGoogle className="w-4 h-4 text-[#4285F4]" />}
            Continuar con Google
          </button>

          <Link href="/" className="flex items-center justify-center gap-1 text-xs text-ink/40 hover:text-ink/70">
            <IconArrowLeft className="w-3.5 h-3.5" /> ¿Sos alumno o alumna? Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
