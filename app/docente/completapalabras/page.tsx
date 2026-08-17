'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/firebaseFirestore';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  query,
  where,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import {
  IconTrash,
  IconPencil,
  IconCheck,
  IconX,
  IconPlus,
  IconEye,
  IconCopy as IconDuplicate,
  IconAlertCircle,
  IconRefresh,
  IconBooks,
  IconTag,
  IconTagOff,
  IconDatabase,
  IconArrowLeft,
} from '@tabler/icons-react';
import { processText } from '@/app/(routes)/completapalabras/utils/gameUtils';
import WordDragGame from '@/app/(routes)/completapalabras/components/WordDragGame';
import { getActivityById } from '@/lib/activities';
import { loadQuestionBank, getDistinctTags, type BankQuestion } from '@/lib/questionSearch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LessonPart {
  text: string;
  extraWords: string[];
}

interface LessonDoc {
  id: string;
  title: string;
  lecciones: LessonPart[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Mismo color que ya tiene "Completa Palabras" en el catálogo de
// actividades — así esta pantalla se siente parte de la misma actividad,
// no de otra.
const ACCENT = getActivityById('completa')?.color ?? '#7B1FA2';
const MIN_LECCIONES = 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(16).substr(2, 8)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 12)}`;
}

/** Cuántos huecos `{palabra}` tiene un texto — para mostrar un contador rápido. */
function countBlanks(text: string): number {
  return (text.match(/\{[^}]*\}/g) || []).length;
}

/** true si las llaves están balanceadas (mismo número de { que de }). */
function bracesBalanced(text: string): boolean {
  const opens = (text.match(/\{/g) || []).length;
  const closes = (text.match(/\}/g) || []).length;
  return opens === closes;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateCompletaPalabras() {
  const { user, profile } = useAuth();

  const [step, setStep] = useState<'list' | 'create' | 'edit'>('list');

  // Listado del docente
  const [userLessons, setUserLessons] = useState<LessonDoc[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);
  const [lessonsError, setLessonsError] = useState(false);

  // Formulario
  const [lessonTitle, setLessonTitle] = useState('');
  const [lecciones, setLecciones] = useState<LessonPart[]>([]);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  // Mini-editor de una lección puntual (dentro del formulario)
  const [showLeccionEditor, setShowLeccionEditor] = useState(false);
  const [editingLeccionIndex, setEditingLeccionIndex] = useState<number | null>(null);
  const [draftText, setDraftText] = useState('');
  const [draftExtraWords, setDraftExtraWords] = useState<string[]>([]);
  const [extraWordInput, setExtraWordInput] = useState('');
  const [suggestedWords, setSuggestedWords] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generador desde el banco de preguntas — trae el texto de una pregunta
  // ya existente para que el docente elija ahí mismo qué palabra marcar,
  // en vez de escribir todo desde cero.
  const [showBankGenerator, setShowBankGenerator] = useState(false);
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([]);
  const [loadingBank, setLoadingBank] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState('');

  // UI
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Modales
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: '',
    title: '',
  });
  const [previewModal, setPreviewModal] = useState<{ open: boolean; id: string; title: string } | null>(null);

  const formTitleRef = useRef<HTMLHeadingElement>(null);

  // ── Cargar lecciones del docente ────────────────────────────────────────────

  const loadUserLessons = useCallback(async () => {
    if (!user?.uid) return;
    setLessonsLoading(true);
    setLessonsError(false);
    try {
      const q = query(collection(db, 'completapalabras'), where('author', '==', user.uid));
      const snapshot = await getDocs(q);
      setUserLessons(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as LessonDoc[]);
    } catch {
      setLessonsError(true);
    } finally {
      setLessonsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadUserLessons();
  }, [loadUserLessons]);

  // ── Mini-editor de una lección ──────────────────────────────────────────────

  const openBankGenerator = async () => {
    setShowBankGenerator(true);
    setSelectedTag(null);
    setTagFilter('');
    if (bankQuestions.length === 0) {
      setLoadingBank(true);
      try {
        const all = await loadQuestionBank();
        setBankQuestions(all);
      } catch (err) {
        console.error('Error cargando el banco de preguntas:', err);
      } finally {
        setLoadingBank(false);
      }
    }
  };

  const questionsForSelectedTag = selectedTag
    ? bankQuestions.filter((q) => q.tag === selectedTag)
    : [];

  const handleUseBankQuestion = (question: BankQuestion) => {
    // El texto de "más información" (resume) suele ser más largo y da
    // mejor material para armar varios huecos que la respuesta corta —
    // si por algún motivo una pregunta no tiene resume cargado, usamos
    // la respuesta como respaldo.
    const sourceText = question.resume?.trim() || question.answer;

    // Palabras sueltas del mismo campo (resume, o answer de respaldo) de
    // OTRAS preguntas de la misma etiqueta — se ofrecen como sugerencia
    // para relleno, tocables, no se agregan solas.
    const otherTexts = questionsForSelectedTag
      .filter((q) => q.id !== question.id)
      .map((q) => q.resume?.trim() || q.answer);
    const candidateWords = otherTexts
      .join(' ')
      .split(/\s+/)
      .map((w) => w.replace(/[.,;:!?()"']/g, ''))
      .filter((w) => w.length > 3 && !sourceText.toLowerCase().includes(w.toLowerCase()));
    const uniqueSuggestions = Array.from(new Set(candidateWords)).slice(0, 6);

    setEditingLeccionIndex(null);
    setDraftText(sourceText);
    setDraftExtraWords([]);
    setExtraWordInput('');
    setSuggestedWords(uniqueSuggestions);
    setShowBankGenerator(false);
    setShowLeccionEditor(true);
  };

  const openEditLeccionEditor = (index: number) => {
    setEditingLeccionIndex(index);
    setDraftText(lecciones[index].text);
    setDraftExtraWords(lecciones[index].extraWords);
    setExtraWordInput('');
    setSuggestedWords([]);
    setShowLeccionEditor(true);
  };

  const handleMarkSelectionAsBlank = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) return; // nada seleccionado

    const selected = draftText.slice(start, end);
    if (selected.includes('{') || selected.includes('}')) return; // evita anidar huecos

    const newText = draftText.slice(0, start) + '{' + selected + '}' + draftText.slice(end);
    setDraftText(newText);
    // Devolvemos el foco al textarea, con el cursor después del hueco recién creado
    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = end + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  };

  /** Saca la marca de un hueco puntual (por índice), devolviéndolo a texto
   *  plano — el "deshacer" cuando el texto no se puede editar a mano. */
  const handleUnmarkBlank = (blankIndex: number) => {
    const { textParts, blanks } = processText(draftText);
    let rebuilt = '';
    textParts.forEach((part, i) => {
      rebuilt += part;
      if (i < blanks.length) {
        rebuilt += i === blankIndex ? blanks[i].correctWord : `{${blanks[i].correctWord}}`;
      }
    });
    setDraftText(rebuilt);
  };

  const handleAddExtraWord = () => {
    const word = extraWordInput.trim();
    if (!word || draftExtraWords.includes(word)) return;
    setDraftExtraWords((prev) => [...prev, word]);
    setExtraWordInput('');
  };

  const handleAddSuggestedWord = (word: string) => {
    if (draftExtraWords.includes(word)) return;
    setDraftExtraWords((prev) => [...prev, word]);
    setSuggestedWords((prev) => prev.filter((w) => w !== word));
  };

  const handleRemoveExtraWord = (word: string) => {
    setDraftExtraWords((prev) => prev.filter((w) => w !== word));
  };

  const handleSaveLeccion = () => {
    if (!bracesBalanced(draftText)) {
      setError('Hay una llave { o } sin cerrar en el texto — revisala antes de guardar.');
      return;
    }
    if (countBlanks(draftText) === 0) {
      setError('Marcá al menos una palabra como hueco antes de guardar esta lección.');
      return;
    }
    if (draftExtraWords.length === 0) {
      setError('Agregá al menos una palabra de relleno (que no sea una respuesta correcta).');
      return;
    }

    const newLeccion: LessonPart = { text: draftText.trim(), extraWords: draftExtraWords };

    setLecciones((prev) => {
      if (editingLeccionIndex !== null) {
        const next = [...prev];
        next[editingLeccionIndex] = newLeccion;
        return next;
      }
      return [...prev, newLeccion];
    });

    setShowLeccionEditor(false);
    setError('');
  };

  const handleRemoveLeccion = (index: number) => {
    setLecciones((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Guardar la lección completa (crear / actualizar) ────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!user?.uid) {
      setError('Debés estar logueado para crear una lección.');
      return;
    }
    if (!lessonTitle.trim()) {
      setError('El título de la lección es requerido.');
      return;
    }
    if (lecciones.length < MIN_LECCIONES) {
      setError(`Agregá al menos ${MIN_LECCIONES} lección con huecos para completar.`);
      return;
    }

    setLoading(true);
    try {
      if (editingLessonId) {
        await updateDoc(doc(db, 'completapalabras', editingLessonId), {
          title: lessonTitle.trim(),
          lecciones,
          updated_at: new Date().toISOString(),
        });
        setMessage('✓ ¡Lección actualizada exitosamente!');
        setEditingLessonId(null);
      } else {
        const uuid = generateUUID();
        await setDoc(doc(db, 'completapalabras', uuid), {
          id: uuid,
          title: lessonTitle.trim(),
          author: user.uid,
          lecciones,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setMessage('✓ ¡Lección creada exitosamente!');
      }

      resetForm();
      setStep('list');
      await loadUserLessons();
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setLessonTitle('');
    setLecciones([]);
    setError('');
  };

  // ── Acciones sobre lecciones ya creadas ─────────────────────────────────────

  const handleDeleteLesson = async () => {
    try {
      await deleteDoc(doc(db, 'completapalabras', deleteModal.id));
      setUserLessons((prev) => prev.filter((l) => l.id !== deleteModal.id));
      setMessage('✓ ¡Lección eliminada exitosamente!');
    } catch {
      setError('Error al eliminar la lección.');
    } finally {
      setDeleteModal({ open: false, id: '', title: '' });
    }
  };

  const handleEditLesson = (lesson: LessonDoc) => {
    setLessonTitle(lesson.title);
    setLecciones(lesson.lecciones);
    setEditingLessonId(lesson.id);
    setStep('edit');
    setError('');
    setMessage('');
    setTimeout(() => formTitleRef.current?.focus(), 100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateLesson = async (lesson: LessonDoc) => {
    if (!user?.uid) return;
    try {
      const uuid = generateUUID();
      await setDoc(doc(db, 'completapalabras', uuid), {
        id: uuid,
        title: `${lesson.title} (copia)`,
        author: user.uid,
        lecciones: lesson.lecciones,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setMessage('✓ Lección duplicada exitosamente');
      await loadUserLessons();
    } catch {
      setError('Error al duplicar la lección.');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-lg p-8 text-center border border-pink-light">
          <p className="text-ink/70">Debés estar logueado para crear una lección de Completa Palabras.</p>
        </div>
      </div>
    );
  }

  const role = profile?.profile?.role;
  if (role && role !== 'teacher') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-lg p-8 text-center border border-pink-light">
          <p className="text-ink/70">Esta sección es solo para docentes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* ── LIST ── */}
      {step === 'list' && (
        <>
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-ink mb-1">
                  Mis lecciones de Completa Palabras
                </h1>
                <p className="text-sm text-ink/60">
                  {userLessons.length} lección{userLessons.length !== 1 ? 'es' : ''} creada{userLessons.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={() => {
                  setStep('create');
                  resetForm();
                  setEditingLessonId(null);
                  setTimeout(() => formTitleRef.current?.focus(), 100);
                }}
                className="flex items-center gap-2 px-5 py-2.5 text-white rounded-full font-semibold text-sm transition shadow-sm hover:opacity-90"
                style={{ backgroundColor: ACCENT }}
              >
                <IconPlus size={18} />
                Crear lección
              </button>
            </div>
          </div>

          {message && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
              <IconCheck size={18} />
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
              <IconX size={18} />
              {error}
            </div>
          )}

          {lessonsLoading && (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-pink-light rounded-lg" />
              ))}
            </div>
          )}

          {!lessonsLoading && lessonsError && (
            <div className="bg-white rounded-lg p-8 text-center border border-pink-light">
              <IconAlertCircle size={32} className="text-red-400 mx-auto mb-3" />
              <p className="text-ink/70 mb-4">No se pudieron cargar tus lecciones</p>
              <button
                onClick={loadUserLessons}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-pink-light hover:bg-pink text-ink/80 rounded-lg transition text-sm font-medium"
              >
                <IconRefresh size={16} />
                Reintentar
              </button>
            </div>
          )}

          {!lessonsLoading && !lessonsError && userLessons.length === 0 && (
            <div className="bg-white rounded-lg p-12 text-center border border-pink-light">
              <p className="text-ink/60 mb-4 text-lg">Aún no creaste ninguna lección</p>
              <button
                onClick={() => setStep('create')}
                className="px-5 py-2 text-white rounded-full text-sm font-semibold hover:opacity-90 transition"
                style={{ backgroundColor: ACCENT }}
              >
                Crear tu primera lección
              </button>
            </div>
          )}

          {!lessonsLoading && !lessonsError && userLessons.length > 0 && (
            <div className="space-y-3">
              {userLessons.map((lesson) => {
                const totalBlanks = lesson.lecciones.reduce((sum, l) => sum + countBlanks(l.text), 0);
                return (
                  <div
                    key={lesson.id}
                    className="bg-white rounded-lg p-5 border border-pink-light hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: ACCENT }}
                        >
                          <IconBooks className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-ink mb-0.5 truncate">{lesson.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="inline-block px-2.5 py-0.5 bg-pink-light text-ink/70 text-xs rounded-full">
                              {lesson.lecciones.length} lección{lesson.lecciones.length !== 1 ? 'es' : ''}
                            </span>
                            <span
                              className="inline-block px-2.5 py-0.5 text-xs rounded-full"
                              style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                            >
                              {totalBlanks} huecos en total
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewModal({ open: true, id: lesson.id, title: lesson.title })}
                          className="flex items-center gap-1.5 px-3 py-2 text-white text-sm font-semibold rounded-full transition hover:opacity-90"
                          style={{ backgroundColor: ACCENT }}
                          aria-label={`Probar lección: ${lesson.title}`}
                        >
                          <IconEye size={16} />
                          <span className="hidden sm:inline">Probar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateLesson(lesson)}
                          className="p-2 text-ink/40 hover:text-ink/80 hover:bg-pink-light rounded-full transition"
                          aria-label="Duplicar lección"
                          title="Duplicar"
                        >
                          <IconDuplicate className="w-4.5 h-4.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditLesson(lesson)}
                          className="p-2 text-ink/40 hover:bg-pink-light rounded-full transition"
                          style={{ color: undefined }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = ACCENT; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                          aria-label="Editar lección"
                          title="Editar"
                        >
                          <IconPencil className="w-4.5 h-4.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteModal({ open: true, id: lesson.id, title: lesson.title })}
                          className="p-2 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                          aria-label="Eliminar lección"
                          title="Eliminar"
                        >
                          <IconTrash className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── CREATE / EDIT ── */}
      {(step === 'create' || step === 'edit') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h1
              ref={formTitleRef}
              tabIndex={-1}
              className="text-2xl sm:text-3xl font-semibold text-ink outline-none"
            >
              {editingLessonId ? 'Editar lección' : 'Crear nueva lección'}
            </h1>
            <button
              onClick={() => {
                setStep('list');
                setEditingLessonId(null);
                setError('');
                setMessage('');
              }}
              className="p-2 text-ink/40 hover:text-ink/80 hover:bg-pink-light rounded-lg transition"
              aria-label="Volver al listado"
            >
              <IconX size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Título */}
            <div className="bg-white rounded-lg p-6 border border-pink-light">
              <label htmlFor="lesson-title" className="block text-sm font-semibold text-ink mb-3">
                Título de la lección *
              </label>
              <input
                id="lesson-title"
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Ej: Consentimiento"
                className="w-full px-4 py-2 border border-pink-light rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
              />
            </div>

            {/* Lecciones (bloques de texto con huecos) */}
            <div className="bg-white rounded-lg p-6 border border-pink-light">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-ink">
                  Lecciones ({lecciones.length})
                </label>
                <button
                  type="button"
                  onClick={openBankGenerator}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full transition"
                  style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                >
                  <IconDatabase size={16} />
                  Agregar desde el banco de preguntas
                </button>
              </div>

              {lecciones.length === 0 ? (
                <p className="text-sm text-ink/40 text-center py-8">
                  Todavía no agregaste ninguna lección — tocá &quot;Agregar desde el banco de preguntas&quot; para sumar la primera.
                </p>
              ) : (
                <div className="space-y-2">
                  {lecciones.map((leccion, index) => {
                    const { textParts, blanks } = processText(leccion.text);
                    return (
                      <div key={index} className="p-3 border border-pink-light rounded-lg">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-ink/80 flex-1 leading-relaxed">
                            {textParts.map((part, i) => (
                              <span key={i}>
                                {part}
                                {i < blanks.length && (
                                  <span
                                    className="inline-block px-1.5 rounded font-medium"
                                    style={{ backgroundColor: `${ACCENT}20`, color: ACCENT }}
                                  >
                                    {blanks[i].correctWord}
                                  </span>
                                )}
                              </span>
                            ))}
                          </p>
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => openEditLeccionEditor(index)}
                              className="p-1.5 text-ink/40 hover:text-ink/80 hover:bg-pink-light rounded transition"
                              aria-label="Editar esta lección"
                            >
                              <IconPencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLeccion(index)}
                              className="p-1.5 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded transition"
                              aria-label="Quitar esta lección"
                            >
                              <IconX size={15} />
                            </button>
                          </div>
                        </div>
                        <p className="text-[11px] text-ink/40 mt-2">
                          {blanks.length} hueco{blanks.length !== 1 ? 's' : ''} · palabras de relleno: {leccion.extraWords.join(', ')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
                <IconCheck size={18} />
                {message}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
                <IconX size={18} />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || lecciones.length < MIN_LECCIONES}
                className="flex-1 px-6 py-3 text-white rounded-full font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                style={{ backgroundColor: ACCENT }}
              >
                {loading ? 'Procesando...' : editingLessonId ? 'Actualizar lección' : 'Crear lección'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('list');
                  setEditingLessonId(null);
                  resetForm();
                }}
                className="px-6 py-3 border border-pink-light text-ink/80 rounded-full font-semibold hover:bg-cream transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Mini-editor de una lección puntual ── */}
      {/* ── Generador desde el banco de preguntas ── */}
      {showBankGenerator && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-pink-light shrink-0">
              <div className="flex items-center gap-2">
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag(null)}
                    className="text-ink/40 hover:text-ink/70"
                    aria-label="Volver a elegir etiqueta"
                  >
                    <IconArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <h2 className="text-lg font-bold text-ink">
                  {selectedTag ? `Preguntas de "${selectedTag}"` : 'Elegí una etiqueta'}
                </h2>
              </div>
              <button onClick={() => setShowBankGenerator(false)} className="text-ink/40 hover:text-ink/70">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              {loadingBank ? (
                <div className="flex items-center justify-center py-12 text-ink/40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ACCENT }} />
                </div>
              ) : !selectedTag ? (
                <>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      placeholder="Filtrar etiquetas..."
                      className="w-full px-4 py-2 border border-pink-light rounded-lg text-sm focus:outline-none focus:ring-2"
                      style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {getDistinctTags(bankQuestions)
                      .filter((tag) => tag.toLowerCase().includes(tagFilter.trim().toLowerCase()))
                      .map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className="px-3 py-2 text-sm text-left rounded-lg border border-pink-light hover:border-transparent transition"
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${ACCENT}15`; e.currentTarget.style.color = ACCENT; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                        >
                          {tag}
                        </button>
                      ))}
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  {questionsForSelectedTag.length === 0 ? (
                    <p className="text-sm text-ink/40 text-center py-8">No hay preguntas con esta etiqueta.</p>
                  ) : (
                    questionsForSelectedTag.map((q) => (
                      <div key={q.id} className="p-3 border border-pink-light rounded-lg">
                        <p className="text-sm text-ink font-medium mb-1">{q.question}</p>
                        <p className="text-sm text-ink/60 mb-2">{q.resume?.trim() || q.answer}</p>
                        <button
                          type="button"
                          onClick={() => handleUseBankQuestion(q)}
                          className="text-sm font-semibold rounded-full px-3 py-1.5 transition"
                          style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                        >
                          Usar este texto
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLeccionEditor && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-pink-light">
              <h2 className="text-lg font-bold text-ink">
                {editingLeccionIndex !== null ? 'Editar lección' : 'Nueva lección'}
              </h2>
              <button
                onClick={() => setShowLeccionEditor(false)}
                className="text-ink/40 hover:text-ink/70"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  Texto de la lección
                </label>
                <p className="text-xs text-ink/60 mb-2">
                  Este texto viene del banco de preguntas de CrESI — no se puede reescribir.
                  Seleccioná con el mouse cada palabra que querés que sea un hueco para completar,
                  y tocá &quot;Marcar como hueco&quot;.
                </p>
                <textarea
                  ref={textareaRef}
                  value={draftText}
                  readOnly
                  rows={6}
                  className="w-full px-4 py-3 border border-pink-light rounded-lg text-sm leading-relaxed bg-cream
                           focus:outline-none focus:ring-2 cursor-text"
                  style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
                />
                <button
                  type="button"
                  onClick={handleMarkSelectionAsBlank}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full transition"
                  style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
                >
                  <IconTag size={15} />
                  Marcar selección como hueco
                </button>
                <p className="text-[11px] text-ink/40 mt-1.5">
                  {countBlanks(draftText)} hueco{countBlanks(draftText) !== 1 ? 's' : ''} marcado{countBlanks(draftText) !== 1 ? 's' : ''} hasta ahora.
                </p>
              </div>

              {/* Vista previa — cada hueco es un chip con su palabra, tocable para desmarcarlo */}
              {draftText && bracesBalanced(draftText) && (
                <div className="p-4 bg-cream rounded-lg border border-pink-light">
                  <p className="text-xs font-semibold text-ink/60 mb-2">
                    Vista previa — tocá un hueco para desmarcarlo
                  </p>
                  <p className="text-sm text-ink/80 leading-relaxed">
                    {processText(draftText).textParts.map((part, i, arr) => {
                      const blank = processText(draftText).blanks[i];
                      return (
                        <span key={i}>
                          {part}
                          {i < arr.length - 1 && blank && (
                            <button
                              type="button"
                              onClick={() => handleUnmarkBlank(i)}
                              title="Tocá para desmarcar este hueco"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded border-2 border-dashed text-xs font-semibold mx-0.5 hover:opacity-70 transition"
                              style={{ borderColor: ACCENT, color: ACCENT }}
                            >
                              {blank.correctWord}
                              <IconX size={11} />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </p>
                </div>
              )}

              {/* Palabras de relleno */}
              <div>
                <label className="block text-sm font-semibold text-ink mb-1">
                  Palabras de relleno
                </label>
                <p className="text-xs text-ink/60 mb-2">
                  Palabras que van a aparecer como opciones incorrectas, además de las correctas
                  (los huecos que marcaste arriba).
                </p>

                {suggestedWords.length > 0 && (
                  <div className="mb-3 p-2.5 bg-cream rounded-lg border border-pink-light">
                    <p className="text-[11px] text-ink/60 mb-1.5">
                      Sugeridas (de otras preguntas de la misma etiqueta) — tocá para sumar:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedWords.map((word) => (
                        <button
                          key={word}
                          type="button"
                          onClick={() => handleAddSuggestedWord(word)}
                          className="px-2.5 py-1 text-xs rounded-full border transition"
                          style={{ borderColor: ACCENT, color: ACCENT }}
                        >
                          + {word}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={extraWordInput}
                    onChange={(e) => setExtraWordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddExtraWord();
                      }
                    }}
                    placeholder="Escribí una palabra y tocá Enter"
                    className="flex-1 px-3 py-2 border border-pink-light rounded-lg text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
                  />
                  <button
                    type="button"
                    onClick={handleAddExtraWord}
                    className="px-4 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
                    style={{ backgroundColor: ACCENT }}
                  >
                    Agregar
                  </button>
                </div>
                {draftExtraWords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {draftExtraWords.map((word) => (
                      <span
                        key={word}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-light text-ink/80 text-xs rounded-full"
                      >
                        {word}
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraWord(word)}
                          className="hover:text-red-600"
                        >
                          <IconTagOff size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
                  <IconX size={16} />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLeccionEditor(false)}
                  className="px-5 py-2 rounded-full border border-pink-light text-ink/80 text-sm font-medium hover:bg-cream"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveLeccion}
                  className="px-5 py-2 rounded-full text-white text-sm font-medium hover:opacity-90 transition"
                  style={{ backgroundColor: ACCENT }}
                >
                  Guardar lección
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Vista previa / probar la lección (juega el componente real) ── */}
      {previewModal?.open && (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto">
          <div className="min-h-screen flex flex-col">
            <div className="bg-white border-b border-pink-light px-5 py-3 flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-sm font-bold text-ink">Probando: {previewModal.title}</h2>
              <button
                onClick={() => setPreviewModal(null)}
                className="p-2 text-ink/40 hover:text-ink/80 hover:bg-pink-light rounded-full transition"
              >
                <IconX size={20} />
              </button>
            </div>
            <div className="flex-1 bg-cream">
              <WordDragGame lessonId={previewModal.id} />
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmación de borrado ── */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <h3 className="font-bold text-ink mb-1">¿Eliminar esta lección?</h3>
            <p className="text-sm text-ink/60 mb-4">
              &quot;{deleteModal.title}&quot; se va a borrar. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteModal({ open: false, id: '', title: '' })}
                className="px-4 py-2 text-sm text-ink/70 hover:bg-pink-light rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteLesson}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}