"use client"
import React, { useState, useEffect } from 'react';
import { Feedback } from './Feedback';
import { TextDisplay } from './TextDisplay';
import { WordPool } from './WordPool';
import { GameControls } from './GameControls';
import { processText, createWordsForLevel } from '../utils/gameUtils';
import { GameLevel, Word, Blank, Lesson } from './types';
import { gameLevels } from '../data/gameLevels';
import GameStatusBar from '@/components/GameStatusBar';  
import PurchaseModal from '@/components/PurchaseModal';

interface WordDragGameProps {
  lessonTitle: string;
}

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

const WordDragGame: React.FC<WordDragGameProps> = ({ lessonTitle }) => {
  // Game state
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [textParts, setTextParts] = useState<string[]>([]);
  const [currentLessonData, setCurrentLessonData] = useState<GameLevel | null>(null);
  
  // UI state
  const [isClient, setIsClient] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Drag and touch state
  const [draggedWord, setDraggedWord] = useState<Word | null>(null);
  const [draggedBlankId, setDraggedBlankId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedBlankId, setSelectedBlankId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchTarget, setLastTouchTarget] = useState<Element | null>(null);

  // UserData state
  const [userData, setUserData] = useState<UserData | null>(null);
  const [sessionScore, setSessionScore] = useState(0);

  // Constants
  const CORRECT_ANSWER_POINTS = 100;
  const INCORRECT_ANSWER_PENALTY = 50;
  const ACTIVITY_ID = `word_drag_${lessonTitle.toLowerCase().replace(/\s+/g, '_')}`;
  
  // Cargar datos del usuario al inicio
  useEffect(() => {
    loadUserData();
  }, []);

  // Guardar datos cuando cambian sessionScore, lives o isGameOver
  useEffect(() => {
    if (userData) {
      saveUserData();
    }
  }, [sessionScore, lives, isGameOver, isLevelComplete]);

  const loadUserData = () => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const data: UserData = JSON.parse(storedData);
        setUserData(data);
        
        // Establecer el score total inicial
        setScore(data.game.totalScore);
        setLives(data.game.totalLives);
        
        // Actualizar última visita a esta actividad
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
          completedActivities: isLevelComplete && currentLessonData && currentLevel === currentLessonData.lecciones.length - 1
            ? Array.from(new Set([...userData.progress.completedActivities, ACTIVITY_ID]))
            : userData.progress.completedActivities
        }
      };

      // Actualizar score total para el GameStatusBar
      setScore(updatedData.game.totalScore);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      setUserData(updatedData);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };
  
  // Initialize game
  useEffect(() => {
    setIsClient(true);
    const lessonData = gameLevels.find(level => level.title === lessonTitle);
    if (lessonData) {
      setCurrentLessonData(lessonData);
      initializeLevel(0, lessonData.lecciones);
    }
  }, [lessonTitle]);

  const initializeLevel = (level: number, lessons: Lesson[]) => {
    if (!lessons[level]) return;
    
    const { blanks: newBlanks, textParts: newTextParts, correctWords } = processText(lessons[level].text);
    const newWords = createWordsForLevel(correctWords, lessons[level].extraWords);
    
    setBlanks(newBlanks);
    setWords(newWords);
    setTextParts(newTextParts);
    setShowFeedback(false);
    setFeedbackMessage('');
    setIsLevelComplete(false);
    clearDragStates();
  };

  const handlePurchaseLife = () => {
    // El PurchaseModal ya maneja la compra y actualiza UserData
    // Solo necesitamos recargar los datos y continuar el juego
    loadUserData();
    setShowPurchaseModal(false);
    if (isGameOver) {
      setIsGameOver(false);
      if (currentLessonData) {
        initializeLevel(currentLevel, currentLessonData.lecciones);
      }
    }
  };

  const handleClosePurchaseModal = () => {
    // Recargar datos por si se hizo una compra
    loadUserData();
    
    // Si después de intentar comprar sigue sin vidas, mantener game over
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
      const data: UserData = JSON.parse(storedData);
      if (data.game.totalLives < 1) {
        setIsGameOver(true);
      }
    }
    
    setShowPurchaseModal(false);
  };

  const handleIncorrectAnswer = () => {
    setLives(prevLives => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        setIsGameOver(true);
        if (userData && userData.game.totalScore >= 200) {
          setShowPurchaseModal(true);
        }
        return 0;
      }
      return newLives;
    });
    setSessionScore(prevScore => Math.max(0, prevScore - INCORRECT_ANSWER_PENALTY));
  };

  const clearDragStates = () => {
    setDraggedWord(null);
    setDraggedBlankId(null);
    setSelectedWord(null);
    setSelectedBlankId(null);
    setIsDragging(false);
    setLastTouchTarget(null);
  };

  // Touch event handlers
  const handleTouchStart = (
    e: React.TouchEvent,
    word: Word | null,
    blankId?: string
  ) => {
    if (isGameOver) return;
    e.preventDefault();
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
    setTouchStartY(touch.clientY);
    setSelectedWord(word);
    setSelectedBlankId(blankId || null);
    setIsDragging(true);
    setLastTouchTarget(e.currentTarget);

    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('touching');
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isGameOver) return;
    e.preventDefault();

    const touch = e.touches[0];
    document.querySelectorAll('.drag-over').forEach(el => 
      el.classList.remove('drag-over')
    );

    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const targetElement = elements.find(element => 
      element.getAttribute('data-blank-id') || 
      element.getAttribute('data-word-pool')
    );

    if (targetElement) {
      targetElement.classList.add('drag-over');
      setLastTouchTarget(targetElement);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isGameOver) return;
    e.preventDefault();
    if (!isDragging) return;

    if (lastTouchTarget) {
      const blankId = lastTouchTarget.getAttribute('data-blank-id');
      const isWordPool = lastTouchTarget.getAttribute('data-word-pool');

      if (blankId) {
        handleDrop(blankId);
      } else if (isWordPool) {
        handleDropToPool();
      }
    }

    document.querySelectorAll('.touching, .drag-over').forEach(element => {
      element.classList.remove('touching', 'drag-over');
    });
    clearDragStates();
  };

  // Drag event handlers
  const handleDragStart = (word: Word | null, blankId?: string) => {
    if (isGameOver) return;
    setDraggedWord(word);
    setDraggedBlankId(blankId || null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (isGameOver) return;
    e.preventDefault();
  };

  const handleDrop = (targetBlankId: string) => {
    if (isGameOver) return;
    const wordToMove = draggedWord || selectedWord;
    if (!wordToMove) return;

    const targetBlank = blanks.find(blank => blank.id === targetBlankId);
    if (!targetBlank) return;

    if (targetBlank.filledWord && targetBlank.filledWordId) {
      const wordToReturn: Word = {
        id: targetBlank.filledWordId,
        text: targetBlank.filledWord,
        isCorrect: targetBlank.filledWord === targetBlank.correctWord
      };
      setWords(prevWords => [...prevWords, wordToReturn]);
    }

    const sourceBlankId = draggedBlankId || selectedBlankId;
    if (sourceBlankId) {
      setBlanks(prevBlanks => prevBlanks.map(blank => 
        blank.id === sourceBlankId 
          ? { ...blank, filledWord: undefined, filledWordId: undefined }
          : blank
      ));
    } else {
      setWords(prevWords => prevWords.filter(word => word.id !== wordToMove.id));
    }

    setBlanks(prevBlanks => prevBlanks.map(blank => 
      blank.id === targetBlankId 
        ? { ...blank, filledWord: wordToMove.text, filledWordId: wordToMove.id }
        : blank
    ));

    clearDragStates();
    setShowFeedback(false);
  };

  const handleDropToPool = () => {
    if (isGameOver) return;
    const wordToReturn = draggedWord || selectedWord;
    const sourceBlankId = draggedBlankId || selectedBlankId;  
    if (!wordToReturn || !sourceBlankId) return;
    setWords(prevWords => [...prevWords, wordToReturn]);
    setBlanks(prevBlanks => prevBlanks.map(blank => 
      blank.id === sourceBlankId 
        ? { ...blank, filledWord: undefined, filledWordId: undefined }
        : blank
    ));

    clearDragStates();
    setShowFeedback(false);
  };

  const checkAnswers = () => {
    if (isGameOver) return;
    setShowFeedback(true);
    const allBlanksFilledCorrectly = blanks.every(
      blank => blank.filledWord === blank.correctWord
    );

    if (allBlanksFilledCorrectly) {
      setFeedbackMessage('¡Correcto! ¡Muy bien!');
      setIsLevelComplete(true);
      setSessionScore(prevScore => prevScore + CORRECT_ANSWER_POINTS);
      
      if (currentLessonData && currentLevel < currentLessonData.lecciones.length - 1) {
        setTimeout(handleNextLevel, 2000);
      }
    } else {
      const correctCount = blanks.filter(
        blank => blank.filledWord === blank.correctWord
      ).length;
      setFeedbackMessage(`Tienes ${correctCount} de ${blanks.length} palabras correctas. ¡Sigue intentando!`);
      handleIncorrectAnswer();
    }
  };

  const handleNextLevel = () => {
    if (isGameOver) return;
    if (currentLessonData && currentLevel < currentLessonData.lecciones.length - 1) {
      setCurrentLevel(prevLevel => {
        const newLevel = prevLevel + 1;
        initializeLevel(newLevel, currentLessonData.lecciones);
        return newLevel;
      });
    }
  };

  const resetGame = () => {
    setCurrentLevel(0);
    setSessionScore(0);
    setLives(3);
    setIsGameOver(false);
    if (currentLessonData) {
      initializeLevel(0, currentLessonData.lecciones);
    }
  };

  if (!isClient || !currentLessonData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">

          <div className="p-6">
            <GameStatusBar 
              title={currentLessonData.title}
              score={score}
              lives={lives}
              level={currentLevel + 1}
            />
          </div>


        {isGameOver ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-3xl font-medium text-gray-800 mb-3">¡Game Over!</h2>
              <p className="text-gray-600 mb-8">Te has quedado sin vidas. ¿Quieres comprar una vida extra para continuar?</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowPurchaseModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  Comprar Vida Extra
                </button>
                <button 
                  onClick={resetGame}
                  className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Reiniciar Juego
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Feedback */}
            {showFeedback && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <Feedback 
                  message={feedbackMessage}
                  isComplete={isLevelComplete}
                  show={showFeedback}
                />
              </div>
            )}

            {/* Text Display - Tarjeta principal */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <TextDisplay 
                textParts={textParts}
                blanks={blanks}
                onDragStart={handleDragStart}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDrop={handleDrop}
                handleDragOver={handleDragOver}
                isDragging={isDragging}
              />
            </div>

            {/* Word Pool */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Palabras disponibles</h3>
              <WordPool 
                words={words}
                onDragStart={handleDragStart}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDrop={handleDropToPool}
                handleDragOver={handleDragOver}
                isDragging={isDragging}
              />
            </div>

            {/* Game Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <GameControls 
                onReset={resetGame}
                onCheck={checkAnswers}
                isComplete={isLevelComplete}
                isLastLevel={currentLevel === currentLessonData.lecciones.length - 1}
                onNext={handleNextLevel}
                onBuyLife={() => setShowPurchaseModal(true)}
              />
            </div>
          </div>
        )}

        {/* Modal de compra de vidas */}
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={handleClosePurchaseModal}
          onPurchase={handlePurchaseLife}
        />
      </div>

      <style jsx global>{`
        .touching {
          opacity: 0.7;
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        .drag-over {
          background-color: rgba(59, 130, 246, 0.1);
          border-radius: 8px;
          transition: background-color 0.2s ease;
        }
        [data-blank-id], [data-word-pool] {
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
        }
      `}</style>
    </div>
  );
};

export default WordDragGame;