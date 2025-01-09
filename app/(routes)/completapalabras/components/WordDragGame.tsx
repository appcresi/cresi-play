"use client"
import React, { useState, useEffect } from 'react';
import { GameHeader } from './GameHeader';
import { Feedback } from './Feedback';
import { TextDisplay } from './TextDisplay';
import { WordPool } from './WordPool';
import { GameControls } from './GameControls';
import { processText, createWordsForLevel } from '../utils/gameUtils';
import { GameLevel, Word, Blank, Lesson } from './types';
import { gameLevels } from '../data/gameLevels';

interface WordDragGameProps {
  lessonTitle: string;
}

const WordDragGame: React.FC<WordDragGameProps> = ({ lessonTitle }) => {
  // Game state
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [textParts, setTextParts] = useState<string[]>([]);
  const [currentLessonData, setCurrentLessonData] = useState<GameLevel | null>(null);
  
  // UI state
  const [isClient, setIsClient] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  // Drag and touch state
  const [draggedWord, setDraggedWord] = useState<Word | null>(null);
  const [draggedBlankId, setDraggedBlankId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedBlankId, setSelectedBlankId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchTarget, setLastTouchTarget] = useState<Element | null>(null);

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
    if (!isDragging) return;
    e.preventDefault();

    const touch = e.touches[0];
    // Remove previous drag-over states
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

    // Clean up
    document.querySelectorAll('.touching, .drag-over').forEach(element => {
      element.classList.remove('touching', 'drag-over');
    });
    clearDragStates();
  };

  // Drag event handlers
  const handleDragStart = (word: Word | null, blankId?: string) => {
    setDraggedWord(word);
    setDraggedBlankId(blankId || null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetBlankId: string) => {
    const wordToMove = draggedWord || selectedWord;
    if (!wordToMove) return;

    const targetBlank = blanks.find(blank => blank.id === targetBlankId);
    if (!targetBlank) return;

    // Handle word that was in the target blank
    if (targetBlank.filledWord && targetBlank.filledWordId) {
      const wordToReturn: Word = {
        id: targetBlank.filledWordId,
        text: targetBlank.filledWord,
        isCorrect: targetBlank.filledWord === targetBlank.correctWord
      };
      setWords(prevWords => [...prevWords, wordToReturn]);
    }

    // Handle word coming from another blank
    const sourceBlankId = draggedBlankId || selectedBlankId;
    if (sourceBlankId) {
      setBlanks(prevBlanks => prevBlanks.map(blank => 
        blank.id === sourceBlankId 
          ? { ...blank, filledWord: undefined, filledWordId: undefined }
          : blank
      ));
    } else {
      // Remove word from pool
      setWords(prevWords => prevWords.filter(word => word.id !== wordToMove.id));
    }

    // Place word in new blank
    setBlanks(prevBlanks => prevBlanks.map(blank => 
      blank.id === targetBlankId 
        ? { ...blank, filledWord: wordToMove.text, filledWordId: wordToMove.id }
        : blank
    ));

    clearDragStates();
    setShowFeedback(false);
  };

  const handleDropToPool = () => {
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

  // Game logic handlers
  const checkAnswers = () => {
    setShowFeedback(true);
    const allBlanksFilledCorrectly = blanks.every(
      blank => blank.filledWord === blank.correctWord
    );

    if (allBlanksFilledCorrectly) {
      setFeedbackMessage('¡Correcto! ¡Muy bien!');
      setIsLevelComplete(true);
      setScore(prevScore => prevScore + 100);
      
      if (currentLessonData && currentLevel < currentLessonData.lecciones.length - 1) {
        setTimeout(handleNextLevel, 2000);
      }
    } else {
      const correctCount = blanks.filter(
        blank => blank.filledWord === blank.correctWord
      ).length;
      setFeedbackMessage(`Tienes ${correctCount} de ${blanks.length} palabras correctas. ¡Sigue intentando!`);
    }
  };

  const handleNextLevel = () => {
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
    if (currentLessonData) {
      initializeLevel(0, currentLessonData.lecciones);
    }
  };

  if (!isClient || !currentLessonData) {
    return <div className="p-6 max-w-2xl mx-auto">Cargando...</div>;
  }

  return (
    <div className="p-1 max-w-4xl mx-auto">
      <GameHeader 
        title={currentLessonData.title}
        currentLevel={currentLevel + 1}
        totalLevels={currentLessonData.lecciones.length}
        score={score}
      />

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