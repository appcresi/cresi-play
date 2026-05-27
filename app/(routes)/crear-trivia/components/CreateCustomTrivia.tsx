'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  setDoc,
  doc,
  query,
  where,
  deleteDoc,
  updateDoc,
  increment,
  getDoc,
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import {
  IconTrash,
  IconPencil,
  IconCheck,
  IconX,
  IconSearch,
  IconPlus,
  IconPlayerPlay,
  IconCopy,
  IconEye,
  IconQrcode,
  IconCopy as IconDuplicate,
  IconAlertCircle,
  IconRefresh,
  IconChevronUp,
  IconChevronDown,
  IconGripVertical,
} from '@tabler/icons-react';

import DeleteConfirmModal from './DeleteConfirmModal';
import PreviewModal from './PreviewModal';
import QRModal from './QRModal';
import TriviaSkeleton from './TriviaSkeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuestionOption {
  first: string;
  second: string;
  third: string;
}

interface Question {
  id: string;
  question: string;
  answer: string;
  options: QuestionOption;
  resume: string;
  [key: string]: any;
}

interface TriviaQuestion {
  question: string;
  answer: string;
  options: QuestionOption;
  resume: string;
}

interface UserTrivia {
  id: string;
  name: string;
  description?: string;
  questions?: TriviaQuestion[];
  playCount?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FREE_TRIVIAS = 3;
const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(16).substr(2, 8)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 12)}`;
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateCustomTrivia() {
  const { user } = useAuth();
  const router = useRouter();

  // Step
  const [step, setStep] = useState<'list' | 'create' | 'edit'>('list');

  // Questions bank
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState(false);

  // Form state
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [triviaName, setTriviaName] = useState('');
  const [triviaDescription, setTriviaDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTriviaId, setEditingTriviaId] = useState<string | null>(null);

  // User trivias
  const [userTrivias, setUserTrivias] = useState<UserTrivia[]>([]);
  const [triviasLoading, setTriviasLoading] = useState(true);
  const [triviasError, setTriviasError] = useState(false);
  const [userTriviaCount, setUserTriviaCount] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  });
  const [previewModal, setPreviewModal] = useState<{ open: boolean; trivia: UserTrivia | null }>({
    open: false,
    trivia: null,
  });
  const [qrModal, setQrModal] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  });

  // Floating counter ref
  const formTitleRef = useRef<HTMLHeadingElement>(null);

  const canCreateMore = userTriviaCount < MAX_FREE_TRIVIAS;

  // ── Load questions ──────────────────────────────────────────────────────────

  const loadQuestions = useCallback(async () => {
    setQuestionsLoading(true);
    setQuestionsError(false);
    try {
      const snapshot = await getDocs(collection(db, 'questions'));
      setQuestions(
        snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Question[]
      );
    } catch {
      setQuestionsError(true);
    } finally {
      setQuestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  // ── Load user trivias ───────────────────────────────────────────────────────

  const loadUserTrivias = useCallback(async () => {
    if (!user?.uid) return;
    setTriviasLoading(true);
    setTriviasError(false);
    try {
      const q = query(collection(db, 'trivia'), where('author', '==', user.uid));
      const snapshot = await getDocs(q);
      const trivias = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as UserTrivia[];
      setUserTrivias(trivias);
      setUserTriviaCount(trivias.length);
    } catch {
      setTriviasError(true);
    } finally {
      setTriviasLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadUserTrivias();
  }, [loadUserTrivias]);

  // ── Form handlers ───────────────────────────────────────────────────────────

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestionIds((prev) => {
      if (prev.includes(questionId)) return prev.filter((id) => id !== questionId);
      if (prev.length >= MAX_QUESTIONS) return prev;
      return [...prev, questionId];
    });
  };

  // Move question up/down in selection order
  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    setSelectedQuestionIds((prev) => {
      const idx = prev.indexOf(questionId);
      if (idx === -1) return prev;
      const next = [...prev];
      const target = direction === 'up' ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleCreateTrivia = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!user?.uid) {
      setError('Debes estar logueado para crear una trivia');
      return;
    }
    if (!editingTriviaId && !canCreateMore) {
      setError(`Has alcanzado el límite de ${MAX_FREE_TRIVIAS} trivias gratis.`);
      return;
    }
    if (!triviaName.trim()) {
      setError('El nombre de la trivia es requerido');
      return;
    }
    if (selectedQuestionIds.length < MIN_QUESTIONS) {
      setError(`Debes seleccionar al menos ${MIN_QUESTIONS} preguntas`);
      return;
    }

    setLoading(true);
    try {
      const selectedQuestions: TriviaQuestion[] = selectedQuestionIds
        .map((id) => questions.find((q) => q.id === id))
        .filter(Boolean)
        .map((q) => ({
          question: q!.question,
          answer: q!.answer,
          options: q!.options,
          resume: q!.resume,
        }));

      if (editingTriviaId) {
        await updateDoc(doc(db, 'trivia', editingTriviaId), {
          name: triviaName,
          description: triviaDescription || '',
          questions: selectedQuestions,
          updated_at: new Date().toISOString(),
        });
        setMessage('✓ ¡Trivia actualizada exitosamente!');
        setEditingTriviaId(null);
      } else {
        const uuid = generateUUID();
        await setDoc(doc(db, 'trivia', uuid), {
          id: uuid,
          name: triviaName,
          description: triviaDescription || '',
          questions: selectedQuestions,
          author: user.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          level: 1,
          isPublic: true,
          source: 'usuario',
          playCount: 0,
        });
        setMessage('✓ ¡Trivia creada exitosamente!');
        setUserTriviaCount((prev) => prev + 1);
      }

      resetForm();
      await loadUserTrivias();
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTriviaName('');
    setTriviaDescription('');
    setSelectedQuestionIds([]);
    setSearchQuery('');
    setError('');
  };

  // ── Trivia actions ──────────────────────────────────────────────────────────

  const handleDeleteTrivia = async () => {
    try {
      await deleteDoc(doc(db, 'trivia', deleteModal.id));
      setUserTrivias((prev) => prev.filter((t) => t.id !== deleteModal.id));
      setUserTriviaCount((prev) => prev - 1);
      setMessage('✓ ¡Trivia eliminada exitosamente!');
    } catch {
      setError('Error al eliminar la trivia');
    } finally {
      setDeleteModal({ open: false, id: '', name: '' });
    }
  };

  const handleEditTrivia = (trivia: UserTrivia) => {
    setTriviaName(trivia.name);
    setTriviaDescription(trivia.description || '');
    if (trivia.questions) {
      const ids = questions
        .filter((q) => trivia.questions?.some((tq) => tq.question === q.question))
        .map((q) => q.id);
      setSelectedQuestionIds(ids);
    }
    setEditingTriviaId(trivia.id);
    setStep('edit');
    setError('');
    setMessage('');
    setTimeout(() => formTitleRef.current?.focus(), 100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateTrivia = async (trivia: UserTrivia) => {
    if (!user?.uid) return;
    if (!canCreateMore) {
      setMessage('');
      setError(`Has alcanzado el límite de ${MAX_FREE_TRIVIAS} trivias gratis.`);
      return;
    }
    try {
      const uuid = generateUUID();
      await setDoc(doc(db, 'trivia', uuid), {
        ...trivia,
        id: uuid,
        name: `${trivia.name} (copia)`,
        author: user.uid,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        playCount: 0,
      });
      setUserTriviaCount((prev) => prev + 1);
      setMessage('✓ Trivia duplicada exitosamente');
      await loadUserTrivias();
    } catch {
      setError('Error al duplicar la trivia');
    }
  };

  const handleShare = async (triviaId: string) => {
    const url = `${window.location.origin}/trivias/${triviaId}`;
    try {
      await copyToClipboard(url);
      setCopiedId(triviaId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('No se pudo copiar el link');
    }
  };

  const handlePlay = async (triviaId: string) => {
    // Increment play counter in background
    try {
      await updateDoc(doc(db, 'trivia', triviaId), {
        playCount: increment(1),
      });
    } catch {
      // Non-critical, don't block navigation
    }
    router.push(`/trivias/${triviaId}`);
  };

  // ── Filtered / ordered questions ────────────────────────────────────────────

  const filteredQuestions = questions.filter((q) =>
    q.question?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Selected questions in current order (for the ordered list below search)
  const orderedSelected = selectedQuestionIds
    .map((id) => questions.find((q) => q.id === id))
    .filter(Boolean) as Question[];

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
          <p className="text-gray-600">Debes estar logueado para crear una trivia personalizada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">

      {/* ── LIST ── */}
      {step === 'list' && (
        <>
          {/* Header */}
          {/* Header */}
<div className="mb-8">
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <button
        onClick={() => router.back()}
        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
        aria-label="Volver"
      >
        <IconX size={22} />
      </button>
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ESI: Mis trivias</h1>
        <p className="text-gray-600">
          {userTriviaCount} de {MAX_FREE_TRIVIAS} trivias creadas
        </p>
      </div>
    </div>
    {canCreateMore && (
      <button
        onClick={() => {
          setStep('create');
          resetForm();
          setEditingTriviaId(null);
          setTimeout(() => formTitleRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-sm"
      >
        <IconPlus size={20} />
        Crear trivia
      </button>
    )}
  </div>
</div>

          {/* Feedback messages */}
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

          {/* Loading skeleton */}
          {triviasLoading && <TriviaSkeleton />}

          {/* Error state */}
          {!triviasLoading && triviasError && (
            <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
              <IconAlertCircle size={32} className="text-red-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No se pudieron cargar tus trivias</p>
              <button
                onClick={loadUserTrivias}
                className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
              >
                <IconRefresh size={16} />
                Reintentar
              </button>
            </div>
          )}

          {/* Empty state */}
          {!triviasLoading && !triviasError && userTrivias.length === 0 && (
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
              <p className="text-gray-500 mb-4 text-lg">Aún no has creado ninguna trivia</p>
              {canCreateMore && (
                <button
                  onClick={() => setStep('create')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Crear tu primera trivia
                </button>
              )}
            </div>
          )}

          {/* Trivias list */}
          {!triviasLoading && !triviasError && userTrivias.length > 0 && (
            <div className="space-y-4">
              {userTrivias.map((trivia) => (
                <div
                  key={trivia.id}
                  className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">{trivia.name}</h3>
                      <p className="text-gray-500 text-sm mb-3">
                        {trivia.description || 'Sin descripción'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {trivia.questions?.length || 0} preguntas
                        </span>
                        {typeof trivia.playCount === 'number' && (
                          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                            {trivia.playCount} {trivia.playCount === 1 ? 'partida' : 'partidas'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                      {/* Jugar */}
                      <button
                        onClick={() => handlePlay(trivia.id)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition"
                        aria-label={`Jugar trivia: ${trivia.name}`}
                      >
                        <IconPlayerPlay size={16} />
                        Jugar
                      </button>

                      {/* Vista previa */}
                      <button
                        onClick={() => setPreviewModal({ open: true, trivia })}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-sm font-semibold rounded-lg transition"
                        aria-label={`Ver previa de: ${trivia.name}`}
                      >
                        <IconEye size={16} />
                        Previa
                      </button>

                      {/* Compartir (copiar link) */}
                      <button
                        onClick={() => handleShare(trivia.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border transition ${
                          copiedId === trivia.id
                            ? 'bg-green-50 text-green-700 border-green-300'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                        aria-label="Copiar link para compartir"
                      >
                        {copiedId === trivia.id ? (
                          <>
                            <IconCheck size={16} />
                            Copiado
                          </>
                        ) : (
                          <>
                            <IconCopy size={16} />
                            Compartir
                          </>
                        )}
                      </button>

                      {/* QR */}
                      <button
                        onClick={() => setQrModal({ open: true, id: trivia.id, name: trivia.name })}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition border border-transparent hover:border-indigo-200"
                        aria-label="Generar código QR"
                        title="Código QR"
                      >
                        <IconQrcode size={20} />
                      </button>

                      {/* Duplicar */}
                      <button
                        onClick={() => handleDuplicateTrivia(trivia)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition border border-transparent hover:border-amber-200"
                        aria-label="Duplicar trivia"
                        title="Duplicar"
                        disabled={!canCreateMore}
                      >
                        <IconDuplicate size={20} />
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => handleEditTrivia(trivia)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-200"
                        aria-label="Editar trivia"
                        title="Editar"
                      >
                        <IconPencil size={20} />
                      </button>

                      {/* Eliminar */}
                      <button
                        onClick={() =>
                          setDeleteModal({ open: true, id: trivia.id, name: trivia.name })
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-200"
                        aria-label="Eliminar trivia"
                        title="Eliminar"
                      >
                        <IconTrash size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── CREATE / EDIT ── */}
      {(step === 'create' || step === 'edit') && (
        <div className="space-y-6">
          {/* Form header */}
          <div className="flex items-center justify-between mb-6">
            <h1
              ref={formTitleRef}
              tabIndex={-1}
              className="text-3xl font-bold text-gray-900 outline-none"
            >
              {editingTriviaId ? 'Editar trivia' : 'Crear nueva trivia'}
            </h1>
            <button
              onClick={() => {
                setStep('list');
                setEditingTriviaId(null);
                setError('');
                setMessage('');
              }}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              aria-label="Volver al listado"
            >
              <IconX size={22} />
            </button>
          </div>

          <form onSubmit={handleCreateTrivia} className="space-y-6">
            {/* Nombre */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <label
                htmlFor="trivia-name"
                className="block text-sm font-semibold text-gray-900 mb-3"
              >
                Nombre de la trivia *
              </label>
              <input
                id="trivia-name"
                type="text"
                value={triviaName}
                onChange={(e) => setTriviaName(e.target.value)}
                placeholder="Ej: Trivia sobre ESI básico"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <label
                htmlFor="trivia-desc"
                className="block text-sm font-semibold text-gray-900 mb-3"
              >
                Descripción{' '}
                <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea
                id="trivia-desc"
                value={triviaDescription}
                onChange={(e) => setTriviaDescription(e.target.value)}
                placeholder="Describe de qué trata tu trivia"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Selección de preguntas */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              {/* Label + floating counter */}
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-semibold text-gray-900">
                  Seleccioná preguntas
                </label>
                <div
                  className={`sticky top-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border transition ${
                    selectedQuestionIds.length < MIN_QUESTIONS
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : selectedQuestionIds.length >= MAX_QUESTIONS
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}
                >
                  {selectedQuestionIds.length}/{MAX_QUESTIONS}
                  {selectedQuestionIds.length < MIN_QUESTIONS && (
                    <span className="font-normal text-xs">
                      (mín. {MIN_QUESTIONS})
                    </span>
                  )}
                  {selectedQuestionIds.length >= MAX_QUESTIONS && (
                    <span className="font-normal text-xs">(máx.)</span>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <IconSearch className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar preguntas..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Select all filtered */}
              {searchQuery && filteredQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const idsToAdd = filteredQuestions
                      .map((q) => q.id)
                      .filter((id) => !selectedQuestionIds.includes(id))
                      .slice(0, MAX_QUESTIONS - selectedQuestionIds.length);
                    setSelectedQuestionIds((prev) => [...prev, ...idsToAdd]);
                  }}
                  className="mb-3 text-sm px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-semibold"
                >
                  ✓ Seleccionar todos ({filteredQuestions.length})
                </button>
              )}

              {/* Questions error */}
              {questionsError && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-3">
                  <IconAlertCircle size={18} className="text-red-500 flex-shrink-0" />
                  <p className="text-red-700 text-sm">No se pudieron cargar las preguntas.</p>
                  <button
                    type="button"
                    onClick={loadQuestions}
                    className="ml-auto flex items-center gap-1 text-sm text-red-700 font-semibold hover:underline"
                  >
                    <IconRefresh size={14} />
                    Reintentar
                  </button>
                </div>
              )}

              {/* Questions list */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {questionsLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-10 bg-gray-100 rounded-lg" />
                    ))}
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">
                    No hay preguntas que coincidan con tu búsqueda
                  </p>
                ) : (
                  filteredQuestions.map((question) => {
                    const isSelected = selectedQuestionIds.includes(question.id);
                    const isAtMax =
                      selectedQuestionIds.length >= MAX_QUESTIONS && !isSelected;
                    return (
                      <div
                        key={question.id}
                        className={`p-3 border rounded-lg transition group ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300'
                            : isAtMax
                            ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <label
                          className={`flex items-start gap-3 ${
                            isAtMax ? 'cursor-not-allowed' : 'cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectQuestion(question.id)}
                            disabled={isAtMax}
                            className="w-4 h-4 mt-0.5 rounded accent-blue-600"
                          />
                          <span className="text-sm text-gray-700 flex-1">
                            {question.question}
                          </span>
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Ordered selection panel */}
            {orderedSelected.length > 0 && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Orden de preguntas seleccionadas
                </h3>
                <div className="space-y-2">
                  {orderedSelected.map((q, idx) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg group"
                    >
                      <IconGripVertical size={16} className="text-gray-300 flex-shrink-0" />
                      <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-gray-700 flex-1 truncate">{q.question}</p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(q.id, 'up')}
                          disabled={idx === 0}
                          className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                          aria-label="Mover arriba"
                        >
                          <IconChevronUp size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(q.id, 'down')}
                          disabled={idx === orderedSelected.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                          aria-label="Mover abajo"
                        >
                          <IconChevronDown size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectQuestion(q.id)}
                          className="p-1 text-red-400 hover:text-red-600 rounded"
                          aria-label="Quitar pregunta"
                        >
                          <IconX size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback */}
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

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || selectedQuestionIds.length < MIN_QUESTIONS}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading
                  ? 'Procesando...'
                  : editingTriviaId
                  ? 'Actualizar trivia'
                  : 'Crear trivia'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('list');
                  setEditingTriviaId(null);
                  resetForm();
                }}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODALS ── */}

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        triviaName={deleteModal.name}
        onConfirm={handleDeleteTrivia}
        onCancel={() => setDeleteModal({ open: false, id: '', name: '' })}
      />

      <PreviewModal
        isOpen={previewModal.open}
        triviaName={previewModal.trivia?.name ?? ''}
        questions={
          previewModal.trivia?.questions
            ? questions.filter((q) =>
                previewModal.trivia!.questions!.some((tq) => tq.question === q.question)
              )
            : []
        }
        onClose={() => setPreviewModal({ open: false, trivia: null })}
      />

      <QRModal
        isOpen={qrModal.open}
        triviaName={qrModal.name}
        url={
          typeof window !== 'undefined'
            ? `${window.location.origin}/trivias/${qrModal.id}`
            : ''
        }
        onClose={() => setQrModal({ open: false, id: '', name: '' })}
      />
    </div>
  );
}