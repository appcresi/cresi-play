'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconCloud, IconPlus, IconArrowRight, IconCircleCheck, IconCircleX, IconTrash } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import WordCloudService, { MAX_SESSIONS_PER_TEACHER } from '@/lib/wordCloudService';
import type { WordCloudSession } from '@/types/wordcloud';

const ACCENT = '#00897B';

export default function NubeDePalabrasPage(): JSX.Element {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const [sessions, setSessions] = useState<WordCloudSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    WordCloudService.getTeacherSessions(user.uid)
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, [user?.uid]);

  const atLimit = sessions.length >= MAX_SESSIONS_PER_TEACHER;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user?.uid) {
      setError('Debes estar logueado para crear una nube de palabras.');
      return;
    }
    if (atLimit) {
      setError(`Llegaste al máximo de ${MAX_SESSIONS_PER_TEACHER} nubes. Borrá alguna para crear una nueva.`);
      return;
    }

    setCreating(true);
    try {
      const session = await WordCloudService.createSession(user.uid, title);
      router.push(`/docente/nube-de-palabras/${session.code}`);
    } catch (err) {
      setError('No se pudo crear la nube. Probá de nuevo.');
      setCreating(false);
    }
  };

  const handleDelete = async (code: string, sessionTitle: string) => {
    const confirmed = window.confirm(
      `¿Borrar la nube "${sessionTitle || 'Sin consigna'}" (${code})? Esto borra también todas las palabras que recibió. No se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingCode(code);
    try {
      await WordCloudService.deleteSession(code);
      setSessions((prev) => prev.filter((s) => s.code !== code));
    } catch {
      setError('No se pudo borrar la nube. Probá de nuevo.');
    } finally {
      setDeletingCode(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-pink-light dark:border-gray-700">
          <p className="text-ink/70 dark:text-gray-400">Debes estar logueado para crear una nube de palabras.</p>
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
          <IconCloud size={20} style={{ color: ACCENT }} />
        </div>
        <h1 className="text-2xl font-bold text-ink dark:text-gray-100">Nube de Palabras</h1>
      </div>
      <p className="text-sm text-ink/60 dark:text-gray-400 mb-6">
        Creá una sala, proyectala en el aula, y tus alumnos mandan palabras desde el celular con un código —
        sin necesidad de cuenta. La nube se actualiza sola, en vivo.
      </p>

      {/* Crear nueva */}
      <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-6 mb-8">
        <label htmlFor="wc-title" className="block text-sm font-semibold text-ink dark:text-gray-100 mb-2">
          Pregunta o consigna <span className="font-normal text-ink/40 dark:text-gray-500">(opcional)</span>
        </label>
        <input
          id="wc-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: ¿Qué palabra te viene a la mente cuando pensás en consentimiento?"
          maxLength={120}
          disabled={atLimit}
          className="w-full px-4 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 mb-4 disabled:opacity-50"
          style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
        />

        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl mb-4 flex items-center gap-2">
            <IconCircleX size={16} className="text-red-600 shrink-0" />
            <p className="text-red-600 dark:text-red-400 text-xs">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={creating || atLimit}
          title={atLimit ? `Máximo ${MAX_SESSIONS_PER_TEACHER} nubes — borrá alguna para crear otra` : undefined}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-full font-semibold hover:opacity-90 transition-colors disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}
        >
          <IconPlus size={18} />
          {creating ? 'Creando...' : 'Crear nueva nube'}
        </button>

        {!loadingSessions && (
          <p className="text-xs text-ink/40 dark:text-gray-500 mt-3">
            {sessions.length}/{MAX_SESSIONS_PER_TEACHER} nubes usadas
            {atLimit && ' — borrá alguna de la lista de abajo para crear una nueva'}.
          </p>
        )}
      </form>

      {/* Historial */}
      <h2 className="text-sm font-semibold text-ink dark:text-gray-100 mb-3">Tus nubes</h2>
      {loadingSessions ? (
        <p className="text-sm text-ink/40 dark:text-gray-500">Cargando...</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-ink/40 dark:text-gray-500">Todavía no creaste ninguna nube de palabras.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.code}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm px-4 py-3 hover:shadow-md transition-shadow"
            >
              <Link href={`/docente/nube-de-palabras/${session.code}`} className="flex-1 min-w-0 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink dark:text-gray-100 truncate">
                    {session.title || 'Sin consigna'}
                  </p>
                  <p className="text-xs text-ink/50 dark:text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono tracking-widest">{session.code}</span>
                    <span>·</span>
                    {session.active ? (
                      <span className="flex items-center gap-1 text-green-600"><IconCircleCheck size={13} />Activa</span>
                    ) : (
                      <span className="flex items-center gap-1 text-ink/40 dark:text-gray-500"><IconCircleX size={13} />Cerrada</span>
                    )}
                  </p>
                </div>
                <IconArrowRight size={18} className="text-ink/30 dark:text-gray-600 shrink-0" />
              </Link>

              <button
                type="button"
                onClick={() => handleDelete(session.code, session.title)}
                disabled={deletingCode === session.code}
                title="Borrar nube"
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
