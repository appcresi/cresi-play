"use client";
import React, { useState, useEffect } from 'react';
import {
  IconArrowRight,
  IconHelp,
  IconPlayerSkipForward,
  IconMaximize,
} from '@tabler/icons-react';
import { palabras } from '../utils/words';
import toast, { Toaster } from 'react-hot-toast';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';
import FinalReport from './FinalReport';
import UserDataManager from '@/lib/userDataManager';
import { trackEvent } from '@/lib/analytics';
import { getActivityById } from '@/lib/activities';
import { useTheme } from '@/context/ThemeContext';

// Mismo color que ya tiene "Pasapalabras" en el catálogo (la tarjeta que
// ves en tu panel) — así la pantalla del juego se siente la misma cosa
// que la tarjeta que tocaste para llegar acá, no un azul sin relación.
const ACCENT = getActivityById('pasapalabras')?.color ?? '#388E3C';
const ACTIVITY_TITLE = 'Pasapalabras';

type LetterKey = keyof typeof palabras;
const letters = Object.keys(palabras) as LetterKey[];

const UnifiedWordGame = () => {
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());

  // El círculo de letras se posiciona con trigonometría (Math.cos/sin).
  // Aunque es una fórmula determinística, el servidor y el navegador
  // pueden dar un resultado con una diferencia mínima en los últimos
  // decimales por diferencias de plataforma en el cálculo de punto
  // flotante — invisible a simple vista, pero suficiente para que React
  // marque un mismatch de hidratación (compara el string exacto). La
  // solución estándar es no renderizar ese cálculo durante el server
  // render, solo después de montar en el cliente.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Game state
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [currentWord, setCurrentWord] = useState<{ palabra: string; definicion: string } | null>(null);
  const [guessedLetters, setGuessedLetters] = useState<Set<string>>(new Set());
  const [passedLetters, setPassedLetters] = useState<Set<string>>(new Set());
  const [incorrectLetters, setIncorrectLetters] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isIncorrect, setIsIncorrect] = useState(false);
  // Antes esto era un estado local propio de Pasapalabras, sin persistencia
  // y desconectado del resto de la plataforma. Ahora sale del mismo
  // ThemeContext global que usa GameStatusBar — un solo interruptor de modo
  // noche, no uno por juego.
  const { theme } = useTheme();
  const isNightMode = theme === 'dark';
  const [usedWords, setUsedWords] = useState<{ palabra: string; definicion: string }[]>([]);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [correctWords, setCorrectWords] = useState<{ palabra: string; definicion: string }[]>([]);
  const [incorrectWords, setIncorrectWords] = useState<{ palabra: string; definicion: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const maxWords = 20;
  const INITIAL_LIVES = 3;

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
  };

  const saveGameData = () => {
    const updatedData = { ...userData };
    updatedData.game.totalScore = score;
    updatedData.game.totalLives = lives;
    UserDataManager.saveUserData(updatedData);
    setUserData(updatedData);
  };

  const getNextWord = () => {
    const currentLetter = letters[currentLetterIndex];
    const wordsForLetter = palabras[currentLetter];
    const unusedWords = wordsForLetter.filter(word => !usedWords.some(uw => uw.palabra === word.palabra));

    if (unusedWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * unusedWords.length);
      setCurrentWord(unusedWords[randomIndex]);
      setUsedWords(prev => [...prev, unusedWords[randomIndex]]);
      resetTimer();
    } else {
      moveToNextLetter();
    }
  };

  const resetTimer = () => {
    setTimeLeft(30);
    setTimerActive(true);
  };

  const moveToNextLetter = () => {
    setCurrentLetterIndex((prevIndex) => (prevIndex + 1) % letters.length);
    setIsIncorrect(false);
    setProgress((prev) => prev + 1);
  };

  const handleLifeLoss = () => {
    const newLives = lives - 1;
    setLives(newLives);

    if (newLives <= 0 && score >= 200) {
      setShowPurchaseModal(true);
    } else if (newLives <= 0) {
      handleGameEnd();
    }
  };

  const handlePurchaseLife = () => {
    // El PurchaseModal ya maneja la compra y actualiza UserData
    // Solo necesitamos recargar los datos y continuar el juego
    const updatedData = UserDataManager.loadUserData();
    setScore(updatedData.game.totalScore);
    setLives(updatedData.game.totalLives);
    setShowPurchaseModal(false);
  };

  const handleClosePurchaseModal = () => {
    // Recargar datos por si se hizo una compra
    const updatedData = UserDataManager.loadUserData();
    setScore(updatedData.game.totalScore);
    setLives(updatedData.game.totalLives);

    if (updatedData.game.totalLives < 1) {
      handleGameEnd();
    }
    setShowPurchaseModal(false);
  };

  const handleSubmit = (value: string) => {
    if (!currentWord) return;
    const cleanedInput = value.replace(/\s+/g, '').toLowerCase();

    if (cleanedInput === currentWord.palabra.toLowerCase()) {
      setGuessedLetters((prev) => new Set(prev).add(currentWord.palabra.charAt(0)));
      setScore((prev) => prev + 100);
      setCorrectWords((prev) => [...prev, currentWord]);
      toast.success('¡Correcto!');

      if (correctWords.length % 5 === 0) {
        setLevel(prev => prev + 1);
      }

      moveToNextLetter();
    } else {
      toast.error('Incorrecto. Intenta de nuevo.');
      setIncorrectLetters((prev) => new Set(prev).add(currentWord.palabra.charAt(0)));
      setIncorrectWords((prev) => [...prev, currentWord]);
      setIsIncorrect(true);
      handleLifeLoss();

      setTimeout(() => {
        moveToNextLetter();
      }, 1000);
    }

    if (progress + 1 === maxWords) {
      handleGameEnd();
    }
  };

  const handlePass = () => {
    const currentLetter = letters[currentLetterIndex];
    setPassedLetters((prev) => new Set(prev).add(currentLetter));
    moveToNextLetter();
    if (progress + 1 === maxWords) {
      handleGameEnd();
    }
  };

  const handleHelp = () => {
    if (currentWord) {
      const scrambledLetters = currentWord.palabra.split('').sort(() => Math.random() - 0.5).join('-');
      toast.success(`Pista: La palabra tiene ${currentWord.palabra.length} letras: ${scrambledLetters}`);
    }
  };

  /**
   * Antes esto solo guardaba puntos/vidas — nunca marcaba la actividad
   * como completada, así que "Pasapalabras" nunca aparecía con el check
   * verde en el panel del alumno. Ahora, además de guardar el estado del
   * juego (ya lo hace GameStatusBar en vivo mientras jugás), registramos
   * la finalización explícitamente.
   *
   * Nota: NO usamos UserDataManager.completeActivity() acá porque esa
   * función suma el puntaje al total — y el total ya viene sumándose en
   * vivo turno a turno vía GameStatusBar. Sumarlo de nuevo lo duplicaría.
   * Por eso escribimos directo los campos de progreso, sin tocar el total.
   */
  const handleGameEnd = () => {
    saveGameData();

    const data = UserDataManager.loadUserData();
    const wasAlreadyCompleted = data.progress.completedActivities.includes(ACTIVITY_TITLE);
    if (!wasAlreadyCompleted) {
      data.progress.completedActivities.push(ACTIVITY_TITLE);
    }
    data.progress.activityScores[ACTIVITY_TITLE] = correctWords.length * 100;
    data.progress.activityTimes[ACTIVITY_TITLE] = new Date().toISOString();
    UserDataManager.saveUserData(data);
    if (!wasAlreadyCompleted) {
      trackEvent('activity_completed', { activity_title: ACTIVITY_TITLE });
    }

    setShowFinalReport(true);
  };

  const resetGame = () => {
    setCurrentLetterIndex(0);
    setGuessedLetters(new Set());
    setPassedLetters(new Set());
    setIncorrectLetters(new Set());
    setProgress(0);
    setIsIncorrect(false);
    setUsedWords([]);
    setShowFinalReport(false);
    setLives(INITIAL_LIVES);
    setCorrectWords([]);
    setIncorrectWords([]);
    getNextWord();
    resetTimer();
  };

  const handlePlayAgain = () => {
    resetGame();
    setShowFinalReport(false);
  };

  const handleGoBack = () => {
    window.location.href = '/';
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error al intentar activar el modo de pantalla completa: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    getNextWord();
  }, [currentLetterIndex]);

  useEffect(() => {
    if (!timerActive) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      handlePass();
      setTimerActive(false);
    }
  }, [timerActive, timeLeft]);

  const AlphabetCircle = React.memo(() => {
    const radius = 155;
    const center = 190;

    // Mismo tamaño del contenedor real, pero sin las letras posicionadas
    // por trigonometría — evita el mismatch de hidratación mencionado
    // arriba. Apenas el componente termina de montar en el cliente
    // (una fracción de segundo), se reemplaza por el círculo real.
    if (!mounted) {
      return <div className="relative w-[380px] h-[380px]" />;
    }

    return (
      <div className="relative w-[380px] h-[380px]">
        <div>
          {letters.map((letter, index) => {
            const angle = (index / letters.length) * 2 * Math.PI - Math.PI / 2;
            const x = center + radius * Math.cos(angle) - 22;
            const y = center + radius * Math.sin(angle) - 22;

            const isGuessed = guessedLetters.has(letter);
            const isPassed = passedLetters.has(letter);
            const isIncorrectLetter = incorrectLetters.has(letter);
            const isCurrent = letter === letters[currentLetterIndex];

            let bgStyle: React.CSSProperties = { backgroundColor: '#A855F7' }; // default (sin jugar)
            if (isGuessed) bgStyle = { backgroundColor: '#22C55E' };
            else if (isPassed) bgStyle = { backgroundColor: '#9CA3AF' };
            else if (isIncorrectLetter) bgStyle = { backgroundColor: '#EF4444' };
            else if (isCurrent) bgStyle = { backgroundColor: ACCENT };

            return (
              <div
                key={letter}
                className={`absolute flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 font-bold text-lg shadow-md z-20 text-white
                  ${isCurrent ? 'scale-125 ring-4' : ''}`}
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  ...bgStyle,
                  ...(isCurrent ? { boxShadow: `0 0 0 4px ${ACCENT}40` } : {}),
                }}
              >
                {letter}
              </div>
            );
          })}
        </div>
      </div>
    );
  });

  return (
    <div className={`min-h-screen ${isNightMode ? 'bg-gray-900' : 'bg-cream'} transition-colors duration-300`}>
      <GameStatusBar
        title="Pasapalabra"
        score={score}
        lives={lives}
        level={level}
      />

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onPurchase={handlePurchaseLife}
      />

      {showFinalReport ? (
        <FinalReport
          correctWords={correctWords}
          incorrectWords={incorrectWords}
          onPlayAgain={handlePlayAgain}
          onGoBack={handleGoBack}
        />
      ) : (
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* Tarjeta de definición */}
          <div className={`mb-8 ${isNightMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden transition-colors duration-300 mx-auto max-w-4xl`}>
            <div className="h-24 relative" style={{ background: `linear-gradient(to right, ${ACCENT}, ${ACCENT}CC)` }}>
              <div className="absolute bottom-4 left-6 flex items-center gap-4">
                <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
                  <span className="text-gray-500 text-xs font-medium">Letra</span>
                  <p className="font-bold text-2xl" style={{ color: ACCENT }}>{letters[currentLetterIndex]}</p>
                </div>
                <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
                  <span className="text-gray-500 text-xs font-medium">Progreso</span>
                  <p className="font-bold text-lg" style={{ color: ACCENT }}>{progress}/{maxWords}</p>
                </div>
              </div>
            </div>
            <div className={`p-8 ${isNightMode ? 'bg-gray-800' : 'bg-white'}`}>
              {currentWord && (
                <div className="text-center">
                  <p className={`text-xl md:text-2xl font-medium ${isNightMode ? 'text-gray-200' : 'text-gray-800'} leading-relaxed`}>{currentWord.definicion}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sección del juego */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative flex justify-center items-center">
              {/* Timer Circle */}
              <div className="absolute w-[380px] h-[380px] flex justify-center items-center pointer-events-none z-10">
                <svg className="absolute inset-0 transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="transparent"
                    cx="50"
                    cy="50"
                    r="32"
                  />
                  <circle
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray="201.062"
                    strokeDashoffset={201.062 * (1 - timeLeft / 30)}
                    stroke={timeLeft > 20 ? "#10b981" : timeLeft > 10 ? "#f59e0b" : "#ef4444"}
                    fill="transparent"
                    cx="50"
                    cy="50"
                    r="32"
                    style={{
                      transition: 'stroke-dashoffset 1s linear, stroke 1s linear',
                      filter: 'drop-shadow(0 0 6px currentColor)',
                    }}
                  />
                </svg>
              </div>

              {/* Círculo de letras */}
              <AlphabetCircle />

              {/* Área de respuesta en el centro */}
              <div className="absolute inset-0 flex flex-col justify-center items-center z-30">
                {currentWord && (
                  <div className={`flex flex-col items-center gap-3 backdrop-blur-sm rounded-2xl p-4 shadow-xl border ${isNightMode ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-100'}`}>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSubmit(inputValue);
                          setInputValue('');
                        }
                      }}
                      autoFocus
                      className={`w-48 px-4 py-2 text-base border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-center font-medium shadow-sm ${isNightMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
                      style={{ borderColor: `${ACCENT}80` }}
                      placeholder="Respuesta"
                    />

                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleSubmit(inputValue);
                          setInputValue('');
                        }}
                        className="text-white p-2.5 rounded-full font-medium shadow-sm transition-all hover:opacity-90"
                        style={{ backgroundColor: ACCENT }}
                        title="Enviar respuesta"
                      >
                        <IconArrowRight size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={handleHelp}
                        className="bg-amber-500 hover:bg-amber-600 text-white p-2.5 rounded-full shadow-sm transition-all"
                        title="Obtener pista"
                      >
                        <IconHelp size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={handlePass}
                        className="bg-gray-500 hover:bg-gray-600 text-white p-2.5 rounded-full shadow-sm transition-all"
                        title="Pasar palabra"
                      >
                        <IconPlayerSkipForward size={18} />
                      </button>
                    </div>

                    <div className="flex flex-col items-center gap-1 text-center">
                      <p className="text-xs text-gray-500 font-medium">
                        Letras: <span className="font-bold text-gray-700">{inputValue.length}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-800">{timeLeft}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Toaster
            position="top-center"
            toastOptions={{
              className: isNightMode ? 'bg-gray-800 text-white' : '',
              duration: 2000,
            }}
          />
        </div>
      )}

      <button
        onClick={handleFullscreen}
        className="hidden lg:block fixed bottom-6 left-6 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 z-50 border border-gray-200 text-gray-600"
        title="Pantalla completa"
      >
        <IconMaximize size={20} />
      </button>
    </div>
  );
};

export default UnifiedWordGame;