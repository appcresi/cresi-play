"use client"
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import GameStatusBar from '@/components/GameStatusBar';
import GameBoard from './GameBoard';
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

const LIVES_STORAGE_KEY = 'totalGameLives';
const SCORE_STORAGE_KEY = 'totalGameScore';

const DataMuncher = () => {
  // Estados del juego
  const [player, setPlayer] = useState<Position>(INITIAL_PLAYER);
  const [ghosts, setGhosts] = useState<Position[]>(INITIAL_GHOSTS);
  const [dots, setDots] = useState<boolean[][]>(getInitialDots());
  const [score, setScore] = useState(0);
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
  
  useEffect(() => {
    const storedScore = localStorage.getItem(SCORE_STORAGE_KEY);
    if (storedScore) {
      setScore(parseInt(storedScore, 10));
    }
  }, []); 
  useEffect(() => {
    const storedLives = localStorage.getItem(LIVES_STORAGE_KEY);
    if (storedLives) {
      setLives(parseInt(storedLives, 10));
    }
  }, []);

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

  useEffect(() => {
    localStorage.setItem(SCORE_STORAGE_KEY, score.toString());
  }, [score]);

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
      setScore(prev => prev + 1);
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
    localStorage.setItem(LIVES_STORAGE_KEY, newLives.toString());
    if (newLives <= 0) {
      // Cuando no hay más vidas, mostrar modal de compra
      setShowPurchaseModal(true);
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
    // Update localStorage lives
    localStorage.setItem(LIVES_STORAGE_KEY, newLives.toString());
    if (newLives <= 0) {
      // También mostrar el modal de compra cuando se agota el tiempo
      setShowPurchaseModal(true);
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
    const currentStoredLives = parseInt(localStorage.getItem(LIVES_STORAGE_KEY) || '3');
    
    if (currentStoredLives < 3) {
      setShowPurchaseModal(false);
      setPlayer(INITIAL_PLAYER);
      setTimeRemaining(LEVELS[currentLevel].timeLimit);

    }
  };
  
  const handleClosePurchaseModal = () => {
    const currentStoredScore = parseInt(localStorage.getItem(SCORE_STORAGE_KEY) || '0');
    const currentStoredLives = parseInt(localStorage.getItem(LIVES_STORAGE_KEY) || '3');
    setScore(currentStoredScore);
    setLives(currentStoredLives);
    if (currentStoredLives < 1) {
      setShowGameOverModal(true);
    }
    setShowPurchaseModal(false);
  };

  const handleQuizAnswer = (answer: boolean) => {
    if (!currentQuestion) return;

    if (currentQuestion.answer === answer) {
      setScore(prev => prev + currentQuestion.points);
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
    setLives(INITIAL_LIVES);
    setCurrentQuestion(null);  // Añadido: limpiar pregunta actual
    setAnswerOptions([]); // Añadido: limpiar opciones de respuesta
    setShowQuestion(false);  // Añadido: asegurar que no se muestre ninguna pregunta
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
    setCurrentQuestion(null);  // Añadido: limpiar pregunta actual
    setAnswerOptions([]); // Añadido: limpiar opciones de respuesta
    setShowQuestion(false);  // Añadido: asegurar que no se muestre ninguna pregunta
  };

  // Prevenir zoom en dispositivos móviles
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', preventDefault, { passive: false });
    return () => document.removeEventListener('touchstart', preventDefault);
  }, []);

 
  return (
    <div className="flex flex-col items-center justify-center bg-gradient-to-b from-blue-500 to-blue-700 p-4 transition-all duration-1000">
      <div className="w-full max-w-md md:max-w-lg relative flex flex-col gap-4">
        <GameStatusBar
          title="DataMuncher"
          score={score}
          lives={lives}
          level={currentLevel + 1}
          timeLeft={timeRemaining}
        />

        <div className="w-full aspect-square my-4">
          <GameBoard
            player={player}
            ghosts={ghosts}
            dots={dots}
            quizItems={quizItems}
            currentLevel={LEVELS[currentLevel]}
            direction={direction}
            effect={effect}
            currentQuestion={currentQuestion}
            answerOptions={answerOptions}
          />
        </div>

        <TouchControls onMove={handleMove} />

        {levelTransition && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <LevelTransitionModal currentLevel={currentLevel} />
          </div>
        )}

        {/* Modal de compra de vidas */}
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={handleClosePurchaseModal}
          onPurchase={handlePurchaseLife}
        />
        {showGameOverModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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