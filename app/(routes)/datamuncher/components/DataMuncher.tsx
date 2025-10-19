"use client"
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import GameStatusBar from '@/components/GameStatusBar';
import GameCell from './GameCell';
import GameOverModal from './GameOverModal';
import LevelTransitionModal from './LevelTransitionModal';
import TouchControls from './TouchControls';
import PurchaseModal from '@/components/PurchaseModal';
import { Position, Question, Effect, AnswerOption } from '../types/types';
import {
  GRID_SIZE,
  INITIAL_PLAYER,
  INITIAL_GHOSTS,
  INITIAL_LIVES,
  INITIAL_QUIZ_POSITIONS,
  LEVELS
} from '../types/constants';

interface MoodEntry {
  date: string;
  mood: number;
  label: string;
  intensity: number;
  note?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  date?: string;
}

interface UserData {
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
    history: MoodEntry[];
    lastEntry: MoodEntry | null;
  };
  achievements: Achievement[];
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark';
    language: 'es' | 'en';
  };
}

const STORAGE_KEY = 'cresi_user_data';
const ACTIVITY_ID = 'Datamuncher';

const DataMuncher = () => {
  // Estados del juego
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
  const [timeRemaining, setTimeRemaining] = useState(LEVELS[0].timeLimit);
  const [answerOptions, setAnswerOptions] = useState<AnswerOption[]>([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  
  // Cargar userData
  useEffect(() => {
    loadUserData();
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    if (userData) {
      saveUserData();
    }
  }, [sessionScore, lives, gameOver]);

  const loadUserData = () => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: UserData = JSON.parse(storedData);
        setUserData(data);
        setScore(data.game.totalScore);
        setLives(data.game.totalLives);
        
        // Actualizar última visita
        data.progress.lastVisits[ACTIVITY_ID] = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveUserData = () => {
    if (!userData) return;

    try {
      const isComplete = currentLevel === LEVELS.length - 1 && gameOver;
      
      const updatedData: UserData = {
        ...userData,
        game: {
          ...userData.game,
          totalScore: userData.game.totalScore + sessionScore,
          totalLives: lives
        },
        progress: {
          ...userData.progress,
          activityScores: {
            ...userData.progress.activityScores,
            [ACTIVITY_ID]: Math.max(
              userData.progress.activityScores[ACTIVITY_ID] || 0,
              sessionScore
            )
          },
          activityTimes: {
            ...userData.progress.activityTimes,
            [ACTIVITY_ID]: new Date().toISOString()
          },
          completedActivities: isComplete
            ? Array.from(new Set([...userData.progress.completedActivities, ACTIVITY_ID]))
            : userData.progress.completedActivities
        }
      };

      setScore(updatedData.game.totalScore);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setUserData(updatedData);
    } catch (error) {
      console.error('Error saving user data:', error);
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

  // Manejo del temporizador
  useEffect(() => {
    if (gameOver || showQuestion || levelTransition) return;
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
  }, [gameOver, showQuestion, levelTransition]);

  // Movimiento de fantasmas
  useEffect(() => {
    if (gameOver || showQuestion || levelTransition) return;

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
  }, [gameOver, showQuestion, levelTransition, currentLevel]);

  const handleMove = (direction: string) => {
    if (gameOver || showQuestion || levelTransition) return;

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

  // Efecto para el control del teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      handleMove(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, gameOver, showQuestion, levelTransition]);
  
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
      if (userData && userData.game.totalScore >= 200) {
        setShowPurchaseModal(true);
      } else {
        setShowGameOverModal(true);
      }
    } else {
      setPlayer(INITIAL_PLAYER);
      Swal.fire({
        icon: "warning",
        title: "¡Cuidado!",
        text: "¡Has perdido una vida!",
        showConfirmButton: false,
        timer: 1000
      });
    }
  };

  const handleTimeOut = () => {
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      if (userData && userData.game.totalScore >= 200) {
        setShowPurchaseModal(true);
      } else {
        setShowGameOverModal(true);
      }
    } else {
      setTimeRemaining(LEVELS[currentLevel].timeLimit);
      Swal.fire({
        icon: "warning",
        title: "¡Tiempo agotado!",
        text: "¡Has perdido una vida!",
        showConfirmButton: false,
        timer: 1000
      });
    }
  };

  const handlePurchaseLife = () => {
    loadUserData();
    setShowPurchaseModal(false);
    setPlayer(INITIAL_PLAYER);
    setTimeRemaining(LEVELS[currentLevel].timeLimit);
  };
  
  const handleClosePurchaseModal = () => {
    loadUserData();
    
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const data: UserData = JSON.parse(storedData);
      if (data.game.totalLives < 1) {
        setShowGameOverModal(true);
      }
    }
    
    setShowPurchaseModal(false);
  };

  const handleQuizAnswer = (answer: boolean) => {
    if (!currentQuestion) return;

    if (currentQuestion.answer === answer) {
      setSessionScore(prev => prev + currentQuestion.points);
      setAnsweredQuestions(prev => prev + 1);
      Swal.fire({
        icon: "success",
        title: "¡Correcto!",
        text: `¡Has ganado ${currentQuestion.points} puntos!`,
        showConfirmButton: false,
        timer: 1000
      });
      
      if (answeredQuestions + 1 >= LEVELS[currentLevel].quizRequired) {
        advanceLevel();
      }
    } else {
      Swal.fire({
        icon: "error",
        title: "¡Incorrecto!",
        text: "¡Inténtalo de nuevo!",
        showConfirmButton: false,
        timer: 1000
      });
    }
    
    setShowQuestion(false);
    setCurrentQuestion(null);
  };

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
      Swal.fire({
        icon: "success",
        title: "¡VICTORIA TOTAL!",
        text: "¡Has completado todos los niveles!",
        showConfirmButton: true
      });
    }
  };

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
    setLives(3);
    setCurrentQuestion(null);
    setAnswerOptions([]);
    setShowQuestion(false);
    Swal.fire({
      icon: "success",
      title: "¡NUEVO JUEGO!",
      text: "¡Buena suerte!",
      showConfirmButton: false,
      timer: 1000
    });
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

  // Prevenir zoom en dispositivos móviles
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
    <div className="min-h-screen bg-gray-50 pb-safe">
      <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-8">
        {/* Header Card - Compacto en móvil */}
          <GameStatusBar
            title="DataMuncher"
            score={score}
            lives={lives}
            level={currentLevel + 1}
            timeLeft={timeRemaining}
          />

        {/* Game Board Card - Ocupa todo el ancho disponible en móvil */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-6 mb-3 sm:mb-6">
          <div className="w-full mx-auto">
            <div className="aspect-square w-full max-w-[min(100%,600px)] mx-auto">
              {/* GameBoard incorporado directamente */}
              <div className="max-w-4xl mx-auto">
                {/* Pregunta actual - Card estilo Classroom */}
                {currentQuestion ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                        ?
                      </div>
                      <div className="flex-1">
                        <h2 className="text-base font-medium text-gray-800 mb-2">Pregunta actual</h2>
                        <p className="text-sm text-gray-700 leading-relaxed">{currentQuestion.question}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 p-6">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium flex-shrink-0">
                        ℹ
                      </div>
                      <div className="flex-1">
                        <h2 className="text-base font-medium text-gray-800 mb-2">Instrucciones</h2>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          Busca las ❓ y luego dirígete hacia la ✅ si es Verdadera o hacia la ❌ si es Falsa
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tablero de juego - Card estilo Classroom */}
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

                    <div className={`grid gap-0 bg-gradient-to-br ${LEVELS[currentLevel].boardBackground} p-4 rounded-lg border border-gray-300`}>
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

        {/* Controls Card - Sticky en la parte inferior en móvil */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-6 sticky bottom-2 sm:static">
          <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2 sm:mb-4 hidden sm:block">
            Controles
          </h3>
          <TouchControls onMove={handleMove} />
          <p className="text-xs sm:text-sm text-gray-500 text-center mt-2 sm:mt-4 hidden sm:block">
            Usa las flechas del teclado o los botones táctiles para moverte
          </p>
        </div>

        {/* Modals */}
        {levelTransition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <LevelTransitionModal currentLevel={currentLevel} />
          </div>
        )}

        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={handleClosePurchaseModal}
          onPurchase={handlePurchaseLife}
        />

        {showGameOverModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <GameOverModal
              onRestart={resetGame}
              isComplete={currentLevel === LEVELS.length - 1}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DataMuncher;