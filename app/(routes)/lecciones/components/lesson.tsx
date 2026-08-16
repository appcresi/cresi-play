"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import toast from 'react-hot-toast';
import ImagePopup from "./ImagePopup";
import FloatingAudioButton from "./FloatingAudioButton";
import ResultsComponent from "./ResultsComponent";
import { Question } from "./types";
import { IconCheck, IconX, IconArrowRight, IconNotes, IconTrash, IconEdit, IconPlus } from "@tabler/icons-react";
import UserDataManager from '@/lib/userDataManager';
import type { LessonNote } from '@/types/user';
import { lessons } from '../data/lessons';

type LessonPageProps = {
  title: string;
  onBack: () => void;
  onLessonComplete?: (title: string, percentage: number, correctAnswersCount: number, levelsCompleted: number) => void;
  onAnswerCorrect?: () => void;
  onLevelComplete?: () => void;
  onCorrectAnswersUpdate?: (count: number, total: number) => void;
  onLessonLevelUpdate?: (level: number) => void;
  onNoteCreated?: () => void;
};

export default function LessonPage({ title, onBack, onLessonComplete, onAnswerCorrect, onLevelComplete, onCorrectAnswersUpdate, onLessonLevelUpdate, onNoteCreated }: LessonPageProps) {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [questionsFinished, setQuestionsFinished] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const currentLesson = lessons.find((lesson) => lesson.title === title);

  // Cargar las notas de ESTA lección desde la cuenta del alumno. Antes
  // vivían solo en memoria (useState sin persistir a ningún lado) — se
  // perdían apenas se recargaba la página o se volvía a "Mis lecciones".
  useEffect(() => {
    const data = UserDataManager.loadUserData();
    setNotes((data.notes || []).filter((n) => n.lessonTitle === title));
  }, [title]);

  if (!currentLesson) {
    return <div>Lección no encontrada</div>;
  }

  const currentLeccion = currentLesson.lecciones[currentLessonIndex];
  const currentQuestion = currentLeccion.questions[currentQuestionIndex];

  useEffect(() => {
    let wordIndex = 0;
    const words = currentLeccion.text.split(" ");
    const newWords: string[] = [];
    const interval = setInterval(() => {
      if (wordIndex < words.length) {
        newWords.push(words[wordIndex]);
        setDisplayedWords([...newWords]);
        wordIndex++;
      } else {
        clearInterval(interval);
        setShowQuestions(true);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [currentLessonIndex]);

  useEffect(() => {
    if (onLessonLevelUpdate) {
      onLessonLevelUpdate(currentLessonIndex + 1);
    }
  }, [currentLessonIndex, onLessonLevelUpdate]);

  const handleAnswer = (answer: boolean) => {
    const currentQuestionWithAnswer: Question = {
      ...currentQuestion,
      userAnswer: answer
    };
    setAllQuestions(prev => [...prev, currentQuestionWithAnswer]);

    if (answer === currentQuestion.correctAnswer) {
      toast.success('¡Genial! Respuesta correcta, +100 puntos', { duration: 1200 });
      setCorrectAnswers((prev) => prev + 1);

      if (onAnswerCorrect) {
        onAnswerCorrect();
      }
    } else {
      toast.error('¡Respuesta incorrecta!', { duration: 1200 });
    }

    const newTotalAnswered = allQuestions.length + 1;
    if (onCorrectAnswersUpdate) {
      onCorrectAnswersUpdate(answer === currentQuestion.correctAnswer ? correctAnswers + 1 : correctAnswers, newTotalAnswered);
    }

    if (currentQuestionIndex < currentLeccion.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setQuestionsFinished(true);
    }
  };

  /**
   * Las notas ahora se guardan de verdad, en la cuenta del alumno (antes
   * solo vivían en el estado del componente y desaparecían al recargar).
   * Además, conectamos `onNoteCreated` — un callback que ya venía como
   * prop pero que nunca se llamaba desde ningún lado.
   */
  const handleAddNote = () => {
    if (!noteText.trim()) {
      toast.error('Escribí algo antes de guardar la nota', { duration: 1500 });
      return;
    }

    const current = UserDataManager.loadUserData();
    const allNotes = current.notes || [];
    let updatedNotes: LessonNote[];
    let isNewNote = false;

    if (editingNoteId) {
      updatedNotes = allNotes.map((note) =>
        note.id === editingNoteId
          ? { ...note, text: noteText, updatedAt: new Date().toISOString() }
          : note
      );
      setEditingNoteId(null);
    } else {
      isNewNote = true;
      const newNote: LessonNote = {
        id: `note_${Date.now()}`,
        text: noteText,
        lessonTitle: title,
        level: currentLessonIndex + 1,
        createdAt: new Date().toISOString()
      };
      updatedNotes = [...allNotes, newNote];
    }

    UserDataManager.saveUserData({ ...current, notes: updatedNotes });
    setNotes(updatedNotes.filter((n) => n.lessonTitle === title));

    if (isNewNote && onNoteCreated) {
      onNoteCreated();
    }

    setNoteText("");
    setShowNoteModal(false);
  };

  const handleEditNote = (note: LessonNote) => {
    setNoteText(note.text);
    setEditingNoteId(note.id);
    setShowNoteModal(true);
  };

  const handleDeleteNote = (noteId: string) => {
    const current = UserDataManager.loadUserData();
    const updatedNotes = (current.notes || []).filter((note) => note.id !== noteId);
    UserDataManager.saveUserData({ ...current, notes: updatedNotes });
    setNotes(updatedNotes.filter((n) => n.lessonTitle === title));
  };

  const goToNextLesson = () => {
    if (currentLessonIndex < currentLesson.lecciones.length - 1) {
      toast.success('¡Nivel completado! +100 puntos', { duration: 1500 });

      if (onLevelComplete) {
        onLevelComplete();
      }

      const nextLessonIndex = currentLessonIndex + 1;
      setCurrentLessonIndex(nextLessonIndex);

      if (onLessonLevelUpdate) {
        onLessonLevelUpdate(nextLessonIndex + 1);
      }

      setCurrentQuestionIndex(0);
      setQuestionsFinished(false);
      setShowQuestions(false);
      setDisplayedWords([]);
    } else {
      const totalQuestions = allQuestions.length;
      const finalPercentage = totalQuestions > 0
        ? Math.round((correctAnswers / totalQuestions) * 100)
        : 0;
      const levelsCompleted = currentLesson.lecciones.length;

      if (onLessonComplete) {
        onLessonComplete(title, finalPercentage, correctAnswers, levelsCompleted);
      }

      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setCurrentLessonIndex(0);
    setCurrentQuestionIndex(0);
    setCorrectAnswers(0);
    setQuestionsFinished(false);
    setShowQuestions(false);
    setDisplayedWords([]);
    setAllQuestions([]);
    setShowResults(false);
  };

  const openImagePopup = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImagePopup(true);
  };

  const closeImagePopup = () => {
    setShowImagePopup(false);
  };

  if (showResults) {
    return (
      <ResultsComponent
        questions={allQuestions}
        totalCorrectAnswers={correctAnswers}
        onRestart={handleRestart}
        lessonName={currentLesson.title}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {showImagePopup && (
        <ImagePopup imageUrl={selectedImage} onClose={closeImagePopup} />
      )}

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingNoteId ? "Editar nota" : "Nueva nota"}
            </h3>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escribe un punto importante que quieras recordar..."
              className="w-full h-32 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowNoteModal(false);
                  setNoteText("");
                  setEditingNoteId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNote}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full transition-colors"
              >
                {editingNoteId ? "Actualizar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress indicators */}
      <div className="flex justify-center items-center gap-3 mb-8">
        {currentLesson.lecciones.map((_, index) => (
          <div
            key={index}
            className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
              index < currentLessonIndex
                ? "bg-green-500 text-white"
                : index === currentLessonIndex
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-600"
            }`}
          >
            {index < currentLessonIndex ? (
              <IconCheck size={18} />
            ) : (
              index + 1
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="prose max-w-none text-gray-700 leading-relaxed">
              {displayedWords.join(" ")}
            </div>

            {showQuestions && !questionsFinished && (
              <div className="mt-8 space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    Pregunta {currentQuestionIndex + 1} de {currentLeccion.questions.length}
                  </p>
                  <p className="text-base text-gray-900">
                    {currentQuestion.question}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm"
                    onClick={() => handleAnswer(true)}
                  >
                    <IconCheck size={20} />
                    <span>Verdadero</span>
                  </button>
                  <button
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm"
                    onClick={() => handleAnswer(false)}
                  >
                    <IconX size={20} />
                    <span>Falso</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:w-80 space-y-4">
          {/* Image */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <Image
              src={currentLeccion.imagen}
              alt={`Lección ${currentLessonIndex + 1}`}
              width={1080}
              height={1080}
              className="w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => openImagePopup(currentLeccion.imagen)}
            />
          </div>

          {/* Next button */}
          {questionsFinished && (
            <button
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors flex items-center justify-center gap-2 shadow-sm"
              onClick={goToNextLesson}
            >
              <span>
                {currentLessonIndex < currentLesson.lecciones.length - 1
                  ? "Siguiente nivel (+100 puntos)"
                  : "Ver resultados"}
              </span>
              <IconArrowRight size={20} />
            </button>
          )}
          {/* Notes section */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="border-b border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <IconNotes size={20} className="text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Mis notas ({notes.length})</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setNoteText("");
                  setEditingNoteId(null);
                  setShowNoteModal(true);
                }}
                className="w-full px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-full transition-colors flex items-center justify-center gap-2 border border-amber-200"
              >
                <IconPlus size={18} />
                <span>Nueva nota</span>
              </button>
            </div>

            {/* Notes list */}
            <div className="p-4 max-h-64 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No tenés notas de esta lección todavía. ¡Agregá una!
                </p>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{note.text}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Nivel {note.level}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditNote(note)}
                            className="p-1 hover:bg-amber-200 rounded transition-colors"
                            title="Editar"
                          >
                            <IconEdit size={16} className="text-amber-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 hover:bg-red-200 rounded transition-colors"
                            title="Eliminar"
                          >
                            <IconTrash size={16} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <FloatingAudioButton text={displayedWords.join(" ")} />
    </div>
  );
}