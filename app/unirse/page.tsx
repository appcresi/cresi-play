"use client"
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fredoka } from 'next/font/google';
import {
  IconBrandGoogle,
  IconArrowRight,
  IconLoader,
  IconArrowLeft,
} from '@tabler/icons-react';
import {
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import UserDataSync from '@/lib/userDataSync';
import type { Character, UserData } from '@/types/user';
import { ACTIVITY_IDS as DEFAULT_FEATURES_IDS } from '@/lib/activities';

// Misma display face que la landing, usada con la misma restricción
// (solo el título grande).
const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });

const characters: Character[] = [
  { id: 1, name: 'Aventurero', image: '/personaje1.webp' },
  { id: 2, name: 'Exploradora', image: '/personaje2.webp' },
  { id: 3, name: 'Valiente', image: '/personaje3.webp' },
];

const googleProvider = new GoogleAuthProvider();

export default function UnirseSinCodigoPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<'anon' | 'google' | null>(null);

  const buildUserData = (usernameValue: string, character: Character): UserData => ({
    profile: {
      character,
      username: usernameValue,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      role: 'student',
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

  const finishLogin = () => {
    // ¿Venía de una partida jugada sin cuenta (ej. desde el botón flotante
    // de la landing) que quiso guardar su progreso? Sumamos ese puntaje a
    // la cuenta recién creada/logueada y volvemos justo a donde estaba,
    // en vez de mandarlo al escritorio general.
    try {
      const pendingRaw = sessionStorage.getItem('cresi_pending_score');
      const returnTo = sessionStorage.getItem('cresi_pending_return_to');

      if (pendingRaw) {
        const pending = JSON.parse(pendingRaw);
        const stored = localStorage.getItem('cresi_user_data');

        if (stored && typeof pending.score === 'number' && pending.score > 0) {
          const data = JSON.parse(stored);
          data.game.totalScore = (data.game.totalScore || 0) + pending.score;
          localStorage.setItem('cresi_user_data', JSON.stringify(data));
        }

        sessionStorage.removeItem('cresi_pending_score');
        sessionStorage.removeItem('cresi_pending_return_to');
        window.dispatchEvent(new Event('cresi-session-updated'));
        router.push(returnTo || '/escritorio');
        return;
      }
    } catch (err) {
      console.error('❌ Error aplicando el puntaje pendiente:', err);
    }

    window.dispatchEvent(new Event('cresi-session-updated'));
    router.push('/escritorio');
  };

  const validateBasics = () => {
    if (!username.trim()) {
      setError('Por favor ingresa tu nombre');
      return false;
    }
    if (!selectedCharacter) {
      setError('Por favor selecciona un personaje');
      return false;
    }
    return true;
  };

  const handleAnonymousLogin = async () => {
    if (!validateBasics()) return;
    try {
      setLoading('anon');
      setError('');
      await signInAnonymously(auth);
      const userData = buildUserData(username, selectedCharacter!);
      localStorage.setItem('cresi_user_data', JSON.stringify(userData));
      finishLogin();
    } catch (err) {
      console.error('❌ Error:', err);
      setError('Error al iniciar sesión como invitado');
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!validateBasics()) return;
    try {
      setLoading('google');
      setError('');
      const result = await signInWithPopup(auth, googleProvider);

      await new Promise((resolve) => setTimeout(resolve, 1000));
      const existingData = await UserDataSync.loadFromFirestore();

      if (existingData?.profile?.username) {
        const usernameChanged = existingData.profile.username !== username;
        const avatarChanged = existingData.profile.character.id !== selectedCharacter!.id;

        if (usernameChanged || avatarChanged) {
          existingData.profile.username = username;
          existingData.profile.character = selectedCharacter!;
          existingData.profile.lastLogin = new Date().toISOString();
        }
        if (!existingData.dashboard || existingData.dashboard.visibleActivities.length === 0) {
          existingData.dashboard = {
            visibleActivities: DEFAULT_FEATURES_IDS,
            activityOrder: DEFAULT_FEATURES_IDS,
          };
        }
        localStorage.setItem('cresi_user_data', JSON.stringify(existingData));
        if (usernameChanged || avatarChanged) {
          await UserDataSync.syncCompleteData(existingData);
        }
      } else {
        const userData = buildUserData(username, selectedCharacter!);
        localStorage.setItem('cresi_user_data', JSON.stringify(userData));
      }
      finishLogin();
    } catch (err) {
      console.error('❌ Error:', err);
      setError('Error al iniciar sesión con Google');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF8] to-[#FFE5E5] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-sm w-full border border-[#241B37]/8 p-6">
        <div className="flex items-center justify-center mb-4">
          <Image src="/logocresi.svg" alt="CrESI" width={64} height={64} className="w-16 h-16" />
        </div>
        <h1 className={`${fredoka.className} text-2xl text-[#241B37] text-center mb-1`}>
          ¡Te damos la bienvenida!
        </h1>
        <p className="text-[#241B37]/60 text-center text-sm mb-6">
          Personalizá tu perfil y elegí cómo continuar
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#241B37]/70 mb-1.5">Tu nombre</label>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setError(''); }}
              disabled={!!loading}
              className="w-full px-3 py-2.5 border border-[#241B37]/15 rounded-xl focus:outline-none
                       focus:ring-2 focus:ring-[#FF6B6B] bg-white text-[#241B37] placeholder-[#241B37]/30 text-sm"
              placeholder="Escribe tu nombre"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#241B37]/70 mb-2">Elegí tu avatar</label>
            <div className="grid grid-cols-3 gap-2">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => { setSelectedCharacter(character); setError(''); }}
                  disabled={!!loading}
                  className={`p-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]
                    ${selectedCharacter?.id === character.id
                      ? 'bg-[#FFE5E5] ring-2 ring-[#FF6B6B]'
                      : 'bg-cream hover:bg-[#FFE5E5]'}
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="relative w-full aspect-square rounded-lg bg-white mb-1 flex items-center justify-center overflow-hidden shadow-sm border border-[#241B37]/8">
                    <Image src={character.image} alt={character.name} fill sizes="120px" className="object-cover" />
                  </div>
                  <p className="text-center text-xs font-medium text-[#241B37]/70 leading-tight">{character.name}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-xs">{error}</p>
            </div>
          )}

          <div className="space-y-2.5 pt-1">
            <button
              onClick={handleAnonymousLogin}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-2 bg-[#FFE5E5] hover:bg-[#FFD6D6]
                       text-[#E8514F] font-bold py-3 px-4 rounded-full transition-colors text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'anon' ? <IconLoader className="w-4 h-4 animate-spin" /> : <IconArrowRight className="w-4 h-4" />}
              Entrar sin registrarse
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={!!loading}
              className="w-full flex items-center justify-center gap-2 bg-white border border-[#241B37]/15
                       hover:bg-cream text-[#241B37] font-bold py-3 px-4 rounded-full transition-colors text-sm
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'google' ? <IconLoader className="w-4 h-4 animate-spin" /> : <IconBrandGoogle className="w-4 h-4 text-[#4285F4]" />}
              Continuar con Google
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#241B37]/8 text-xs">
            <Link href="/" className="flex items-center gap-1 text-[#241B37]/40 hover:text-[#241B37]/70">
              <IconArrowLeft className="w-3.5 h-3.5" /> Inicio
            </Link>
            <Link href="/clase" className="font-semibold text-[#2FB8AC] hover:text-[#238F85]">
              ¿Tenés un código de clase?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}