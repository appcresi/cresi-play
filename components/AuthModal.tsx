'use client';

import React, { useState } from 'react';
import { IconMail, IconBrandGoogle, IconArrowRight, IconLoader, IconPlayerPlay } from '@tabler/icons-react';
import { signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import UserDataSync from '@/lib/userDataSync';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Character {
  id: number;
  name: string;
  image: string;
}

const characters: Character[] = [
  { id: 1, name: "Aventurero", image: "personaje1.webp" },
  { id: 2, name: "Exploradora", image: "personaje2.webp" },
  { id: 3, name: "Valiente", image: "personaje3.webp" }
];

const DEFAULT_FEATURES_IDS = [
  "trivias", "pasapalabras", "simulador", "completa", "datamuncher",
  "moodtracker", "meme", "literatura", "biopuzzle", "condon", "lecciones", "saludmental", "vocacion", "amor", "impostor"
];

type AuthMode = 'profile-setup' | 'login' | 'register';

interface UserDataType {
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

const googleProvider = new GoogleAuthProvider();

const AuthModal = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('profile-setup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return null;
  }

  const initializeUserData = (uid: string, mail: string | null = null) => {
    const userData: UserDataType = {
      profile: {
        character: selectedCharacter!,
        username: username,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      },
      game: { totalScore: 0, totalLives: 3, streak: 0 },
      progress: {
        completedActivities: [],
        activityScores: {},
        activityTimes: {},
        lastVisits: {}
      },
      mood: { history: [], lastEntry: null },
      achievements: [],
      settings: { notifications: true, theme: 'light', language: 'es' },
      dashboard: {
        visibleActivities: DEFAULT_FEATURES_IDS,
        activityOrder: DEFAULT_FEATURES_IDS
      }
    };
    localStorage.setItem('cresi_user_data', JSON.stringify(userData));
  };

  const handleAnonymousLogin = async (redirectTo: string = '/') => {
    if (!username.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    if (!selectedCharacter) {
      setError('Por favor selecciona un personaje');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('🔐 Iniciando sesión anónima...');
      const result = await signInAnonymously(auth);
      
      console.log('✅ Sesión anónima iniciada:', result.user.uid);
      initializeUserData(result.user.uid);
      
      const profileData = {
        uid: result.user.uid,
        username: username,
        character: selectedCharacter,
        isAnonymous: true,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('cresi_profile', JSON.stringify(profileData));
      console.log('✅ Perfil guardado en localStorage');
      
      router.push(redirectTo);
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError('Error al iniciar sesión como invitado');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayButtonClick = () => {
    handleAnonymousLogin('/jugarazar');
  };

  const handleGoogleSignIn = async () => {
    if (!username.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    if (!selectedCharacter) {
      setError('Por favor selecciona un personaje');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('🔐 Iniciando sesión con Google...');
      const result = await signInWithPopup(auth, googleProvider);
      
      console.log('✅ Usuario Google autenticado:', result.user.uid);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔄 Cargando datos existentes de Firestore...');
      const existingData = await UserDataSync.loadFromFirestore();
      
      if (existingData && existingData.profile && existingData.profile.username) {
        console.log('✅ Datos encontrados en Firestore');
        
        const usernameChanged = existingData.profile.username !== username;
        const avatarChanged = existingData.profile.character.id !== selectedCharacter.id;
        
        if (usernameChanged || avatarChanged) {
          console.log('📝 Detectados cambios en perfil');
          console.log('   Nombre cambió:', usernameChanged);
          console.log('   Avatar cambió:', avatarChanged);
          
          existingData.profile.username = username;
          existingData.profile.character = selectedCharacter;
          existingData.profile.lastLogin = new Date().toISOString();
        }

        // Asegurar que el dashboard esté inicializado correctamente
        if (!existingData.dashboard || existingData.dashboard.visibleActivities.length === 0) {
          console.log('⚠️ Dashboard vacío, inicializando con todas las actividades');
          existingData.dashboard = {
            visibleActivities: DEFAULT_FEATURES_IDS,
            activityOrder: DEFAULT_FEATURES_IDS
          };
        }
        
        localStorage.setItem('cresi_user_data', JSON.stringify(existingData));
        localStorage.setItem('cresi_profile', JSON.stringify({
          uid: result.user.uid,
          username: existingData.profile.username,
          character: existingData.profile.character,
          email: result.user.email,
          isAnonymous: false,
          createdAt: existingData.profile.createdAt
        }));
        
        if (usernameChanged || avatarChanged) {
          console.log('📤 Sincronizando cambios a Firestore...');
          await UserDataSync.syncCompleteData(existingData);
          console.log('✅ Cambios sincronizados');
        }
        
        console.log('✅ Datos RECUPERADOS y actualizados de Firestore');
      } else {
        console.log('📝 No hay datos previos, creando nuevos...');
        initializeUserData(result.user.uid, result.user.email);
        const profileData = {
          uid: result.user.uid,
          username: username,
          character: selectedCharacter,
          email: result.user.email,
          isAnonymous: false,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('cresi_profile', JSON.stringify(profileData));
        console.log('✅ Datos nuevos creados');
      }
    } catch (err: any) {
      console.error('❌ Error:', err);
      setError('Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!username.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    if (!selectedCharacter) {
      setError('Por favor selecciona un personaje');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('🔐 Registrando nueva cuenta...');
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      console.log('✅ Usuario registrado:', result.user.uid);
      initializeUserData(result.user.uid, result.user.email);
      
      const profileData = {
        uid: result.user.uid,
        username: username,
        character: selectedCharacter,
        email: result.user.email,
        isAnonymous: false,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('cresi_profile', JSON.stringify(profileData));
      console.log('✅ Registro completado');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email inválido');
      } else {
        setError('Error al registrarse');
      }
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!username.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }
    if (!selectedCharacter) {
      setError('Por favor selecciona un personaje');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('🔐 Iniciando sesión con email...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      console.log('✅ Usuario autenticado:', result.user.uid);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔄 Cargando datos existentes de Firestore...');
      const existingData = await UserDataSync.loadFromFirestore();
      
      if (existingData && existingData.profile && existingData.profile.username) {
        console.log('✅ Datos encontrados en Firestore');
        
        const usernameChanged = existingData.profile.username !== username;
        const avatarChanged = existingData.profile.character.id !== selectedCharacter.id;
        
        if (usernameChanged || avatarChanged) {
          console.log('📝 Detectados cambios en perfil');
          console.log('   Nombre cambió:', usernameChanged);
          console.log('   Avatar cambió:', avatarChanged);
          
          existingData.profile.username = username;
          existingData.profile.character = selectedCharacter;
          existingData.profile.lastLogin = new Date().toISOString();
        }

        // Asegurar que el dashboard esté inicializado correctamente
        if (!existingData.dashboard || existingData.dashboard.visibleActivities.length === 0) {
          console.log('⚠️ Dashboard vacío, inicializando con todas las actividades');
          existingData.dashboard = {
            visibleActivities: DEFAULT_FEATURES_IDS,
            activityOrder: DEFAULT_FEATURES_IDS
          };
        }
        
        localStorage.setItem('cresi_user_data', JSON.stringify(existingData));
        localStorage.setItem('cresi_profile', JSON.stringify({
          uid: result.user.uid,
          username: existingData.profile.username,
          character: existingData.profile.character,
          email: result.user.email,
          isAnonymous: false,
          createdAt: existingData.profile.createdAt
        }));
        
        if (usernameChanged || avatarChanged) {
          console.log('📤 Sincronizando cambios a Firestore...');
          await UserDataSync.syncCompleteData(existingData);
          console.log('✅ Cambios sincronizados');
        }
        
        console.log('✅ Datos RECUPERADOS y actualizados de Firestore');
      } else {
        console.log('📝 No hay datos previos, creando nuevos...');
        initializeUserData(result.user.uid, result.user.email);
        const profileData = {
          uid: result.user.uid,
          username: username,
          character: selectedCharacter,
          email: result.user.email,
          isAnonymous: false,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem('cresi_profile', JSON.stringify(profileData));
        console.log('✅ Datos nuevos creados');
      }
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setError('Usuario no encontrado');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta');
      } else {
        setError('Error al iniciar sesión');
      }
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Modal de Autenticación */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-200 my-auto">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-center mb-3">
              <img src="/logocresi.svg" alt="CrESI Logo" className="w-20 h-20" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-1">
              ¡Te damos la bienvenida!
            </h2>
            <p className="text-gray-600 text-center text-xs">
              Personaliza tu perfil y elige cómo continuar
            </p>
          </div>

          <div className="p-6 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Tu nombre
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors
                         bg-white text-gray-800 placeholder-gray-400 text-sm"
                placeholder="Escribe tu nombre"
                disabled={loading}
              />
            </div>

            {/* Character Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Elige tu avatar
              </label>
              <div className="grid grid-cols-3 gap-2">
                {characters.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => { setSelectedCharacter(character); setError(''); }}
                    disabled={loading}
                    className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${selectedCharacter?.id === character.id
                        ? 'bg-blue-50 ring-2 ring-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="w-full aspect-square rounded-lg bg-white mb-1 flex items-center justify-center overflow-hidden shadow-sm border border-gray-200">
                      <img
                        src={character.image}
                        alt={character.name}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        width={48}
                        height={48}
                      />
                    </div>
                    <p className="text-center text-xs font-medium text-gray-700 leading-tight">
                      {character.name}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-xs">{error}</p>
              </div>
            )}

            {/* Profile Setup Mode */}
            {mode === 'profile-setup' && (
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleAnonymousLogin('/')}
                  disabled={loading}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 
                           transition-colors font-medium text-xs flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100"
                >
                  {loading ? <IconLoader className="w-4 h-4 animate-spin" /> : <IconArrowRight className="w-4 h-4" />}
                  Entrar sin registrarse
                </button>

                <button
                  onClick={() => { setMode('register'); setError(''); }}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 
                           transition-colors font-medium text-xs flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                >
                  <IconMail className="w-4 h-4" />
                  Crear cuenta
                </button>

                <button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 
                           transition-colors font-medium text-xs flex items-center justify-center gap-2
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                >
                  {loading ? <IconLoader className="w-4 h-4 animate-spin" /> : <IconBrandGoogle className="w-4 h-4" />}
                  Continuar con Google
                </button>
              </div>
            )}

            {/* Login Screen */}
            {mode === 'login' && (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                               focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-sm
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                               focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-sm
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  onClick={handleEmailSignIn}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 
                           transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <IconLoader className="w-4 h-4 animate-spin" /> : 'Ingresar'}
                </button>

                <button
                  onClick={() => { setMode('profile-setup'); setError(''); setEmail(''); setPassword(''); }}
                  disabled={loading}
                  className="w-full text-blue-600 hover:text-blue-700 py-2 font-medium text-xs
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volver
                </button>
              </>
            )}

            {/* Register Screen */}
            {mode === 'register' && (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                               focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-sm
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                               focus:ring-2 focus:ring-blue-500 bg-white text-gray-800 text-sm
                               disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <button
                  onClick={handleEmailSignUp}
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-2 px-3 rounded-lg hover:bg-indigo-700 
                           transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <IconLoader className="w-4 h-4 animate-spin" /> : 'Registrarse'}
                </button>

                <button
                  onClick={() => { setMode('profile-setup'); setError(''); setEmail(''); setPassword(''); }}
                  disabled={loading}
                  className="w-full text-blue-600 hover:text-blue-700 py-2 font-medium text-xs
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Volver
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center leading-tight">
              Tu configuración se guardará automáticamente.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Play Button */}
      <button
        onClick={handlePlayButtonClick}
        disabled={loading}
        className="fixed bottom-24 right-8 z-[60] w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 
                 text-white shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300
                 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed
                 hover:from-indigo-600 hover:to-indigo-800"
      >
        {loading ? (
          <IconLoader className="w-9 h-9 animate-spin" />
        ) : (
          <IconPlayerPlay className="w-9 h-9 fill-current" />
        )}
      </button>
    </>
  );
};

export default AuthModal;