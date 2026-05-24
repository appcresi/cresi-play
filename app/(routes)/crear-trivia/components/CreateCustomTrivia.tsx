'use client';

import { useState, useEffect } from 'react';
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
  updateDoc
} from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { IconTrash, IconPencil, IconCheck, IconX, IconSearch, IconPlus } from '@tabler/icons-react';

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
  questions?: any[];
}

const MAX_FREE_TRIVIAS = 3;

export default function CreateCustomTrivia() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState<'list' | 'create' | 'edit'>('list');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [triviaName, setTriviaName] = useState('');
  const [triviaDescription, setTriviaDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [userTrivias, setUserTrivias] = useState<UserTrivia[]>([]);
  const [userTriviaCount, setUserTriviaCount] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTriviaId, setEditingTriviaId] = useState<string | null>(null);

  const canCreateMore = userTriviaCount < MAX_FREE_TRIVIAS;

  // Cargar preguntas
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const questionsRef = collection(db, 'questions');
        const snapshot = await getDocs(questionsRef);
        const questionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Question[];
        setQuestions(questionsData);
      } catch (err) {
        console.error('Error loading questions:', err);
      }
    };

    loadQuestions();
  }, []);

  // Cargar trivias del usuario
  useEffect(() => {
    if (!user?.uid) return;

    const loadUserTrivias = async () => {
      try {
        const triviaRef = collection(db, 'trivia');
        const q = query(triviaRef, where('author', '==', user.uid));
        const snapshot = await getDocs(q);
        const trivias = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as UserTrivia[];
        setUserTrivias(trivias);
        setUserTriviaCount(trivias.length);
      } catch (err) {
        console.error('Error loading user trivias:', err);
      }
    };

    loadUserTrivias();
  }, [user?.uid]);

  const handleSelectQuestion = (questionId: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
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

    if (selectedQuestionIds.length < 3) {
      setError('Debes seleccionar al menos 3 preguntas');
      return;
    }

    setLoading(true);

    try {
      const selectedQuestions: TriviaQuestion[] = [];
      
      for (const questionId of selectedQuestionIds) {
        const question = questions.find(q => q.id === questionId);
        if (question) {
          selectedQuestions.push({
            question: question.question,
            answer: question.answer,
            options: question.options,
            resume: question.resume
          });
        }
      }

      if (editingTriviaId) {
        await updateDoc(doc(db, 'trivia', editingTriviaId), {
          name: triviaName,
          description: triviaDescription || '',
          questions: selectedQuestions,
          updated_at: new Date().toISOString(),
        });
        setMessage(`✓ ¡Trivia actualizada exitosamente!`);
        setEditingTriviaId(null);
      } else {
        const uuid = `${Math.random().toString(16).substr(2, 8)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 12)}`;

        const newTrivia = {
          id: uuid,
          name: triviaName,
          description: triviaDescription || '',
          questions: selectedQuestions,
          author: user.uid,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          level: 1,
          isPublic: true,
          source: 'usuario'
        };

        await setDoc(doc(db, 'trivia', uuid), newTrivia);
        setMessage(`✓ ¡Trivia creada exitosamente!`);
        setUserTriviaCount(prev => prev + 1);
      }

      setTriviaName('');
      setTriviaDescription('');
      setSelectedQuestionIds([]);
      setSearchQuery('');

      const triviaRef = collection(db, 'trivia');
      const q = query(triviaRef, where('author', '==', user.uid));
      const snapshot = await getDocs(q);
      const trivias = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as UserTrivia[];
      setUserTrivias(trivias);

      setTimeout(() => {
        router.push('/trivias');
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error: ${errorMessage}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTrivia = async (triviaId: string) => {
    if (!window.confirm('¿Estás seguro que querés eliminar esta trivia?')) return;

    try {
      await deleteDoc(doc(db, 'trivia', triviaId));
      setUserTrivias(prev => prev.filter(t => t.id !== triviaId));
      setUserTriviaCount(prev => prev - 1);
      setMessage('✓ ¡Trivia eliminada exitosamente!');
    } catch (err) {
      console.error('Error deleting trivia:', err);
      setError('Error al eliminar la trivia');
    }
  };

  const handleEditTrivia = (trivia: UserTrivia) => {
    setTriviaName(trivia.name);
    setTriviaDescription(trivia.description || '');
    if (trivia.questions) {
      const questionIds = questions
        .filter(q => trivia.questions?.some(tq => tq.question === q.question))
        .map(q => q.id);
      setSelectedQuestionIds(questionIds);
    }
    setEditingTriviaId(trivia.id);
    setStep('edit');
    window.scrollTo(0, 0);
  };

  const filteredQuestions = questions.filter(q =>
    q.question?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {/* Header Section */}
      {step === 'list' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">ESI: Mis trivias</h1>
              <p className="text-gray-600">{userTriviaCount} de {MAX_FREE_TRIVIAS} trivias creadas</p>
            </div>
            {canCreateMore && (
              <button
                onClick={() => {
                  setStep('create');
                  setTriviaName('');
                  setTriviaDescription('');
                  setSelectedQuestionIds([]);
                  setEditingTriviaId(null);
                  setError('');
                  setMessage('');
                }}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition shadow-sm"
              >
                <IconPlus size={20} />
                Crear trivia
              </button>
            )}
          </div>
        </div>
      )}

      {/* Trivias List */}
      {step === 'list' && (
        <div className="space-y-4">
          {userTrivias.length === 0 ? (
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
          ) : (
            userTrivias.map((trivia) => (
              <div
                key={trivia.id}
                className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{trivia.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {trivia.description || 'Sin descripción'}
                    </p>
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      {trivia.questions?.length || 0} preguntas
                    </span>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEditTrivia(trivia)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Editar"
                    >
                      <IconPencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteTrivia(trivia.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Eliminar"
                    >
                      <IconTrash size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Form */}
      {(step === 'create' || step === 'edit') && (
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {editingTriviaId ? 'Editar trivia' : 'Crear nueva trivia'}
            </h1>
            <button
              onClick={() => {
                setStep('list');
                setEditingTriviaId(null);
                setError('');
                setMessage('');
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <IconX size={24} />
            </button>
          </div>

          <form onSubmit={handleCreateTrivia} className="space-y-6">
            {/* Nombre */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Nombre de la trivia *
              </label>
              <input
                type="text"
                value={triviaName}
                onChange={(e) => setTriviaName(e.target.value)}
                placeholder="Ej: Trivia sobre ESI básico"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Descripción */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Descripción (opcional)
              </label>
              <textarea
                value={triviaDescription}
                onChange={(e) => setTriviaDescription(e.target.value)}
                placeholder="Describe de qué trata tu trivia"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Búsqueda y selección de preguntas */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <label className="block text-sm font-semibold text-gray-900 mb-4">
                Selecciona preguntas ({selectedQuestionIds.length}/mínimo 3)
              </label>

              <div className="relative mb-4">
                <IconSearch className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar preguntas..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {searchQuery && filteredQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const allIds = filteredQuestions.map(q => q.id);
                    setSelectedQuestionIds(prev => {
                      const combined = new Set([...prev, ...allIds]);
                      return Array.from(combined);
                    });
                  }}
                  className="mb-4 text-sm px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition font-semibold"
                >
                  ✓ Seleccionar todos ({filteredQuestions.length})
                </button>
              )}

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredQuestions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay preguntas disponibles</p>
                ) : (
                  filteredQuestions.map(question => (
                    <div
                      key={question.id}
                      className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition group"
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedQuestionIds.includes(question.id)}
                          onChange={() => handleSelectQuestion(question.id)}
                          className="w-4 h-4 mt-1 rounded"
                        />
                        <span className="text-sm text-gray-700 flex-1">{question.question}</span>
                        {selectedQuestionIds.includes(question.id) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectQuestion(question.id);
                            }}
                            className="text-red-600 hover:text-red-700 opacity-0 group-hover:opacity-100 transition text-sm"
                          >
                            Eliminar
                          </button>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Mensajes */}
            {message && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
                <IconCheck size={20} />
                {message}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
                <IconX size={20} />
                {error}
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading || selectedQuestionIds.length < 3}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Procesando...' : editingTriviaId ? 'Actualizar trivia' : 'Crear trivia'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('list');
                  setEditingTriviaId(null);
                  setTriviaName('');
                  setTriviaDescription('');
                  setSelectedQuestionIds([]);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}