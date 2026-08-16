"use client"
import React, { useState, useEffect } from 'react';
import { IconX } from '@tabler/icons-react';
import { Feedback } from './Feedback';
import { TextDisplay } from './TextDisplay';
import { WordPool } from './WordPool';
import { GameControls } from './GameControls';
import { processText, createWordsForLevel } from '../utils/gameUtils';
import { GameLevel, Word, Blank, Lesson } from './types';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import GameStatusBar from '@/components/GameStatusBar';
import PurchaseModal from '@/components/PurchaseModal';
import UserDataManager from '@/lib/userDataManager';
import { getActivityById } from '@/lib/activities';

interface WordDragGameProps {
  /** ID del documento en Firestore (colección `completapalabras`), no el
   *  título — antes se pasaba el título directo y se buscaba en un array
   *  hardcodeado; ahora el contenido vive en Firestore (CrESI o docentes),
   *  así que hace falta el ID para poder traer el documento correcto. */
  lessonId: string;
}

// El catálogo llama a esta actividad "Completa Palabras" en general — pero
// acá adentro hay varias lecciones distintas (Pubertad, Sexualidad, etc.),
// cada una con su propio progreso. Guardamos las dos cosas: una clave POR
// LECCIÓN (para el selector de lecciones) y el título general (para que el
// resto de la app — Features, ClassroomDesk — reconozca la actividad como
// completada apenas se termine cualquiera de las lecciones).
//
// La clave de progreso sigue basándose en el TÍTULO de la lección (no en
// el ID de Firestore) a propósito: así el progreso que ya tenían guardado
// los alumnos con las 4 lecciones originales de CrESI (Pubertad,
// Sexualidad...) se sigue reconociendo igual, sin resetear a 0% por este
// cambio.
const ACTIVITY = getActivityById('completa');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Completa Palabras';
const ACCENT = ACTIVITY?.color ?? '#7B1FA2';

const CORRECT_ANSWER_POINTS = 100;
const INCORRECT_ANSWER_PENALTY = 50;

/** Clave de progreso específica de esta lección (no del catálogo general). */
export function lessonProgressKey(lessonTitle: string): string {
  return `${ACTIVITY_TITLE}-${lessonTitle}`;
}

const WordDragGame: React.FC<WordDragGameProps> = ({ lessonId }) => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isLevelComplete, setIsLevelComplete] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [blanks, setBlanks] = useState<Blank[]>([]);
  const [textParts, setTextParts] = useState<string[]>([]);
  const [currentLessonData, setCurrentLessonData] = useState<GameLevel | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [isClient, setIsClient] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const [draggedWord, setDraggedWord] = useState<Word | null>(null);
  const [draggedBlankId, setDraggedBlankId] = useState<string | null>(null);
  const [touchStartX, setTouchStartX] = useState<number>(0);
  const [touchStartY, setTouchStartY] = useState<number>(0);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [selectedBlankId, setSelectedBlankId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouchTarget, setLastTouchTarget] = useState<Element | null>(null);

  const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
  const [hasLoaded, setHasLoaded] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);

  // Antes esto se calculaba de entrada, porque el título venía como prop.
  // Ahora hay que esperar a que la lección termine de cargar desde
  // Firestore, así que puede ser null momentáneamente.
  const LESSON_KEY = currentLessonData ? lessonProgressKey(currentLessonData.title) : null;

  useEffect(() => {
    setIsClient(true);
    fetchLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  const fetchLesson = async () => {
    try {
      const snap = await getDoc(doc(db, 'completapalabras', lessonId));
      if (!snap.exists()) {
        console.error('❌ No se encontró la lección de Completa Palabras:', lessonId);
        setLoadError(true);
        return;
      }
      const data = snap.data() as { title: string; lecciones: Lesson[] };
      const lessonData: GameLevel = { title: data.title, lecciones: data.lecciones };
      setCurrentLessonData(lessonData);
      initializeLevel(0, lessonData.lecciones);
    } catch (err) {
      console.error('❌ Error cargando la lección de Completa Palabras:', err);
      setLoadError(true);
    }
  };

  // Recién cargamos los datos del usuario (y registramos la visita) una
  // vez que sabemos el título real de la lección — antes de eso no
  // tenemos la clave de progreso correcta.
  useEffect(() => {
    if (LESSON_KEY) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [LESSON_KEY]);

  useEffect(() => {
    if (hasLoaded) {
      saveUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionScore, lives, isGameOver, isLevelComplete]);

  const loadUserData = () => {
    if (!LESSON_KEY) return;
    const data = UserDataManager.loadUserData();
    setUserData(data);
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    UserDataManager.visitActivity(LESSON_KEY);
    setHasLoaded(true);
  };

  const saveUserData = () => {
    if (!LESSON_KEY) return;
    const current = UserDataManager.loadUserData();
    const finishedLesson =
      isLevelComplete && currentLessonData && currentLevel === currentLessonData.lecciones.length - 1;

    const lessonPercent = currentLessonData
      ? Math.round(((finishedLesson ? currentLevel + 1 : currentLevel) / currentLessonData.lecciones.length) * 100)
      : 0;

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
          [LESSON_KEY]: Math.max(current.progress.activityScores[LESSON_KEY] || 0, lessonPercent),
          ...(finishedLesson
            ? { [ACTIVITY_TITLE]: Math.max(current.progress.activityScores[ACTIVITY_TITLE] || 0, sessionScore) }
            : {})
        },
        activityTimes: {
          ...current.progress.activityTimes,
          [LESSON_KEY]: new Date().toISOString(),
          ...(finishedLesson ? { [ACTIVITY_TITLE]: new Date().toISOString() } : {})
        },
        completedActivities: finishedLesson
          ? Array.from(new Set([...current.progress.completedActivities, LESSON_KEY, ACTIVITY_TITLE]))
          : current.progress.completedActivities
      }
    };

    setScore(updatedData.game.totalScore);
    UserDataManager.saveUserData(updatedData);
    setUserData(updatedData);
  };

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
    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
    setUserData(data);

    if (data.game.totalLives < 1) {
      setIsGameOver(true);
    }

    setShowPurchaseModal(false);
  };

  const handleIncorrectAnswer = () => {
    setLives(prevLives => {
      const newLives = prevLives - 1;
      if (newLives <= 0) {
        setIsGameOver(true);
        if (userData.game.totalScore >= 200) {
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

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center max-w-sm">
          <IconX className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600">No se pudo cargar esta lección. Puede que ya no exista.</p>
        </div>
      </div>
    );
  }

  if (!isClient || !currentLessonData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: ACCENT }}
          />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <GameStatusBar
            title={currentLessonData.title}
            score={score}
            lives={lives}
            level={currentLevel + 1}
          />
        </div>

        {isGameOver ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconX className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Game Over!</h2>
              <p className="text-gray-500 mb-8">Te has quedado sin vidas. ¿Quieres comprar una vida extra para continuar?</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowPurchaseModal(true)}
                  className="px-6 py-2.5 text-white rounded-full hover:opacity-90 transition-colors font-semibold shadow-sm"
                  style={{ backgroundColor: ACCENT }}
                >
                  Comprar Vida Extra
                </button>
                <button
                  onClick={resetGame}
                  className="px-6 py-2.5 bg-white text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors font-semibold"
                >
                  Reiniciar Juego
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {showFeedback && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <Feedback
                  message={feedbackMessage}
                  isComplete={isLevelComplete}
                  show={showFeedback}
                />
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
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
                accentColor={ACCENT}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <WordPool
                words={words}
                onDragStart={handleDragStart}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onDrop={handleDropToPool}
                handleDragOver={handleDragOver}
                isDragging={isDragging}
                accentColor={ACCENT}
              />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <GameControls
                onReset={resetGame}
                onCheck={checkAnswers}
                isComplete={isLevelComplete}
                isLastLevel={currentLevel === currentLessonData.lecciones.length - 1}
                onNext={handleNextLevel}
                onBuyLife={() => setShowPurchaseModal(true)}
                accentColor={ACCENT}
              />
            </div>
          </div>
        )}

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
          background-color: ${ACCENT}1A;
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