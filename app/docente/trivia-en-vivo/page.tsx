'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  IconBolt,
  IconPlus,
  IconArrowRight,
  IconCircleCheck,
  IconCircleX,
  IconTrash,
  IconCards,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { db } from '@/lib/firebaseFirestore';
import { useAuth } from '@/context/AuthContext';
import LiveTriviaService, { MAX_LIVE_TRIVIA_SESSIONS_PER_TEACHER } from '@/lib/liveTriviaService';
import { colorForTrivia } from '@/lib/triviaColors';
import type { LiveTriviaSession } from '@/types/liveTrivia';

const ACCENT = '#7C3AED';
// Con muchas trivias la grilla se hacía muy larga y el botón de "Iniciar
// partida" quedaba empujado bien abajo — se pagina igual que el selector
// de trivias del creador de tareas (CreateTareaScreen.tsx).
const TRIVIAS_PER_PAGE = 8;

interface TriviaOption {
  id: string;
  name: string;
  questionCount: number;
  isOwn: boolean;
}

export default function TriviaEnVivoPage(): JSX.Element {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [trivias, setTrivias] = useState<TriviaOption[]>([]);
  const [loadingTrivias, setLoadingTrivias] = useState(true);
  const [selectedTriviaId, setSelectedTriviaId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [sessions, setSessions] = useState<LiveTriviaSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [triviaPage, setTriviaPage] = useState(1);

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      try {
        const [ownSnap, cresiSnap] = await Promise.all([
          getDocs(query(collection(db, 'trivia'), where('author', '==', user.uid))),
          getDocs(query(collection(db, 'trivia'), where('author', '==', 'CRESI'))),
        ]);
        const mapTrivia = (isOwn: boolean) => (d: (typeof ownSnap.docs)[number]): TriviaOption => ({
          id: d.id,
          name: d.data().name,
          questionCount: Array.isArray(d.data().questions) ? d.data().questions.length : 0,
          isOwn,
        });
        setTrivias([...ownSnap.docs.map(mapTrivia(true)), ...cresiSnap.docs.map(mapTrivia(false))]);
      } catch (err) {
        console.error('Error cargando trivias:', err);
      } finally {
        setLoadingTrivias(false);
      }
    })();

    LiveTriviaService.getTeacherSessions(user.uid)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, [user?.uid]);

  const atLimit = sessions.length >= MAX_LIVE_TRIVIA_SESSIONS_PER_TEACHER;
  const totalTriviaPages = Math.max(1, Math.ceil(trivias.length / TRIVIAS_PER_PAGE));
  const currentTriviaPage = Math.min(triviaPage, totalTriviaPages);
  const pageTrivias = trivias.slice(
    (currentTriviaPage - 1) * TRIVIAS_PER_PAGE,
    currentTriviaPage * TRIVIAS_PER_PAGE
  );

  const handleCreate = async () => {
    setError('');
    if (!user?.uid) {
      setError('Debes estar logueado para iniciar una partida.');
      return;
    }
    if (!selectedTriviaId) {
      setError('Elegí qué trivia jugar.');
      return;
    }
    if (atLimit) {
      setError(`Llegaste al máximo de ${MAX_LIVE_TRIVIA_SESSIONS_PER_TEACHER} partidas. Borrá alguna para crear una nueva.`);
      return;
    }

    setCreating(true);
    try {
      const session = await LiveTriviaService.createSession(user.uid, selectedTriviaId);
      router.push(`/docente/trivia-en-vivo/${session.code}`);
    } catch (err) {
      console.error(err);
      setError('No se pudo iniciar la partida. Probá de nuevo.');
      setCreating(false);
    }
  };

  const handleDelete = async (code: string, triviaName: string) => {
    const confirmed = window.confirm(`¿Borrar la partida de "${triviaName}" (${code})? No se puede deshacer.`);
    if (!confirmed) return;

    setDeletingCode(code);
    try {
      await LiveTriviaService.deleteSession(code);
      setSessions((prev) => prev.filter((s) => s.code !== code));
    } catch {
      setError('No se pudo borrar la partida. Probá de nuevo.');
    } finally {
      setDeletingCode(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-pink-light dark:border-gray-700">
          <p className="text-ink/70 dark:text-gray-400">Debes estar logueado para iniciar una partida en vivo.</p>
        </div>
      </div>
    );
  }

  const role = profile?.profile?.role;
  if (role && role !== 'teacher') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-pink-light dark:border-gray-700">
          <p className="text-ink/70 dark:text-gray-400">Esta sección es solo para docentes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${ACCENT}15` }}>
          <IconBolt size={20} style={{ color: ACCENT }} />
        </div>
        <h1 className="text-2xl font-bold text-ink dark:text-gray-100">Trivia en Vivo</h1>
      </div>
      <p className="text-sm text-ink/60 dark:text-gray-400 mb-6">
        Elegí una trivia y jugala en simultáneo con toda la clase, estilo Kahoot — proyectá esta pantalla y tus
        alumnos responden desde el celular con un código, sin necesidad de cuenta.
      </p>

      {/* Crear nueva */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-6 mb-8">
        <label className="block text-sm font-semibold text-ink dark:text-gray-100 mb-2">Qué trivia jugar</label>

        {loadingTrivias ? (
          <p className="text-sm text-ink/40 dark:text-gray-500 py-3">Cargando tus trivias...</p>
        ) : trivias.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-gray-400 py-3">
            Todavía no tenés trivias.{' '}
            <a href="/docente/trivias" className="text-coral-dark hover:underline font-medium">
              Crear una →
            </a>
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-3">
              {pageTrivias.map((t) => {
                const selected = selectedTriviaId === t.id;
                const color = colorForTrivia(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setSelectedTriviaId(t.id); setError(''); }}
                    disabled={atLimit}
                    className={`relative text-left rounded-xl border-2 p-3 transition-all min-w-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                      selected ? 'border-transparent shadow-sm' : 'border-pink-light dark:border-gray-600 hover:border-ink/20'
                    }`}
                    style={selected ? { borderColor: color, backgroundColor: `${color}0D` } : undefined}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2" style={{ backgroundColor: color }}>
                      <IconCards className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-ink dark:text-gray-100 leading-tight mb-0.5 line-clamp-2">{t.name}</p>
                    <p className="text-[10px] text-ink/60 dark:text-gray-400">
                      {t.questionCount} preg.{!t.isOwn ? ' · CrESI' : ''}
                    </p>
                  </button>
                );
              })}
            </div>

            {totalTriviaPages > 1 && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setTriviaPage((p) => Math.max(1, p - 1))}
                  disabled={currentTriviaPage === 1}
                  className="p-1.5 rounded-full border border-pink-light dark:border-gray-700 text-ink/50 dark:text-gray-400 hover:bg-cream dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Página anterior"
                >
                  <IconChevronLeft size={14} />
                </button>
                <span className="text-xs text-ink/50 dark:text-gray-400 px-1">
                  Página {currentTriviaPage} de {totalTriviaPages}
                </span>
                <button
                  type="button"
                  onClick={() => setTriviaPage((p) => Math.min(totalTriviaPages, p + 1))}
                  disabled={currentTriviaPage === totalTriviaPages}
                  className="p-1.5 rounded-full border border-pink-light dark:border-gray-700 text-ink/50 dark:text-gray-400 hover:bg-cream dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Página siguiente"
                >
                  <IconChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl mb-4 flex items-center gap-2">
            <IconCircleX size={16} className="text-red-600 shrink-0" />
            <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={creating || atLimit || trivias.length === 0}
          title={atLimit ? `Máximo ${MAX_LIVE_TRIVIA_SESSIONS_PER_TEACHER} partidas — borrá alguna para crear otra` : undefined}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-full font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}
        >
          <IconPlus size={18} />
          {creating ? 'Creando...' : 'Iniciar partida en vivo'}
        </button>

        {!loadingSessions && (
          <p className="text-xs text-ink/40 dark:text-gray-500 mt-3">
            {sessions.length}/{MAX_LIVE_TRIVIA_SESSIONS_PER_TEACHER} partidas usadas
            {atLimit && ' — borrá alguna de la lista de abajo para crear una nueva'}.
          </p>
        )}
      </div>

      {/* Historial */}
      <h2 className="text-sm font-semibold text-ink dark:text-gray-100 mb-3">Tus partidas</h2>
      {loadingSessions ? (
        <p className="text-sm text-ink/40 dark:text-gray-500">Cargando...</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-ink/40 dark:text-gray-500">Todavía no iniciaste ninguna partida en vivo.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.code}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm px-4 py-3 hover:shadow-md transition-shadow"
            >
              <Link href={`/docente/trivia-en-vivo/${session.code}`} className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink dark:text-gray-100 truncate">{session.triviaName}</p>
                  <p className="text-xs text-ink/50 dark:text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono tracking-widest">{session.code}</span>
                    <span>·</span>
                    {session.phase === 'finished' ? (
                      <span className="flex items-center gap-1 text-ink/40 dark:text-gray-500"><IconCircleX size={13} />Terminada</span>
                    ) : (
                      <span className="flex items-center gap-1 text-green-600"><IconCircleCheck size={13} />En curso</span>
                    )}
                  </p>
                </div>
                <IconArrowRight size={18} className="text-ink/30 dark:text-gray-600 shrink-0" />
              </Link>

              <button
                type="button"
                onClick={() => handleDelete(session.code, session.triviaName)}
                disabled={deletingCode === session.code}
                title="Borrar partida"
                className="shrink-0 p-2 text-ink/30 dark:text-gray-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors disabled:opacity-50"
              >
                <IconTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
