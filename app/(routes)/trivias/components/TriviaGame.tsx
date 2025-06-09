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
import Image from 'next/image';
import Swal from 'sweetalert2';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';

const OPTION_COLORS: { [key in 0 | 1 | 2 | 3]: string } = {
  0: 'bg-[#FF6B6B] hover:bg-red-400',
  1: 'bg-[#4ADE80] hover:bg-green-400',
  2: 'bg-[#FFD93D] hover:bg-yellow-400',
  3: 'bg-blue-500 hover:bg-blue-400',
};

const CORRECT_ANSWER_POINTS = 100;
const INCORRECT_ANSWER_PENALTY = 50;
const INSTAGRAM_BONUS_POINTS = 500;
const LIVES_STORAGE_KEY = 'totalGameLives';
const SCORE_STORAGE_KEY = 'totalGameScore';
const INSTAGRAM_CLICKED_KEY = 'instagramClicked';
const INITIAL_LIVES = 3;

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
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [hasClickedInstagram, setHasClickedInstagram] = useState<boolean>(false);

  useEffect(() => {
    const storedLives = localStorage.getItem(LIVES_STORAGE_KEY);
    if (storedLives) {
      setLives(parseInt(storedLives, 10));
    }
  }, []);

  useEffect(() => {
    const storedScore = localStorage.getItem(SCORE_STORAGE_KEY);
    if (storedScore) {
      setScore(parseInt(storedScore, 10));
    }
  }, []);

  useEffect(() => {
    const instagramClicked = localStorage.getItem(INSTAGRAM_CLICKED_KEY);
    if (instagramClicked === 'true') {
      setHasClickedInstagram(true);
    }
  }, []);

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
    const currentStoredLives = parseInt(localStorage.getItem(LIVES_STORAGE_KEY) || '3');
    if (currentStoredLives < 3) {
      setShowPurchaseModal(false);
      if (isGameOver) {
        setIsGameOver(false);
        handleTimeLeft();
      }
    }
  };

  const handleInstagramClick = () => {
    if (!hasClickedInstagram) {
      // Dar puntos bonus
      const newScore = score + INSTAGRAM_BONUS_POINTS;
      setScore(newScore);
      localStorage.setItem(SCORE_STORAGE_KEY, newScore.toString());
      
      // Marcar como clickeado
      setHasClickedInstagram(true);
      localStorage.setItem(INSTAGRAM_CLICKED_KEY, 'true');
      
      // Mostrar mensaje de éxito
      toast.success(`¡+${INSTAGRAM_BONUS_POINTS} puntos por seguirnos!`, {
        duration: 3000,
        icon: '🎉'
      });
    }
    
    // Abrir Instagram en una nueva pestaña
    window.open('https://www.instagram.com/appcresi', '_blank');
  };

  const handleGameOver = () => {
    setIsGameOver(true);
    setTimeLeft(undefined);
    setShowPurchaseModal(true);
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
        setScore(score + CORRECT_ANSWER_POINTS);
        Swal.fire({
          icon: "success",
          title: "¡Genial!",
          text: "¡Respuesta correcta!",
          showConfirmButton: false,
          timer: 500
        });
      } else {
        setScore(prevScore => Math.max(0, prevScore - INCORRECT_ANSWER_PENALTY));
        setLives(prevLives => {
          const newLives = prevLives - 1;
          if (newLives <= 0) {
            handleGameOver();
            return 0;
          }
          return newLives;
        });
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "¡Respuesta incorrecta!",
          showConfirmButton: false,
          timer: 500
        });
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
    [currentQuestion, answeredQuestions, handleContinue, score, isGameOver, items]
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
      percentage: higherPercentage,
      completed: higherPercentage >= 80,
    };

    saveTriviaStatus(updatedTrivia);
    toast.success('Se guardó tu progreso.');
  }, [id, calculateCorrectAnswersPercentage]);

  const resetGame = () => {
    setCurrentQuestion(0);
    setLives(INITIAL_LIVES);
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
    const currentStoredScore = parseInt(localStorage.getItem(SCORE_STORAGE_KEY) || '0');
    const currentStoredLives = parseInt(localStorage.getItem(LIVES_STORAGE_KEY) || '3');
    setScore(currentStoredScore);
    setLives(currentStoredLives);
    if (currentStoredLives < 1) {
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
    handleFinish();
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
      isNightMode ? 'bg-gray-800 text-white' : 'bg-[#FFE5E5]'
    } font-bold relative overflow-hidden pt-24`}>
      
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
        <div className="mx-auto px-4 max-w-5xl">
          <div className="bg-white border-4 border-black p-8 rounded-lg text-center 
                        shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
            <h2 className="text-2xl font-bold mb-4">¡Game Over!</h2>
            <p className="mb-4">Te has quedado sin vidas. ¿Quieres comprar una vida extra para continuar?</p>
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => setShowPurchaseModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 
                         border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Comprar Vida Extra
              </button>
              <button 
                onClick={resetGame}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600
                         border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                Reiniciar Juego
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-auto px-4 max-w-5xl">
          <section className="mb-4 sm:mb-8">
            <div className="bg-white border-2 sm:border-4 border-black p-4 sm:p-8 rounded-lg text-center 
                          shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] 
                          transform rotate-1">
              <p className="text-lg sm:text-2xl text-gray-800 leading-relaxed">
                {items[currentQuestion].question.question}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items[currentQuestion].options.map((option, index) => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                disabled={timeLeft === 0 || timeLeft === undefined}
                className={`${OPTION_COLORS[index as 0 | 1 | 2 | 3]} p-6 rounded-lg font-black text-xl
                           border-4 border-black transform hover:scale-105 hover:-rotate-2
                           transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {option}
              </button>
            ))}
          </section>

          {/* Botón flotante de Instagram (inferior izquierdo) */}
          <div className="fixed bottom-6 left-6">
            <button
              onClick={handleInstagramClick}
              className={`${hasClickedInstagram 
                ? 'bg-gray-400' 
                : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 animate-pulse'
              } p-4 rounded-full border-4 border-black
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:scale-110
                       transition-all duration-300 relative group`}
              title={hasClickedInstagram ? 'Ya recibiste los puntos' : '+500 puntos por seguirnos'}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="white"
                className="drop-shadow-sm"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 
                            bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 
                            transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                {hasClickedInstagram ? 'Ya recibiste +500 pts' : '¡Síguenos y gana +500 pts!'}
              </div>
              
              {/* Indicador de puntos bonus (solo si no ha clickeado) */}
              {!hasClickedInstagram && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold 
                              px-2 py-1 rounded-full border-2 border-black animate-bounce">
                  +500
                </div>
              )}
            </button>
          </div>

          {/* Botones flotantes (inferior derecho) */}
          <div className="fixed bottom-6 right-6 flex gap-4">
            <button
              onClick={handleFullscreen}
              className="bg-[#4ADE80] p-4 rounded-full border-4 border-black
                      shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:scale-110
                      transition-all duration-300 hidden sm:block"
            >
              <Image src="/full-screen.svg" alt="Pantalla Completa" width={24} height={24} />
            </button>

            <button
              onClick={() => setIsNightMode(!isNightMode)}
              className="bg-[#FFD93D] p-4 rounded-full border-4 border-black
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:scale-110
                       transition-all duration-300"
            >
              <Image
                src={isNightMode ? '/sun-mode.svg' : '/night-mode.svg'}
                alt={isNightMode ? 'Modo Día' : 'Modo Noche'}
                width={24}
                height={24}
              />
            </button>
          </div>
        </div>
      )}

      {/* Modal de compra de vidas */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onPurchase={handlePurchaseLife}
      />

      <Toaster />
    </main>
  );
}