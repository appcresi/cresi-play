"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Fredoka } from 'next/font/google';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebaseAuth';
import ClassroomService from '@/lib/classroomService';
import UserDataSync from '@/lib/userDataSync';
import { trackEvent } from '@/lib/analytics';
import { IconLoader, IconArrowLeft, IconEye, IconEyeOff } from '@tabler/icons-react';
import type { Character, UserData } from '@/types/user';
import { ACTIVITY_IDS as DEFAULT_FEATURES_IDS } from '@/lib/activities';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });

const characters: Character[] = [
  { id: 1, name: 'Aventurero', image: '/personaje1.webp' },
  { id: 2, name: 'Exploradora', image: '/personaje2.webp' },
  { id: 3, name: 'Valiente', image: '/personaje3.webp' },
];

export default function JoinClassPage() {
  const params = useParams<{ codigo: string }>();
  const router = useRouter();
  const initialCode = (Array.isArray(params?.codigo) ? params.codigo[0] : params?.codigo)?.toUpperCase() ?? '';

  const [classCode, setClassCode] = useState(initialCode);
  const [manualUsername, setManualUsername] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Verifica las credenciales contra /api/join-class (servidor, con
   * privilegios de admin) y se autentica con un token que da SIEMPRE la
   * misma identidad para este alumno — a diferencia de la sesión anónima
   * de antes, esto se puede repetir todas las veces que haga falta: otro
   * día, otro dispositivo, después de cerrar sesión, lo que sea.
   */
  const handleJoin = async () => {
    if (!classCode.trim()) {
      setError('Por favor ingresa el código de la clase');
      return;
    }
    if (!manualUsername.trim() || !manualPassword.trim()) {
      setError('Por favor ingresa tu usuario y contraseña');
      return;
    }
    if (!selectedCharacter) {
      setError('Por favor selecciona un personaje');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/join-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: classCode,
          username: manualUsername,
          password: manualPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'CODE_NOT_FOUND') {
          setError('Código inválido. Verificalo con tu docente.');
        } else if (data.error === 'INVALID_CREDENTIALS') {
          setError('Usuario o contraseña incorrectos. Verificalo con tu docente.');
        } else {
          setError('No se pudo iniciar sesión. Probá de nuevo.');
        }
        setLoading(false);
        return;
      }

      const { token, classroomId, className, username } = data as {
        token: string;
        classroomId: string;
        className: string;
        username: string;
      };

      const result = await signInWithCustomToken(auth, token);

      // ¿Ya existía un perfil guardado de este alumno (login anterior, tal
      // vez desde otro dispositivo)? Si sí, lo recuperamos en vez de
      // pisarlo — mismo patrón que ya usábamos para Google/email.
      const existingData = await UserDataSync.loadFromFirestore();

      if (existingData?.profile?.username) {
        const characterChanged = existingData.profile.character?.id !== selectedCharacter.id;
        existingData.profile.character = selectedCharacter;
        existingData.profile.lastLogin = new Date().toISOString();
        existingData.profile.classroomId = classroomId;
        existingData.profile.className = className;
        localStorage.setItem('cresi_user_data', JSON.stringify(existingData));
        if (characterChanged) {
          await UserDataSync.syncCompleteData(existingData);
        }
      } else {
        const userData: UserData = {
          profile: {
            character: selectedCharacter,
            username,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            role: 'student',
            classroomId,
            className,
          },
          game: { totalScore: 0, totalLives: 3, streak: 0 },
          progress: { completedActivities: [], activityScores: {}, activityTimes: {}, lastVisits: {} },
          mood: { history: [], lastEntry: null },
          achievements: [],
          settings: { notifications: true, theme: 'light', language: 'es' },
          dashboard: { visibleActivities: DEFAULT_FEATURES_IDS, activityOrder: DEFAULT_FEATURES_IDS },
          notes: [],
          searchHistory: [],
        };
        localStorage.setItem('cresi_user_data', JSON.stringify(userData));
      }

      // Crea/actualiza su registro dentro de la clase (lo que ve el
      // docente en "Personas"), sin pisar el progreso si ya jugó antes.
      await ClassroomService.upsertClassroomStudent(classroomId, result.user.uid, username, selectedCharacter);

      trackEvent('join_classroom');
      window.dispatchEvent(new Event('cresi-session-updated'));
      router.push('/escritorio');
    } catch (err) {
      console.error('❌ Error:', err);
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF8] to-[#FFE5E5] dark:from-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-sm w-full border border-[#241B37]/8 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center mb-4">
          <Image src="/logocresi.svg" alt="CrESI" width={64} height={64} className="w-16 h-16" />
        </div>
        <h1 className={`${fredoka.className} text-2xl text-[#241B37] dark:text-gray-100 text-center mb-1`}>
          Unite a tu clase
        </h1>
        <p className="text-[#241B37]/60 dark:text-gray-400 text-center text-xs mb-6">
          Ingresá el usuario y la contraseña que te dio tu docente. Podés usar
          esto las veces que necesites para volver a entrar.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#241B37]/70 dark:text-gray-400 mb-1.5">Código de la clase</label>
            <input
              type="text"
              value={classCode}
              onChange={(e) => { setClassCode(e.target.value.toUpperCase()); setError(''); }}
              disabled={loading}
              maxLength={8}
              className="w-full px-3 py-2.5 border border-[#241B37]/15 dark:border-gray-600 rounded-xl focus:outline-none
                       focus:ring-2 focus:ring-[#FF6B6B] bg-white dark:bg-gray-700 text-[#241B37] dark:text-gray-100 text-sm tracking-widest
                       text-center font-bold uppercase placeholder-[#241B37]/30 dark:placeholder-gray-500 disabled:opacity-50"
              placeholder="EJ: A3F9K2"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#241B37]/70 dark:text-gray-400 mb-1.5">Usuario</label>
            <input
              type="text"
              value={manualUsername}
              onChange={(e) => { setManualUsername(e.target.value); setError(''); }}
              disabled={loading}
              className="w-full px-3 py-2.5 border border-[#241B37]/15 dark:border-gray-600 rounded-xl focus:outline-none
                       focus:ring-2 focus:ring-[#FF6B6B] bg-white dark:bg-gray-700 text-[#241B37] dark:text-gray-100 placeholder-[#241B37]/30 dark:placeholder-gray-500 text-sm"
              placeholder="El usuario que te dio tu docente"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#241B37]/70 dark:text-gray-400 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={manualPassword}
                onChange={(e) => { setManualPassword(e.target.value); setError(''); }}
                disabled={loading}
                className="w-full px-3 py-2.5 pr-10 border border-[#241B37]/15 dark:border-gray-600 rounded-xl focus:outline-none
                         focus:ring-2 focus:ring-[#FF6B6B] bg-white dark:bg-gray-700 text-[#241B37] dark:text-gray-100 placeholder-[#241B37]/30 dark:placeholder-gray-500 text-sm"
                placeholder="La contraseña que te dio tu docente"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#241B37]/40 dark:text-gray-500 hover:text-[#241B37]/70 dark:hover:text-gray-300"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#241B37]/70 dark:text-gray-400 mb-2">Elegí tu avatar</label>
            <div className="grid grid-cols-3 gap-2">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => { setSelectedCharacter(character); setError(''); }}
                  disabled={loading}
                  className={`p-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]
                    ${selectedCharacter?.id === character.id
                      ? 'bg-[#FFE5E5] dark:bg-gray-700 ring-2 ring-[#FF6B6B]'
                      : 'bg-cream dark:bg-gray-700 hover:bg-[#FFE5E5] dark:hover:bg-gray-600'}
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="relative w-full aspect-square rounded-lg bg-white mb-1 flex items-center justify-center overflow-hidden shadow-sm border border-[#241B37]/8">
                    <Image src={character.image} alt={character.name} fill sizes="120px" className="object-cover" />
                  </div>
                  <p className="text-center text-xs font-medium text-[#241B37]/70 dark:text-gray-400 leading-tight">{character.name}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-xs">{error}</p>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full bg-[#FF6B6B] hover:bg-[#E8514F] text-white py-3 px-3 rounded-full
                     transition-colors font-bold text-sm flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <IconLoader className="w-4 h-4 animate-spin" /> : 'Unirme a la clase'}
          </button>

          <Link href="/" className="flex items-center justify-center gap-1 text-xs text-[#241B37]/40 dark:text-gray-500 hover:text-[#241B37]/70 dark:hover:text-gray-300">
            <IconArrowLeft className="w-3.5 h-3.5" /> Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}