"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Fredoka } from 'next/font/google';
import { IconTrophy, IconHeart, IconHeartFilled, IconStarFilled, IconClock, IconCheckbox, IconUser, IconTarget } from '@tabler/icons-react';
import UserDataSync from '@/lib/userDataSync';
import UserDataManager from '@/lib/userDataManager';
import { auth } from '@/lib/firebaseAuth';
import type { UserData } from '@/types/user';

// Misma tipografía "con personalidad" que la home/onboarding, restringida
// acá al título — el resto de la franja sigue en Mona Sans.
const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });

interface GameStatusProps {
  title?: string;
  score?: number;
  lives?: number;
  level?: number;
  timeLeft?: number;
  currentQuestion?: number;
  totalQuestions?: number;
  showProfile?: boolean;
  activityName?: string;
}

const GameStatusBar = ({
  title = "CrESI Educativo",
  score = 0,
  lives = 3,
  level = 1,
  timeLeft,
  currentQuestion,
  totalQuestions,
  showProfile = true,
  activityName
}: GameStatusProps) => {
  const router = useRouter();
  const [isScoreAnimating, setIsScoreAnimating] = useState(false);
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Verificar estado de autenticación - más rápido
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setIsAuthenticated(true);
        setIsAnonymous(currentUser.isAnonymous);
        console.log('✅ Auth verificado:', currentUser.isAnonymous ? 'Anónimo' : 'Autenticado');
      } else {
        setIsAuthenticated(false);
        setIsAnonymous(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    // Registrar visita a la actividad cuando se monta el componente.
    // Solo si hay una sesión real (aunque sea anónima) — si no, esto
    // creaba un perfil "fantasma" en localStorage para alguien que nunca
    // se logueó, con nombre 'Estudiante' por default.
    if (activityName && isAuthenticated) {
      UserDataManager.visitActivity(activityName);
    }
  }, [activityName, isAuthenticated]);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
  };

  // Sincronizar cambios de puntuación - CON DEBOUNCE
  useEffect(() => {
    if (score !== userData.game.totalScore) {
      if (isAuthenticated) {
        // Hay sesión real: esto sí corresponde persistir en localStorage
        // (y a Firestore si no es anónima).
        const updatedData = UserDataManager.updateGameScore(score, activityName);
        setUserData(updatedData);

        if (!isAnonymous) {
          // No esperar a que termine, ejecutar en background
          UserDataSync.syncCompleteData(updatedData).catch(err =>
            console.error('Error sincronizando en background:', err)
          );
        }
      } else {
        // Sin ninguna sesión (ej. alguien jugando desde el botón flotante
        // de "Jugar" sin loguearse): el puntaje se ve en pantalla igual,
        // pero no se persiste — así no se crea un usuario fantasma.
        setUserData((prev) => ({
          ...prev,
          game: { ...prev.game, totalScore: score },
        }));
      }

      setIsScoreAnimating(true);
      const timer = setTimeout(() => setIsScoreAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [score, activityName, isAuthenticated, isAnonymous, userData.game.totalScore]);

  // Sincronizar cambios de vidas - CON DEBOUNCE
  useEffect(() => {
    if (lives !== userData.game.totalLives) {
      if (isAuthenticated) {
        const updatedData = UserDataManager.updateLives(lives);
        setUserData(updatedData);

        if (!isAnonymous) {
          UserDataSync.syncCompleteData(updatedData).catch(err =>
            console.error('Error sincronizando en background:', err)
          );
        }
      } else {
        setUserData((prev) => ({
          ...prev,
          game: { ...prev.game, totalLives: lives },
        }));
      }
    }
  }, [lives, isAuthenticated, isAnonymous, userData.game.totalLives]);

  const handleProfileClick = () => {
    router.push('/');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-cream shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Profile & Title */}
          <div className="flex items-center space-x-4">
            {showProfile && userData.profile.character.image && (
              <button
                onClick={handleProfileClick}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
                title="Volver al inicio"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-pink-light hover:border-coral transition-colors">
                  <img
                    src={`/${userData.profile.character.image.replace(/^\/+/, '')}`}
                    alt={userData.profile.character.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/logocresi.svg';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-ink">{userData.profile.username}</p>
                  <p className="text-xs text-ink/60">{userData.profile.character.name}</p>
                </div>
              </button>
            )}

            <div className="border-l border-pink-light pl-4">
              <h1 className={`${fredoka.className} text-lg text-ink flex items-center gap-2`}>
                <IconTrophy size={20} className="text-gold-accent" />
                {title}
              </h1>
              {activityName && (
                <p className="text-xs text-ink/60">{activityName}</p>
              )}
            </div>
          </div>

          {/* Right Section - Stats */}
          <div className="flex items-center space-x-3">
            {/* Questions Progress */}
            {typeof currentQuestion === 'number' && totalQuestions && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-mint rounded-full">
                <IconCheckbox size={16} className="text-mint-text" />
                <div className="text-sm">
                  <span className="font-medium text-ink">{currentQuestion}</span>
                  <span className="text-ink/50">/{totalQuestions}</span>
                </div>
              </div>
            )}

            {/* Timer */}
            {typeof timeLeft === 'number' && (
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full ${
                timeLeft <= 10
                  ? 'bg-coral text-white'
                  : 'bg-mint text-mint-text'
              }`}>
                <IconClock size={16} className={timeLeft <= 10 ? 'text-white' : 'text-mint-text'} />
                <div className={`text-sm font-medium ${timeLeft <= 10 ? 'animate-pulse' : ''}`}>
                  {timeLeft}s
                </div>
              </div>
            )}

            {/* Score */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-gold-light rounded-full">
              <IconTrophy size={16} className="text-gold-accent" />
              <div className="text-sm">
                <span className="text-xs text-ink/50 hidden sm:inline">Puntos: </span>
                <span className={`font-medium text-ink ${
                  isScoreAnimating ? 'text-gold-accent font-bold animate-pulse' : ''
                }`}>
                  {userData.game.totalScore.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Streak */}
            <div className="hidden md:flex items-center space-x-2 px-3 py-2 bg-pink-light rounded-full">
              <IconTarget size={16} className="text-coral-dark" />
              <div className="text-sm">
                <span className="text-xs text-ink/50">Racha: </span>
                <span className="font-medium text-ink">{userData.game.streak}</span>
              </div>
            </div>

            {/* Lives */}
            <div className="flex items-center space-x-2 px-3 py-2 bg-pink-light rounded-full">
              <div className="flex items-center space-x-1">
                {/* Mobile: Show number */}
                <div className="sm:hidden flex items-center space-x-1">
                  <IconHeart size={16} className="text-coral-dark" />
                  <span className="text-sm font-medium text-ink">{userData.game.totalLives}</span>
                </div>

                {/* Desktop: Show hearts */}
                <div className="hidden sm:flex space-x-1">
                  {[...Array(3)].map((_, i) =>
                    i < userData.game.totalLives ? (
                      <IconHeartFilled
                        key={i}
                        size={16}
                        className="text-coral transition-all duration-200 hover:scale-110"
                      />
                    ) : (
                      <IconHeart
                        key={i}
                        size={16}
                        className="text-ink/20 transition-all duration-200"
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Level Badge */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-mint rounded-full">
              <IconStarFilled size={16} className="text-mint-accent" />
              <div className="text-sm">
                <span className="text-xs text-ink/50">Nivel: </span>
                <span className="font-medium text-ink">{level}</span>
              </div>
            </div>

            {/* Auth Status Indicator */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-white border border-pink-light rounded-full">
              <div className={`w-2 h-2 rounded-full ${
                isAnonymous ? 'bg-ink/30' : 'bg-mint-accent'
              }`}></div>
              <span className="text-xs text-ink/60">
                {isAnonymous ? 'Invitado' : 'Registrado'}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Progress Bar for Questions */}
        {typeof currentQuestion === 'number' && totalQuestions && (
          <div className="sm:hidden mt-3 flex items-center space-x-3">
            <div className="flex-1 bg-pink-light rounded-full h-2">
              <div
                className="bg-coral h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-xs text-ink/60 font-medium">
              {currentQuestion}/{totalQuestions}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameStatusBar;