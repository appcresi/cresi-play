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

  // Constants
  const EXTRA_LIFE_COST = 200;
  const CORRECT_ANSWER_POINTS = 100;
  const INCORRECT_ANSWER_PENALTY = 50;

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
    if (score >= EXTRA_LIFE_COST) {
      setScore(prevScore => prevScore - EXTRA_LIFE_COST);
      setLives(prevLives => prevLives + 1);
      setShowPurchaseModal(false);
      if (isGameOver) {
        setIsGameOver(false);
        // Reiniciar el nivel actual en lugar de todo el juego
        if (currentLessonData) {
          initializeLevel(currentLevel, currentLessonData.lecciones);
        }
      }
    }
  };

  const handleIncorrectAnswer = () => {
    setLives(prevLives => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        setIsGameOver(true);
        setShowPurchaseModal(true);
        return 0;
      }
      return newLives;
    });
    setScore(prevScore => Math.max(0, prevScore - INCORRECT_ANSWER_PENALTY));
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
      setScore(prevScore => prevScore + CORRECT_ANSWER_POINTS);
      
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
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    if (currentLessonData) {
      initializeLevel(0, currentLessonData.lecciones);
    }
  };

  if (!isClient || !currentLessonData) {
    return <div className="p-6 max-w-2xl mx-auto">Cargando...</div>;
  }

  return (
    <div className="p-1 max-w-4xl mx-auto mt-24">
      <GameStatusBar 
        title={currentLessonData.title}
        score={score}
        lives={lives}
        level={currentLevel + 1}
      />

      {isGameOver ? (
        <div className="text-center my-8">
          <h2 className="text-2xl font-bold mb-4">¡Game Over!</h2>
          <p className="mb-4">Te has quedado sin vidas. ¿Quieres comprar una vida extra para continuar?</p>
          <button 
            onClick={() => setShowPurchaseModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 mr-4"
          >
            Comprar Vida Extra
          </button>
          <button 
            onClick={resetGame}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Reiniciar Juego
          </button>
        </div>
      ) : (
        <>
          <Feedback 
            message={feedbackMessage}
            isComplete={isLevelComplete}
            show={showFeedback}
          />

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

          <GameControls 
            onReset={resetGame}
            onCheck={checkAnswers}
            isComplete={isLevelComplete}
            isLastLevel={currentLevel === currentLessonData.lecciones.length - 1}
            onNext={handleNextLevel}
            onBuyLife={() => setShowPurchaseModal(true)}
          />
        </>
      )}

      <PurchaseModal 
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchaseLife}
        canAfford={score >= EXTRA_LIFE_COST}
        cost={EXTRA_LIFE_COST}
        itemName="vida extra"
        description="¿Comprar una vida extra?"
      />

      <style jsx global>{`
        .touching {
          opacity: 0.7;
          transform: scale(1.05);
          transition: all 0.2s ease;
        }
        .drag-over {
          background-color: rgba(0, 0, 255, 0.1);
          border-radius: 4px;
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