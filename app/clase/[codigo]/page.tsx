"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import ClassroomService from '@/lib/classroomService';
import UserDataSync from '@/lib/userDataSync';
import { IconLoader, IconKey, IconArrowLeft, IconEye, IconEyeOff } from '@tabler/icons-react';
import type { Character, UserData } from '@/types/user';
import { ACTIVITY_IDS as DEFAULT_FEATURES_IDS } from '@/lib/activities';

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
        };
        localStorage.setItem('cresi_user_data', JSON.stringify(userData));
      }

      // Crea/actualiza su registro dentro de la clase (lo que ve el
      // docente en "Personas"), sin pisar el progreso si ya jugó antes.
      await ClassroomService.upsertClassroomStudent(classroomId, result.user.uid, username, selectedCharacter);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-200 p-6">
        <div className="flex items-center justify-center mb-3">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center">
            <IconKey className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-xl font-bold text-gray-800 text-center mb-1">Unite a tu clase</h1>
        <p className="text-gray-600 text-center text-xs mb-6">
          Ingresá el usuario y la contraseña que te dio tu docente. Podés usar
          esto las veces que necesites para volver a entrar.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Código de la clase</label>
            <input
              type="text"
              value={classCode}
              onChange={(e) => { setClassCode(e.target.value.toUpperCase()); setError(''); }}
              disabled={loading}
              maxLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none
                       focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-sm tracking-widest
                       text-center font-bold uppercase disabled:opacity-50"
              placeholder="EJ: A3F9K2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Usuario</label>
            <input
              type="text"
              value={manualUsername}
              onChange={(e) => { setManualUsername(e.target.value); setError(''); }}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none
                       focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-sm"
              placeholder="El usuario que te dio tu docente"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={manualPassword}
                onChange={(e) => { setManualPassword(e.target.value); setError(''); }}
                disabled={loading}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none
                         focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-sm"
                placeholder="La contraseña que te dio tu docente"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Elegí tu avatar</label>
            <div className="grid grid-cols-3 gap-2">
              {characters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => { setSelectedCharacter(character); setError(''); }}
                  disabled={loading}
                  className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${selectedCharacter?.id === character.id ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-50 hover:bg-gray-100'}
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="w-full aspect-square rounded-lg bg-white mb-1 flex items-center justify-center overflow-hidden shadow-sm border border-gray-200">
                    <img src={character.image} alt={character.name} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-center text-xs font-medium text-gray-700 leading-tight">{character.name}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-xs">{error}</p>
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700
                     transition-colors font-medium text-sm flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <IconLoader className="w-4 h-4 animate-spin" /> : 'Unirme a la clase'}
          </button>

          <Link href="/" className="flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <IconArrowLeft className="w-3.5 h-3.5" /> Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}