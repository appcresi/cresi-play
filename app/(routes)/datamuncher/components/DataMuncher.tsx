"use client"
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import GameStatusBar from '@/components/GameStatusBar';
import GameCell from './GameCell';
import GameOverModal from './GameOverModal';
import LevelTransitionModal from './LevelTransitionModal';
import InstructionsModal from './InstructionsModal';
import QuestionModal from './QuestionModal';
import AnswerResultModal from './AnswerResultModal';
import TouchControls from './TouchControls';
import PurchaseModal from '@/components/PurchaseModal';
import { Position, Question, Effect, AnswerOption } from '../types/types';
import {
  GRID_SIZE,
  INITIAL_PLAYER,
  INITIAL_GHOSTS,
  INITIAL_QUIZ_POSITIONS,
  LEVELS
} from '../types/constants';
import UserDataManager from '@/lib/userDataManager';
import { trackEvent } from '@/lib/analytics';
import { getActivityById } from '@/lib/activities';

const ACTIVITY = getActivityById('datamuncher');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'DataMuncher';
const ACCENT = ACTIVITY?.color ?? '#D32F2F';

const DataMuncher = () => {
  const [player, setPlayer] = useState<Position>(INITIAL_PLAYER);
  const [ghosts, setGhosts] = useState<Position[]>(INITIAL_GHOSTS);
  const [dots, setDots] = useState<boolean[][]>(getInitialDots());
  const [score, setScore] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [direction, setDirection] = useState('right');
  const [effect, setEffect] = useState<Effect>({ text: '', x: 0, y: 0 });
  const [currentLevel, setCurrentLevel] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const [levelTransition, setLevelTransition] = useState(false);
  const [lives, setLives] = useState(3);
  const [quizItems, setQuizItems] = useState(INITIAL_QUIZ_POSITIONS);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [showQuestion, setShowQuestion] = useState(false);
  // Antes había una tarjeta de instrucciones siempre visible arriba del
  // tablero. Ahora se muestra una sola vez, como modal, antes de arrancar
  // a jugar — mientras está abierta el juego no debería moverse.
  const [showInstructions, setShowInstructions] = useState(true);
  // Se llena al responder (✅/❌) y se limpia al tocar "Aceptar" en el
  // modal de resultado — mientras está lleno, el juego queda en pausa
  // igual que con la pregunta, para que se pueda leer sin apuro.
  const [answerResult, setAnswerResult] = useState<{ correct: boolean; points: number; levelComplete: boolean } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(LEVELS[0].timeLimit);
  const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      saveUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionScore, lives, gameOver]);

  const loadUserData = () => {
    const data = UserDataManager.loadUserData();
    setUserData(data);
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    UserDataManager.visitActivity(ACTIVITY_TITLE);
    setHasLoaded(true);
  };

  const saveUserData = () => {
    const current = UserDataManager.loadUserData();
    const isComplete = currentLevel === LEVELS.length - 1 && gameOver;

    const updatedData = {
      ...current,
      game: {
        ...current.game,
        totalScore: current.game.totalScore + sessionScore,
        totalLives: lives
      },
      progress: {
        ...current.progress,
        activityScores: {
          ...current.progress.activityScores,
          [ACTIVITY_TITLE]: Math.max(current.progress.activityScores[ACTIVITY_TITLE] || 0, sessionScore)
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [ACTIVITY_TITLE]: new Date().toISOString()
        },
        completedActivities: isComplete
          ? Array.from(new Set([...current.progress.completedActivities, ACTIVITY_TITLE]))
          : current.progress.completedActivities
      }
    };

    setScore(updatedData.game.totalScore);
    UserDataManager.saveUserData(updatedData);
    setUserData(updatedData);
    if (isComplete && !current.progress.completedActivities.includes(ACTIVITY_TITLE)) {
      trackEvent('activity_completed', { activity_title: ACTIVITY_TITLE });
    }
  };

  function getInitialDots() {
    return Array.from({ length: GRID_SIZE }, (_, i) =>
      Array.from({ length: GRID_SIZE }, (_, j) =>
        !(i === 1 && j === 1) && !(i === 0 || j === 0 || i === GRID_SIZE - 1 || j === GRID_SIZE - 1)
      )
    );
  }

  const getRandomEmptyPosition = (excludePositions: Position[]): Position => {
    let position: Position;
    do {
      position = {
        x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
        y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
      };
    } while (
      LEVELS[currentLevel].walls.some(([wx, wy]) => wx === position.x && wy === position.y) ||
      excludePositions.some(pos => pos.x === position.x && pos.y === position.y)
    );
    return position;
  };

  const setQuestionOptions = (question: Question) => {
    const pos1 = getRandomEmptyPosition([player]);
    const pos2 = getRandomEmptyPosition([player, pos1]);

    setAnswerOptions([
      { position: pos1, value: true },
      { position: pos2, value: false }
    ]);

    setCurrentQuestion(question);
  };

  useEffect(() => {
    if (gameOver || showQuestion || levelTransition || showInstructions || answerResult) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, showQuestion, levelTransition, showInstructions, answerResult]);

  useEffect(() => {
    if (gameOver || showQuestion || levelTransition || showInstructions || answerResult) return;

    const moveInterval = setInterval(() => {
      setGhosts(prevGhosts =>
        prevGhosts.map(ghost => {
          const moves = [
            { x: ghost.x + 1, y: ghost.y },
            { x: ghost.x - 1, y: ghost.y },
            { x: ghost.x, y: ghost.y + 1 },
            { x: ghost.x, y: ghost.y - 1 }
          ].filter(move =>
            move.x > 0 && move.x < GRID_SIZE - 1 &&
            move.y > 0 && move.y < GRID_SIZE - 1 &&
            !LEVELS[currentLevel].walls.some(([x, y]) => x === move.x && y === move.y)
          );

          return moves[Math.floor(Math.random() * moves.length)] || ghost;
        })
      );
    }, LEVELS[currentLevel].ghostSpeed);

    return () => clearInterval(moveInterval);
  }, [gameOver, showQuestion, levelTransition, showInstructions, answerResult, currentLevel]);

  const handleMove = (direction: string) => {
    if (gameOver || showQuestion || levelTransition || showInstructions || answerResult) return;

    const newPlayer = { ...player };
    switch (direction) {
      case 'ArrowUp':
        newPlayer.y = Math.max(1, player.y - 1);
        setDirection('up');
        break;
      case 'ArrowDown':
        newPlayer.y = Math.min(GRID_SIZE - 2, player.y + 1);
        setDirection('down');
        break;
      case 'ArrowLeft':
        newPlayer.x = Math.max(1, player.x - 1);
        setDirection('left');
        break;
      case 'ArrowRight':
        newPlayer.x = Math.min(GRID_SIZE - 2, player.x + 1);
        setDirection('right');
        break;
      default:
        return;
    }

    if (!LEVELS[currentLevel].walls.some(([x, y]) => x === newPlayer.x && y === newPlayer.y)) {
      setPlayer(newPlayer);
      checkCollisions(newPlayer);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleMove(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, gameOver, showQuestion, levelTransition, showInstructions, answerResult]);

  const checkCollisions = (newPlayer: Position) => {
    if (ghosts.some(ghost => ghost.x === newPlayer.x && ghost.y === newPlayer.y)) {
      handleGhostCollision();
    }

    if (dots[newPlayer.y][newPlayer.x]) {
      const newDots = dots.map(row => [...row]);
      newDots[newPlayer.y][newPlayer.x] = false;
      setDots(newDots);
      setSessionScore(prev => prev + 1);
    }

    const quizIndex = quizItems.findIndex(item => item.x === newPlayer.x && item.y === newPlayer.y);
    if (quizIndex !== -1) {
      const randomQuestion = LEVELS[currentLevel].questions[Math.floor(Math.random() * LEVELS[currentLevel].questions.length)];
      setQuestionOptions(randomQuestion);
      setQuizItems(prev => prev.filter((_, index) => index !== quizIndex));
      // Frena el tiempo y el movimiento hasta que se confirme haber leído
      // la pregunta (ver el modal más abajo) — antes esto quedaba
      // declarado pero nunca se activaba, así que la pregunta se mostraba
      // en una tarjeta chica mientras el juego seguía corriendo igual.
      setShowQuestion(true);
    }

    const hitAnswer = answerOptions.find(opt => opt.position.x === newPlayer.x && opt.position.y === newPlayer.y);
    if (hitAnswer && currentQuestion) {
      handleQuizAnswer(hitAnswer.value);
      setAnswerOptions([]);
    }
  };

  const handleGhostCollision = () => {
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      if (userData.game.totalScore >= 200) {
        setShowPurchaseModal(true);
      } else {
        setShowGameOverModal(true);
      }
    } else {
      setPlayer(INITIAL_PLAYER);
      toast('¡Cuidado! Has perdido una vida.', { icon: '⚠️' });
    }
  };

  const handleTimeOut = () => {
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      if (userData.game.totalScore >= 200) {
        setShowPurchaseModal(true);
      } else {
        setShowGameOverModal(true);
      }
    } else {
      setTimeRemaining(LEVELS[currentLevel].timeLimit);
      toast('¡Tiempo agotado! Has perdido una vida.', { icon: '⏱️' });
    }
  };

  const handlePurchaseLife = () => {
    loadUserData();
    setShowPurchaseModal(false);
    setPlayer(INITIAL_PLAYER);
    setTimeRemaining(LEVELS[currentLevel].timeLimit);
  };

  const handleClosePurchaseModal = () => {
    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    setUserData(data);

    if (data.game.totalLives < 1) {
      setShowGameOverModal(true);
    }

    setShowPurchaseModal(false);
  };

  const handleQuizAnswer = (answer: boolean) => {
    if (!currentQuestion) return;

    const isCorrect = currentQuestion.answer === answer;
    // Se calcula acá, no en el modal: `answeredQuestions` recién se
    // actualiza abajo (y de forma asíncrona), así que hay que decidir con
    // el valor que va a terminar teniendo, antes de que cambie.
    const levelComplete = isCorrect && answeredQuestions + 1 >= LEVELS[currentLevel].quizRequired;

    if (isCorrect) {
      setSessionScore(prev => prev + currentQuestion.points);
      setAnsweredQuestions(prev => prev + 1);
    }

    // Antes esto se avisaba con un toast chico y el juego seguía corriendo
    // en el momento. Ahora se pausa (mismo mecanismo que la pregunta) y se
    // muestra en un modal, para que se pueda leer sin que el tiempo o los
    // fantasmas sigan andando de fondo.
    setAnswerResult({ correct: isCorrect, points: currentQuestion.points, levelComplete });
    setShowQuestion(false);
    setCurrentQuestion(null);
  };

  const handleAnswerResultAccept = () => {
    const shouldAdvance = answerResult?.levelComplete ?? false;
    setAnswerResult(null);
    if (shouldAdvance) {
      advanceLevel();
    }
  };

  // El modal de correcto/incorrecto no pide click — es solo feedback
  // rápido, así que se cierra solo a los 2 segundos.
  useEffect(() => {
    if (!answerResult) return;
    const timer = setTimeout(() => {
      handleAnswerResultAccept();
    }, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerResult]);

  const advanceLevel = () => {
    if (currentLevel < LEVELS.length - 1) {
      setLevelTransition(true);
      setTimeout(() => {
        setCurrentLevel(prev => prev + 1);
        resetLevel();
        setLevelTransition(false);
      }, 2000);
    } else {
      setGameOver(true);
      toast.success('¡Victoria total! Completaste todos los niveles.', { duration: 3000 });
    }
  };

  /**
   * Reiniciar acá solo tiene sentido después de un Game Over real o de una
   * victoria — nunca es un atajo disponible en cualquier momento. Aun así,
   * antes ponía `lives` en 3, y eso reescribía las vidas COMPARTIDAS de
   * toda la cuenta a través del efecto de guardado — un jugador podía
   * perder a propósito y reiniciar para "recargar" vidas gratis, sin pasar
   * nunca por el modal de compra. Ahora reinicia solo el estado de esta
   * partida; las vidas quedan como estén en la cuenta.
   */
  const resetGame = () => {
    setCurrentLevel(0);
    setPlayer(INITIAL_PLAYER);
    setGhosts(INITIAL_GHOSTS);
    setDots(getInitialDots());
    setGameOver(false);
    setShowGameOverModal(false);
    setDirection('right');
    setQuizItems(INITIAL_QUIZ_POSITIONS);
    setAnsweredQuestions(0);
    setSessionScore(0);
    setCurrentQuestion(null);
    setAnswerOptions([]);
    setShowQuestion(false);
    loadUserData();
    toast.success('¡Nuevo juego! Buena suerte.');
  };

  const resetLevel = () => {
    setPlayer(INITIAL_PLAYER);
    setGhosts(INITIAL_GHOSTS);
    setDots(getInitialDots());
    setQuizItems(INITIAL_QUIZ_POSITIONS);
    setAnsweredQuestions(0);
    setDirection('right');
    setTimeRemaining(LEVELS[currentLevel].timeLimit);
    setCurrentQuestion(null);
    setAnswerOptions([]);
    setShowQuestion(false);
  };

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventDefault, { passive: false });
    document.addEventListener('touchmove', preventDefault, { passive: false });
    return () => {
      document.removeEventListener('touchstart', preventDefault);
      document.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900 pb-safe">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-8">
        <GameStatusBar
          title="DataMuncher"
          score={score}
          lives={lives}
          level={currentLevel + 1}
          timeLeft={timeRemaining}
        />

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-2 sm:p-6 mb-3 sm:mb-6">
          <div className="w-full mx-auto">
            <div className="aspect-square w-full max-w-[min(100%,600px)] mx-auto">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  {effect.text && (
                    <div
                      className="absolute text-yellow-500 font-bold text-2xl transform -translate-x-1/2 -translate-y-1/2 rotate-12 animate-bounce z-10"
                      style={{
                        left: `${(effect.x * 32) + 10}px`,
                        top: `${(effect.y * 32) + 10}px`,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                      }}
                    >
                      {effect.text}
                    </div>
                  )}

                  <div className={`grid gap-0 bg-gradient-to-br ${LEVELS[currentLevel].boardBackground} p-4 rounded-xl border border-gray-200`}>
                    {Array.from({ length: GRID_SIZE }).map((_, y) => (
                      <div key={y} className="flex">
                        {Array.from({ length: GRID_SIZE }).map((_, x) => {
                          const isWall = LEVELS[currentLevel].walls.some(([wx, wy]) => wx === x && wy === y);
                          const isPlayer = player.x === x && player.y === y;
                          const isGhost = ghosts.some(ghost => ghost.x === x && ghost.y === y);
                          const ghostIndex = ghosts.findIndex(ghost => ghost.x === x && ghost.y === y);
                          const isQuiz = quizItems.some(item => item.x === x && item.y === y);
                          const isDot = dots[y][x];
                          const answerOption = answerOptions.find(opt => opt.position.x === x && opt.position.y === y);

                          return (
                            <GameCell
                              key={`${x}-${y}`}
                              x={x}
                              y={y}
                              isWall={isWall}
                              isPlayer={isPlayer}
                              isGhost={isGhost}
                              ghostIndex={ghostIndex}
                              isQuiz={isQuiz}
                              isDot={isDot}
                              direction={direction}
                              answerOption={answerOption}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-3 sm:p-6 sticky bottom-2 sm:static">
          <h3 className="text-sm sm:text-base font-semibold text-ink mb-2 sm:mb-4 hidden sm:block">
            Controles
          </h3>
          <TouchControls onMove={handleMove} />
          <p className="text-xs sm:text-sm text-ink/40 text-center mt-2 sm:mt-4 hidden sm:block">
            Usa las flechas del teclado o los botones táctiles para moverte
          </p>
        </div>

        {levelTransition && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <LevelTransitionModal currentLevel={currentLevel} />
          </div>
        )}

        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={handleClosePurchaseModal}
          onPurchase={handlePurchaseLife}
        />

        {showGameOverModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <GameOverModal
              onRestart={resetGame}
              isComplete={currentLevel === LEVELS.length - 1}
            />
          </div>
        )}

        {showInstructions && (
          <InstructionsModal onAccept={() => setShowInstructions(false)} />
        )}

        {showQuestion && currentQuestion && (
          <QuestionModal
            question={currentQuestion.question}
            onAccept={() => setShowQuestion(false)}
          />
        )}

        {answerResult && (
          <AnswerResultModal
            correct={answerResult.correct}
            points={answerResult.points}
          />
        )}
      </div>
    </div>
  );
};

export default DataMuncher;