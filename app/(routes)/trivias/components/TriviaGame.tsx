'use client';

import {
  type TriviaAnsweredQuestion,
  type TriviaQuestion,
  type TriviaStatus,
} from '@/types/trivia';
import { useCallback, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { getSettings, getTriviaStatus, saveTriviaStatus } from '@/utils/trivia';
import { DEFAULT_TIME_IN_SECONDS } from '@/utils/constants';
import TriviaReview from './TriviaReview';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';
import { IconBrandInstagram, IconMaximize, IconMoon, IconSun, IconRefresh, IconShoppingCart } from '@tabler/icons-react';
import UserDataManager from '@/lib/userDataManager';
import { getActivityById } from '@/lib/activities';

const ACTIVITY = getActivityById('trivias');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Trivias';
const ACCENT = ACTIVITY?.color ?? '#1976D2';

// Colores por opción (estilo Kahoot) — distinguen las 4 respuestas entre
// sí, no tienen relación con la marca, así que no se tocan.
const OPTION_COLORS: { [key in 0 | 1 | 2 | 3]: string } = {
  0: 'bg-red-500 hover:bg-red-600 border-red-600',
  1: 'bg-green-500 hover:bg-green-600 border-green-600',
  2: 'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
  3: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
};

const CORRECT_ANSWER_POINTS = 100;
const INCORRECT_ANSWER_PENALTY = 50;
const INSTAGRAM_BONUS_POINTS = 500;
const INSTAGRAM_CLICKED_KEY = 'instagramClicked';

interface TriviaGameProps {
  id: string;
  name: string;
  items: Array<{ question: TriviaQuestion; options: string[] }>;
}

export default function TriviaGame({
  id,
  name,
  items,
}: TriviaGameProps): JSX.Element {
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [correctAnswer, setCorrectIndex] = useState<string | undefined>(undefined);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [hasClickedInstagram, setHasClickedInstagram] = useState<boolean>(false);
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    const instagramClicked = localStorage.getItem(INSTAGRAM_CLICKED_KEY);
    if (instagramClicked === 'true') {
      setHasClickedInstagram(true);
    }
  }, []);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    UserDataManager.visitActivity(id);
  };

  /**
   * Antes esto solo guardaba el progreso bajo `id` (el docId de ESTA
   * trivia puntual) — nunca bajo el título general del catálogo
   * ("Trivias"), así que jugar cualquier trivia nunca marcaba la
   * actividad "Trivias" como completada en el resto de la app. Ahora se
   * guardan las dos cosas: el registro fino por trivia (útil para el
   * listado) y el título general (lo que el resto de la app mira).
   */
  const saveUserData = () => {
    const current = UserDataManager.loadUserData();

    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: score,
        totalLives: lives
      },
      progress: {
        ...current.progress,
        activityScores: {
          ...current.progress.activityScores,
          [id]: Math.max(current.progress.activityScores[id] || 0, sessionScore)
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [id]: new Date().toISOString(),
          ...(isFinished ? { [ACTIVITY_TITLE]: new Date().toISOString() } : {})
        },
        completedActivities: isFinished
          ? Array.from(new Set([...current.progress.completedActivities, id, ACTIVITY_TITLE]))
          : current.progress.completedActivities
      }
    };

    UserDataManager.saveUserData(updatedData);
    setUserData(updatedData);
  };

  useEffect(() => {
    saveUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, lives, isFinished]);

  const [timeLeft, setTimeLeft] = useState<number | undefined>(
    () => getSettings()?.time ?? DEFAULT_TIME_IN_SECONDS
  );
  const [answeredQuestions, setAnsweredQuestions] = useState<TriviaAnsweredQuestion[]>([]);
  const [isNightMode, setIsNightMode] = useState<boolean>(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const settings = getSettings();

  const handleTimeLeft = useCallback(() => {
    setTimeLeft(settings?.time ?? DEFAULT_TIME_IN_SECONDS);
    setIsTimerPaused(false);
  }, [settings]);

  const handlePurchaseLife = () => {
    loadUserData();
    setShowPurchaseModal(false);
    if (isGameOver) {
      setIsGameOver(false);
      handleTimeLeft();
    }
  };

  const handleInstagramClick = () => {
    if (!hasClickedInstagram) {
      const newScore = score + INSTAGRAM_BONUS_POINTS;
      const newSessionScore = sessionScore + INSTAGRAM_BONUS_POINTS;
      setScore(newScore);
      setSessionScore(newSessionScore);

      setHasClickedInstagram(true);
      localStorage.setItem(INSTAGRAM_CLICKED_KEY, 'true');

      toast.success(`¡+${INSTAGRAM_BONUS_POINTS} puntos por seguirnos!`, {
        duration: 3000,
        icon: '🎉'
      });
    }

    window.open('https://www.instagram.com/appcresi', '_blank');
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    setTimeLeft(undefined);
    if (userData.game.totalScore >= 200) {
      setShowPurchaseModal(true);
    }
  };

  const handleContinue = useCallback(() => {
    if (isGameOver) return;
    handleTimeLeft();

    if (currentQuestion === items.length - 1) {
      setIsFinished(true);
    } else {
      setCurrentQuestion(currentQuestion + 1);
    }
  }, [currentQuestion, handleTimeLeft, items.length, isGameOver]);

  const handleTimeOut = useCallback(() => {
    if (isTimerPaused) return;

    setIsTimerPaused(true);
    toast('¡Se acabó el tiempo!', { duration: 2000, icon: '⏰' });

    setLives(prevLives => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        handleGameOver();
        return 0;
      }
      return newLives;
    });

    setAnsweredQuestions([
      ...answeredQuestions,
      {
        question: items[currentQuestion].question.question,
        answer: items[currentQuestion].question.answer,
        resume: items[currentQuestion].question.resume,
        isCorrect: false,
        userAnswer: "Sin respuesta - Tiempo agotado",
      },
    ]);

    setTimeout(() => {
      if (lives > 1) {
        handleContinue();
      }
    }, 2000);
  }, [answeredQuestions, currentQuestion, handleContinue, isTimerPaused, items, lives]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (isGameOver) return;
      setIsTimerPaused(true);
      setTimeLeft(undefined);
      setCorrectIndex(items[currentQuestion].question.answer);

      const isCorrect = answer === items[currentQuestion].question.answer;

      if (isCorrect) {
        const newScore = score + CORRECT_ANSWER_POINTS;
        const newSessionScore = sessionScore + CORRECT_ANSWER_POINTS;
        setScore(newScore);
        setSessionScore(newSessionScore);
        toast.success('¡Respuesta correcta!', { duration: 1000, icon: '✅' });
      } else {
        const penaltyToApply = Math.min(score, INCORRECT_ANSWER_PENALTY);
        const newScore = score - penaltyToApply;
        const newSessionScore = Math.max(0, sessionScore - INCORRECT_ANSWER_PENALTY);
        setScore(newScore);
        setSessionScore(newSessionScore);
        setLives(prevLives => {
          const newLives = prevLives - 1;
          if (newLives <= 0) {
            handleGameOver();
            return 0;
          }
          return newLives;
        });
        toast.error('Respuesta incorrecta', { duration: 1000, icon: '❌' });
      }

      if (!isGameOver) {
        setTimeout(() => {
          handleContinue();
        }, 1000);
      }

      setAnsweredQuestions([
        ...answeredQuestions,
        {
          question: items[currentQuestion].question.question,
          answer: items[currentQuestion].question.answer,
          resume: items[currentQuestion].question.resume,
          isCorrect,
          userAnswer: answer,
        },
      ]);
    },
    [currentQuestion, answeredQuestions, handleContinue, sessionScore, score, isGameOver, items]
  );

  const getCorrectAnswersCount = useCallback(() => {
    return answeredQuestions.filter(q => q.isCorrect).length;
  }, [answeredQuestions]);

  const calculateCorrectAnswersPercentage = useCallback(() => {
    const correctAnswers = getCorrectAnswersCount();
    return Math.round((correctAnswers / items.length) * 100);
  }, [getCorrectAnswersCount, items.length]);

  const handleFinish = useCallback(() => {
    const status = getTriviaStatus(id);
    const actualPercentage = calculateCorrectAnswersPercentage();

    const higherPercentage =
      typeof status !== 'undefined' && status.percentage > actualPercentage
        ? status.percentage
        : actualPercentage;

    const updatedTrivia: TriviaStatus = {
      id: status?.id ?? id,
      name,
      percentage: higherPercentage,
      completed: higherPercentage >= 80,
    };

    saveTriviaStatus(updatedTrivia);
    toast.success('Se guardó tu progreso.');
  }, [id, calculateCorrectAnswersPercentage]);

  useEffect(() => {
    if (isFinished) {
      handleFinish();
    }
  }, [isFinished, handleFinish]);

  const resetGame = () => {
    setCurrentQuestion(0);
    setLives(3);
    setSessionScore(0);
    setIsGameOver(false);
    setIsFinished(false);
    setAnsweredQuestions([]);
    setIsTimerPaused(false);
    handleTimeLeft();
  };

  useEffect(() => {
    if (!isFinished && !isGameOver && !isTimerPaused) {
      if (typeof timeLeft === 'undefined') return;

      if (timeLeft === 0) {
        handleTimeOut();
      } else if (timeLeft > 0) {
        const interval = setInterval(() => {
          setTimeLeft((current) => (current ? current - 1 : current));
        }, 1000);

        return () => {
          clearInterval(interval);
        };
      }
    }
  }, [timeLeft, isFinished, isGameOver, isTimerPaused, handleTimeOut]);

  const handleClosePurchaseModal = () => {
    loadUserData();
    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    if (data.game.totalLives < 1) {
      setIsGameOver(true);
    }
    setShowPurchaseModal(false);
  };

  const handleFullscreen = () => {
    const element = document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      element.requestFullscreen().catch((err) => {
        toast.error(
          `Error al intentar entrar en pantalla completa: ${err.message}`
        );
      });
    }
  };

  if (isFinished) {
    return (
      <>
        <Toaster />
        <TriviaReview
          correctAnswers={getCorrectAnswersCount()}
          triviaName={name}
          triviaLength={items.length}
          answeredQuestions={answeredQuestions}
        />
      </>
    );
  }

  return (
    <main className={`min-h-screen ${
      isNightMode ? 'bg-gray-900 text-white' : 'bg-gray-50'
    } transition-colors duration-300 pt-20`}>

      <GameStatusBar
        title={name}
        score={score}
        lives={lives}
        level={currentQuestion + 1}
        timeLeft={timeLeft}
        currentQuestion={currentQuestion + 1}
        totalQuestions={items.length}
      />

      {isGameOver ? (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className={`${isNightMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                          rounded-xl shadow-lg border p-8 text-center`}>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">😢</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">Game Over</h2>
            <p className={`${isNightMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              Te has quedado sin vidas. ¿Quieres comprar una vida extra para continuar?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="inline-flex items-center justify-center gap-2 text-white px-6 py-3 
                         rounded-full hover:opacity-90 transition-colors font-medium"
                style={{ backgroundColor: ACCENT }}
              >
                <IconShoppingCart size={20} />
                Comprar Vida Extra
              </button>
              <button
                onClick={resetGame}
                className={`inline-flex items-center justify-center gap-2 ${
                  isNightMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                } px-6 py-3 rounded-full transition-colors font-medium`}
              >
                <IconRefresh size={20} />
                Reiniciar Juego
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Question Card */}
          <div className={`${isNightMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} 
                          rounded-xl shadow-sm border p-8 mb-8 text-center`}>
            <div className="mb-4">
              <span
                className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                style={isNightMode ? { backgroundColor: `${ACCENT}30`, color: '#93c5fd' } : { backgroundColor: `${ACCENT}15`, color: ACCENT }}
              >
                Pregunta {currentQuestion + 1} de {items.length}
              </span>
            </div>
            <p className="text-xl md:text-2xl font-medium leading-relaxed">
              {items[currentQuestion].question.question}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {items[currentQuestion].options.map((option, index) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={timeLeft === 0 || timeLeft === undefined}
                className={`${OPTION_COLORS[index as 0 | 1 | 2 | 3]} 
                           text-white p-6 rounded-xl font-medium text-lg
                           border-2 transition-all duration-200
                           hover:shadow-lg hover:-translate-y-1
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                           focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-6 flex flex-col gap-3">
        {/* Instagram Button */}
        <button
          onClick={handleInstagramClick}
          className={`relative group ${hasClickedInstagram 
            ? 'bg-gray-400' 
            : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500'
          } p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110`}
          title={hasClickedInstagram ? 'Ya recibiste los puntos' : '+500 puntos por seguirnos'}
        >
          <IconBrandInstagram size={24} className="text-white" />

          {!hasClickedInstagram && (
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold 
                          px-2 py-1 rounded-full border-2 border-white animate-bounce shadow-sm">
              +500
            </div>
          )}

          <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-900 text-white 
                        text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 
                        transition-opacity whitespace-nowrap pointer-events-none">
            {hasClickedInstagram ? 'Ya recibiste +500 pts' : '¡Síguenos y gana +500 pts!'}
          </div>
        </button>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        {/* Fullscreen Button */}
        <button
          onClick={handleFullscreen}
          className={`${isNightMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} 
                     p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 
                     hover:scale-110 border ${isNightMode ? 'border-gray-600' : 'border-gray-200'}`}
          title="Pantalla completa"
        >
          <IconMaximize size={24} className={isNightMode ? 'text-white' : 'text-gray-700'} />
        </button>

        {/* Night Mode Button */}
        <button
          onClick={() => setIsNightMode(!isNightMode)}
          className={`${isNightMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} 
                     p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 
                     hover:scale-110 border ${isNightMode ? 'border-gray-600' : 'border-gray-200'}`}
          title={isNightMode ? 'Modo día' : 'Modo noche'}
        >
          {isNightMode ? (
            <IconSun size={24} className="text-yellow-400" />
          ) : (
            <IconMoon size={24} className="text-gray-700" />
          )}
        </button>
      </div>

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onPurchase={handlePurchaseLife}
      />

      <Toaster position="top-center" />
    </main>
  );
}