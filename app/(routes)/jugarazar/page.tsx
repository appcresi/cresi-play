'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { db } from '@/lib/firebaseFirestore';
import { trackEvent } from '@/lib/analytics';
import { collection, query, where, getDocs, QueryConstraint } from 'firebase/firestore';
import toast, { Toaster } from 'react-hot-toast';
import { IconRefresh, IconHome, IconDeviceFloppy } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';

interface Question {
  id: string;
  question: string;
  answer: string;
  options: {
    first: string;
    second: string;
    third: string;
  };
  category: string;
  level: number;
  resume: string;
}

interface UserData {
  profile: {
    character: {
      id: number;
      name: string;
      image: string;
    };
    username: string;
  };
  game: {
    totalScore: number;
    totalLives: number;
  };
}

interface ShuffledOption {
  key: string;
  label: string;
  value: string;
}

// El `slug` es el nombre EXACTO del archivo en /public (sin tildes, en
// minúscula) — nunca lo derivamos de `name` (el texto que se muestra),
// porque eso rompe en producción: Windows/Mac no distinguen mayúsculas en
// nombres de archivo, pero el servidor de Vercel (Linux) sí. Los archivos
// en /public deben llamarse exactamente: salud.png, prevencion.png,
// diversidad.png, derecho.png, proyecto.png, azar.png
const CATEGORIES = [
  { name: 'Salud', slug: 'salud', color: '#3B82F6' },
  { name: 'Prevención', slug: 'prevencion', color: '#10B981' },
  { name: 'Diversidad', slug: 'diversidad', color: '#8B5CF6' },
  { name: 'Derecho', slug: 'derecho', color: '#F59E0B' },
  { name: 'Proyecto', slug: 'proyecto', color: '#EF4444' },
  { name: 'Azar', slug: 'azar', color: '#F59E0B' },
];

function getCategorySlug(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.slug ?? name.toLowerCase();
}

function getCategoryColor(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.color ?? '#6366F1';
}

const STORAGE_KEY = 'cresi_user_data';
// Claves temporales (sessionStorage) para "traspasar" el puntaje de una
// partida sin cuenta hacia /unirse, y volver acá después de loguearse.
const PENDING_SCORE_KEY = 'cresi_pending_score';
const PENDING_RETURN_KEY = 'cresi_pending_return_to';
const CORRECT_ANSWER_POINTS = 100;
const DEFAULT_TIME = 60;

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function JugarAzar(): JSX.Element {
  const router = useRouter();

  // Estados principales
  const [gameState, setGameState] = useState<'spinning' | 'category-selected' | 'question' | 'finished'>('spinning');
  const [isGameOver, setIsGameOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [usedQuestions, setUsedQuestions] = useState<Set<string>>(new Set());
  const [correctQuestions, setCorrectQuestions] = useState<Set<string>>(new Set());
  const [completedCategories, setCompletedCategories] = useState<Set<string>>(new Set());
  const [currentLevel, setCurrentLevel] = useState(1);
  const [shuffledOptions, setShuffledOptions] = useState<ShuffledOption[]>([]);

  // Estados del juego
  const [userData, setUserData] = useState<UserData | null>(null);
  const [score, setScore] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState<number | undefined>(DEFAULT_TIME);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Estados de UI
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | undefined>(undefined);
  const [answerSelected, setAnswerSelected] = useState(false);
  const [showAnswerResult, setShowAnswerResult] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const [showExitSavePrompt, setShowExitSavePrompt] = useState(false);

  // ============================================
  // FUNCIONES DE CARGA Y GUARDADO
  // ============================================

  const loadUserData = useCallback(() => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: UserData = JSON.parse(storedData);
        setUserData(data);
        setScore(data.game.totalScore);
        setLives(data.game.totalLives);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, []);

  const saveUserData = useCallback(() => {
    if (!userData) return;

    try {
      const updatedData: UserData = {
        ...userData,
        game: {
          ...userData.game,
          totalScore: score,
          totalLives: lives,
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }, [userData, score, lives]);

  // Cargar datos al montar
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Guardar datos cuando cambien score o lives
  useEffect(() => {
    if (userData) {
      saveUserData();
    }
  }, [score, lives, userData, saveUserData]);

  // ============================================
  // TIMER EFFECT
  // ============================================

  useEffect(() => {
    if (!isGameOver && !isTimerPaused && gameState === 'question') {
      if (typeof timeLeft === 'undefined') return;

      if (timeLeft === 0) {
        handleTimeOut();
        return;
      }

      const interval = setInterval(() => {
        setTimeLeft((current) => {
          if (!current || current <= 0) return 0;
          return current - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeLeft, isGameOver, isTimerPaused, gameState]);

  // ============================================
  // FUNCIONES DE MANEJO DE JUEGO
  // ============================================

  const handleGameOver = useCallback(() => {
    setIsGameOver(true);
    setTimeLeft(undefined);
    if (userData && userData.game.totalScore >= 200) {
      setShowPurchaseModal(true);
    }
  }, [userData]);

  const handleTimeOut = useCallback(() => {
    if (isTimerPaused) return;

    setIsTimerPaused(true);
    setTimeLeft(undefined);
    toast('¡Se acabó el tiempo!', { duration: 2000, icon: '⏰' });

    setLives((prevLives) => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        handleGameOver();
        return 0;
      }
      return newLives;
    });
  }, [isTimerPaused, handleGameOver]);

  const fetchQuestions = useCallback(async (category: string) => {
    try {
      const questionsRef = collection(db, 'questions');
      let constraints: QueryConstraint[] = [];

      if (category !== 'Azar') {
        constraints = [where('category', '==', category)];
      }

      const q = query(questionsRef, ...constraints);
      const snapshot = await getDocs(q);
      const fetchedQuestions: Question[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        question: doc.data().question,
        answer: doc.data().answer,
        options: doc.data().options,
        category: doc.data().category,
        level: doc.data().level || 1,
        resume: doc.data().resume,
      }));

      fetchedQuestions.sort((a, b) => a.level - b.level);
      setAllQuestions(fetchedQuestions);
      setUsedQuestions(new Set());
      setCurrentLevel(1);
      return fetchedQuestions;
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Error al cargar las preguntas');
      return [];
    }
  }, []);

  const handleSpin = useCallback(async () => {
    if (isSpinning) return;

    setIsSpinning(true);
    
    // Filtrar categorías no completadas
    const availableCategories = CATEGORIES.filter(
      cat => !completedCategories.has(cat.name)
    );

    // Si no hay categorías disponibles, mostrar pantalla de campeón
    if (availableCategories.length === 0) {
      setGameState('finished');
      setIsSpinning(false);
      trackEvent('activity_completed', { activity_id: 'jugarazar' });
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableCategories.length);
    const randomCategory = CATEGORIES.indexOf(availableCategories[randomIndex]);
    const spinRotation = randomCategory * 60 + 360 * 5;
    setRotation(spinRotation);

    setTimeout(async () => {
      const selectedCat = availableCategories[randomIndex].name;
      setSelectedCategory(selectedCat);
      setGameState('category-selected');

      const fetchedQuestions = await fetchQuestions(selectedCat);
      setIsSpinning(false);

      setTimeout(() => {
        setGameState('question');
        if (fetchedQuestions.length > 0) {
          // Filtrar preguntas que ya se respondieron correctamente y que sean del nivel actual
          const availableQuestions = fetchedQuestions.filter(
            q => !correctQuestions.has(q.id) && q.level === currentLevel
          );
          
          if (availableQuestions.length === 0) {
            // Si no hay más preguntas del nivel actual, pasar al siguiente nivel
            const nextLevel = currentLevel + 1;
            const nextLevelQuestions = fetchedQuestions.filter(
              q => !correctQuestions.has(q.id) && q.level === nextLevel
            );

            if (nextLevelQuestions.length === 0) {
              // Si no hay más preguntas en ningún nivel, categoría completada
              setCompletedCategories(new Set([...Array.from(completedCategories), selectedCat]));
              setGameState('spinning');
              return;
            }

            // Pasar al siguiente nivel
            setCurrentLevel(nextLevel);
            const randomIndex = Math.floor(Math.random() * nextLevelQuestions.length);
            const question = nextLevelQuestions[randomIndex];
            const options: ShuffledOption[] = [
              { key: 'answer', label: 'A', value: question.answer },
              { key: 'first', label: 'B', value: question.options.first },
              { key: 'second', label: 'C', value: question.options.second },
              { key: 'third', label: 'D', value: question.options.third },
            ];
            setCurrentQuestion(question);
            setShuffledOptions(shuffleArray(options));
            setUsedQuestions(new Set([question.id]));
            setTimeLeft(DEFAULT_TIME);
            setIsTimerPaused(false);
          } else {
            // Seleccionar una pregunta aleatoria del nivel actual
            const randomIndex = Math.floor(Math.random() * availableQuestions.length);
            const question = availableQuestions[randomIndex];
            const options: ShuffledOption[] = [
              { key: 'answer', label: 'A', value: question.answer },
              { key: 'first', label: 'B', value: question.options.first },
              { key: 'second', label: 'C', value: question.options.second },
              { key: 'third', label: 'D', value: question.options.third },
            ];
            setCurrentQuestion(question);
            setShuffledOptions(shuffleArray(options));
            setUsedQuestions(new Set([question.id]));
            setTimeLeft(DEFAULT_TIME);
            setIsTimerPaused(false);
          }
        }
      }, 1000);
    }, 3000);
  }, [isSpinning, fetchQuestions, correctQuestions, completedCategories]);

  const handleAnswer = useCallback(
    (selectedOption: string) => {
      if (answerSelected || !currentQuestion || isGameOver) return;

      setCorrectAnswer(currentQuestion.answer);
      setAnswerSelected(true);
      setShowAnswerResult(true);
      setIsTimerPaused(true);
      setTimeLeft(undefined);

      const isCorrect = selectedOption === currentQuestion.answer;

      if (isCorrect) {
        const newScore = score + CORRECT_ANSWER_POINTS;
        const newSessionScore = sessionScore + CORRECT_ANSWER_POINTS;
        setScore(newScore);
        setSessionScore(newSessionScore);
        toast.success('¡Respuesta correcta!', { duration: 1000, icon: '✅' });
        
        // Guardar pregunta como correcta para no repetir
        setCorrectQuestions(new Set([...Array.from(correctQuestions), currentQuestion.id]));
      } else {
        toast.error('Respuesta incorrecta', { duration: 1000, icon: '❌' });

        setLives((prevLives) => {
          const newLives = prevLives - 1;
          if (newLives <= 0) {
            handleGameOver();
            return 0;
          }
          return newLives;
        });
      }

      setUsedQuestions(new Set([...Array.from(usedQuestions), currentQuestion.id]));
    },
    [answerSelected, currentQuestion, isGameOver, score, sessionScore, usedQuestions, correctQuestions, handleGameOver]
  );

  const handleContinueToWheel = useCallback(() => {
    if (isGameOver) return;

    setGameState('spinning');
    setSelectedCategory(null);
    setCurrentQuestion(null);
    setRotation(0);
    setAnswerSelected(false);
    setShowAnswerResult(false);
    setCorrectAnswer(undefined);
    setIsTimerPaused(false);
    setTimeLeft(DEFAULT_TIME);
  }, [isGameOver]);

  const handlePlayAgain = useCallback(() => {
    setGameState('spinning');
    setSelectedCategory(null);
    setCurrentQuestion(null);
    setAllQuestions([]);
    setUsedQuestions(new Set());
    setCorrectQuestions(new Set());
    setCompletedCategories(new Set());
    setRotation(0);
    setAnswerSelected(false);
    setCorrectAnswer(undefined);
    setCurrentLevel(1);
    setSessionScore(0);
    setIsGameOver(false);
    setLives(3);
    setTimeLeft(DEFAULT_TIME);
    setIsTimerPaused(false);
    setProgressSaved(false);
  }, []);

  const handleExitGame = useCallback(() => {
    // Sin cuenta y con puntos ganados en esta partida: ofrecemos guardar
    // antes de tirarlos, en vez de salir directo.
    if (!userData && sessionScore > 0) {
      setShowExitSavePrompt(true);
      return;
    }
    router.push('/');
  }, [router, userData, sessionScore]);

  const handleExitWithoutSaving = useCallback(() => {
    setShowExitSavePrompt(false);
    router.push('/');
  }, [router]);

  const handlePurchaseLife = useCallback(() => {
    loadUserData();
    setShowPurchaseModal(false);
    setIsGameOver(false);
    setGameState('spinning');
    setSelectedCategory(null);
    setCurrentQuestion(null);
    setRotation(0);
    setAnswerSelected(false);
    setTimeLeft(DEFAULT_TIME);
    setIsTimerPaused(false);
  }, [loadUserData]);

  const handleClosePurchaseModal = useCallback(() => {
    loadUserData();

    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const data: UserData = JSON.parse(storedData);
      setScore(data.game.totalScore);
      setLives(data.game.totalLives);

      if (data.game.totalLives < 1) {
        setIsGameOver(true);
      }
    }
    setShowPurchaseModal(false);
  }, [loadUserData]);

  /**
   * Quien juega desde el botón flotante de la landing (o cualquier acceso
   * directo) no tiene ninguna cuenta todavía — `userData` queda `null` toda
   * la partida, porque nunca pasó por /unirse. Al perder, guardamos el
   * puntaje de ESTA partida en sessionStorage (dura solo hasta el login) y
   * lo mandamos a /unirse; al volver acá, ese puntaje ya está sumado a su
   * cuenta nueva.
   */
  const handleSaveProgress = useCallback(() => {
    try {
      sessionStorage.setItem(
        PENDING_SCORE_KEY,
        JSON.stringify({ score: sessionScore, savedAt: new Date().toISOString() })
      );
      sessionStorage.setItem(PENDING_RETURN_KEY, '/jugarazar');
    } catch (error) {
      console.error('❌ Error guardando el progreso pendiente:', error);
    }
    router.push('/unirse');
  }, [sessionScore, router]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <main className="min-h-screen bg-cream dark:bg-gray-900 pt-20 pb-8">
      <Toaster />

      {gameState === 'question' && !isGameOver && (
        <GameStatusBar
          title="Jugar al Azar"
          score={score}
          lives={lives}
          level={1}
          timeLeft={timeLeft}
        />
      )}

      {/* Spinning State */}
      {gameState === 'spinning' && (
        <div className="flex flex-col items-center justify-center gap-6 max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl px-8 py-10 flex flex-col items-center gap-6 w-full max-w-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-ink dark:text-gray-100 mb-1">¡Girá la ruleta!</h2>
              <p className="text-ink/40 dark:text-gray-500 text-sm">Te va a tocar una categoría al azar</p>
            </div>

            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              <Image
                src="/ruleta.png"
                alt="Ruleta"
                fill
                sizes="(max-width: 640px) 288px, 320px"
                className="drop-shadow-xl"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 3s ease-out' : 'none',
                }}
              />

              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10 drop-shadow-md">
                <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#FF6B6B]" />
              </div>

              {/* Centro decorativo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-4 h-4 rounded-full bg-white shadow-md border-2 border-pink-light" />
              </div>
            </div>

            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className="bg-[#FF6B6B] hover:bg-[#E8514F] text-white font-bold py-3.5 px-10 rounded-full text-lg
                       shadow-[0_8px_24px_-8px_rgba(255,107,107,0.6)] hover:shadow-[0_10px_28px_-6px_rgba(255,107,107,0.7)]
                       hover:-translate-y-0.5 transition-all duration-300
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSpinning ? 'Girando...' : '¡GIRAR!'}
            </button>
          </div>

          {/* Completed Categories */}
          {completedCategories.size > 0 && (
            <div className="mt-2 w-full max-w-2xl">
              <h3 className="text-center text-sm font-semibold text-ink/60 dark:text-gray-400 mb-3">
                Categorías completadas ({completedCategories.size}/{CATEGORIES.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Array.from(completedCategories).map((category) => {
                  const color = getCategoryColor(category);
                  return (
                    <div
                      key={category}
                      className="bg-white dark:bg-gray-800 border-2 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 shadow-sm"
                      style={{ borderColor: `${color}30` }}
                    >
                      <div className="relative">
                        <Image
                          src={`/${getCategorySlug(category)}.png`}
                          alt={category}
                          width={32}
                          height={32}
                          className="w-8 h-8"
                        />
                        <div
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: color }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-2.5 h-2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="font-semibold text-xs" style={{ color }}>{category}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Category Selected State */}
      {gameState === 'category-selected' && selectedCategory && (
        <div className="flex flex-col items-center justify-center gap-6 max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-10 text-center max-w-sm w-full">
            <p className="text-ink/40 dark:text-gray-500 text-sm font-medium uppercase tracking-wide mb-5">
              ¡Categoría seleccionada!
            </p>
            <div
              className="w-28 h-28 rounded-full mx-auto mb-5 flex items-center justify-center"
              style={{ backgroundColor: `${getCategoryColor(selectedCategory)}15` }}
            >
              <Image
                src={`/${getCategorySlug(selectedCategory)}.png`}
                alt={selectedCategory}
                width={64}
                height={64}
                className="w-16 h-16"
              />
            </div>
            <h2
              className="text-3xl font-bold mb-5"
              style={{ color: getCategoryColor(selectedCategory) }}
            >
              {selectedCategory}
            </h2>
            <div className="flex items-center justify-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: getCategoryColor(selectedCategory), animationDelay: '0ms' }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: getCategoryColor(selectedCategory), animationDelay: '150ms' }}
              />
              <span
                className="w-2 h-2 rounded-full animate-bounce"
                style={{ backgroundColor: getCategoryColor(selectedCategory), animationDelay: '300ms' }}
              />
            </div>
            <p className="text-ink/40 dark:text-gray-500 text-sm mt-3">Cargando preguntas...</p>
          </div>
        </div>
      )}

      {/* Question State */}
      {gameState === 'question' && !isGameOver && currentQuestion && (
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Question Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-pink-light dark:border-gray-700 p-8 mb-8 text-center">
            <div className="mb-4">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                {selectedCategory} · Nivel {currentLevel}
              </span>
            </div>
            <p className="text-xl md:text-2xl font-medium leading-relaxed text-ink dark:text-gray-100">
              {currentQuestion.question}
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {shuffledOptions.map((option, index) => {
              const colors = [
                'bg-red-500 hover:bg-red-600 border-red-600',
                'bg-green-500 hover:bg-green-600 border-green-600',
                'bg-yellow-500 hover:bg-yellow-600 border-yellow-600',
                'bg-blue-500 hover:bg-blue-600 border-blue-600',
              ];

              return (
                <button
                  key={option.key}
                  onClick={() => handleAnswer(option.value)}
                  disabled={answerSelected}
                  className={`${
                    answerSelected
                      ? option.value === currentQuestion.answer
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : colors[index % 4]
                  } text-white p-6 rounded-lg font-medium text-lg
                  border-2 transition-all duration-200
                  hover:shadow-lg hover:-translate-y-1
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
                  focus:outline-none focus:ring-2 focus:ring-offset-2`}
                >
                  <span className="font-bold">{option.label}.</span> {option.value}
                </button>
              );
            })}
          </div>
          {/* Action Buttons */}
          {answerSelected && showAnswerResult && (
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <button
                onClick={handleContinueToWheel}
                className="flex-1 bg-coral hover:bg-coral-dark text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
              >
                Siguiente Pregunta
              </button>
              <button
                onClick={handleExitGame}
                className="flex-1 bg-ink/80 hover:bg-ink text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
              >
                Salir del Juego
              </button>
            </div>
          )}
          {/* Resume */}
          {answerSelected && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-3">
              <p className="text-blue-900 text-sm">{currentQuestion.resume}</p>
            </div>
          )}


        </div>
      )}

      {/* Game Over State */}
      {isGameOver && (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">😢</span>
            </div>
            <h2 className="text-3xl font-bold mb-3">Game Over</h2>
            <p className="text-ink/70 dark:text-gray-400 mb-6">
              Te has quedado sin vidas. ¿Quieres comprar una vida extra para continuar?
            </p>

            {/* Alguien jugando sin ninguna cuenta: le ofrecemos guardar el
                puntaje de esta partida antes de que se pierda. */}
            {!userData && !progressSaved && (
              <div className="bg-mint border border-mint-light rounded-lg p-4 mb-6">
                <p className="text-ink dark:text-gray-100 font-medium mb-1">
                  Ganaste {sessionScore} puntos en esta partida 🎉
                </p>
                <p className="text-ink/70 dark:text-gray-400 text-sm mb-3">
                  Todavía no tenés una cuenta — si te registrás ahora, guardamos este puntaje.
                </p>
                <button
                  onClick={handleSaveProgress}
                  className="inline-flex items-center justify-center gap-2 bg-coral text-white px-5 py-2.5
                           rounded-lg hover:bg-coral-dark transition-colors font-medium text-sm"
                >
                  <IconDeviceFloppy size={18} />
                  ¿Querés guardar tu progreso?
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => setShowPurchaseModal(true)}
                className="inline-flex items-center justify-center gap-2 bg-coral text-white px-6 py-3
                         rounded-lg hover:bg-coral-dark transition-colors font-medium"
              >
                💳 Comprar Vida Extra
              </button>
              <button
                onClick={handlePlayAgain}
                className="inline-flex items-center justify-center gap-2 bg-pink-light dark:bg-gray-700 hover:bg-[#FFD6D6] dark:hover:bg-gray-600
                         text-ink dark:text-gray-100 px-6 py-3 rounded-lg transition-colors font-medium"
              >
                <IconRefresh size={20} />
                Reiniciar Juego
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finished State */}
      {gameState === 'finished' && (
        <div className="flex flex-col items-center justify-center gap-6 max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <span className="text-5xl">🏆</span>
            </div>
            <h2 className="text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600">
              ¡CAMPEÓN!
            </h2>
            <p className="text-ink/70 dark:text-gray-400 text-lg mb-4">
              ¡Completaste todas las categorías!
            </p>
            <div className="mb-6">
              <p className="text-ink/80 dark:text-gray-300 text-sm mb-3">Categorías Completadas:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
                {Array.from(completedCategories).map((category) => {
                  return (
                    <div
                      key={category}
                      className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <Image
                        src={`/${getCategorySlug(category)}.png`}
                        alt={category}
                        width={20}
                        height={20}
                        className="w-5 h-5"
                      />
                      {category}
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-3xl font-bold text-coral-dark mb-2">+{sessionScore} puntos</p>
            <p className="text-ink/80 dark:text-gray-300 mb-8">
              Puntuación total: <span className="font-bold text-2xl text-purple-600">{score}</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handlePlayAgain}
                className="inline-flex items-center justify-center gap-2 bg-coral hover:bg-coral-dark
                         text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
              >
                <IconRefresh size={20} />
                Jugar de Nuevo
              </button>
              <button
                onClick={handleExitGame}
                className="inline-flex items-center justify-center gap-2 bg-ink/80 hover:bg-ink
                         text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
              >
                <IconHome size={20} />
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      )}

      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={handleClosePurchaseModal}
        onPurchase={handlePurchaseLife}
      />

      {/* Cartel al salir sin cuenta: última oportunidad de no perder el puntaje */}
      {showExitSavePrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-14 h-14 bg-mint rounded-full flex items-center justify-center mx-auto mb-4">
              <IconDeviceFloppy size={26} className="text-mint-text" />
            </div>
            <h3 className="text-lg font-bold text-ink dark:text-gray-100 mb-2">¿Querés guardar tu progreso?</h3>
            <p className="text-sm text-ink/70 dark:text-gray-400 mb-6">
              Llevás {sessionScore} puntos en esta partida. Si salís sin loguearte, se pierden.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleSaveProgress}
                className="w-full bg-coral text-white py-2.5 px-4 rounded-lg hover:bg-coral-dark
                         transition-colors font-medium text-sm"
              >
                Guardar mi progreso
              </button>
              <button
                onClick={handleExitWithoutSaving}
                className="w-full text-ink/60 dark:text-gray-400 hover:text-ink/80 dark:hover:text-gray-300 py-2 text-sm"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}