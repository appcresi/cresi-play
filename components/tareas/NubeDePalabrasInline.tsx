'use client';

import React, { useEffect, useState } from 'react';
import { IconCloud, IconSend, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';
import WordCloudService from '@/lib/wordCloudService';
import type { WordCloudSession } from '@/types/wordcloud';

const ACCENT = '#00897B';

/**
 * Versión embebida de "mandar una palabra" para Nube de Palabras, para
 * usar dentro de una tarea sin mandar al alumno a otra página — mismo
 * envío que /nube/[codigo], sin el layout de página completa. No requiere
 * cuenta (los alumnos ya entran sin login a la nube en sí), así que
 * funciona igual estando embebida en la tarea.
 */
export const NubeDePalabrasInline = ({ code, onComplete }: { code: string; onComplete?: () => void }) => {
  const [session, setSession] = useState<WordCloudSession | null | undefined>(undefined);
  const [word, setWord] = useState('');
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState<string | null>(null);
  const [sendError, setSendError] = useState(false);

  useEffect(() => {
    const unsubscribe = WordCloudService.subscribeToSession(code, setSession);
    return unsubscribe;
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = word.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(false);
    try {
      await WordCloudService.submitWord(code, trimmed);
      setJustSent(trimmed);
      setWord('');
      onComplete?.();
    } catch (err) {
      console.error('Error al enviar la palabra:', err);
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  if (session === undefined) {
    return <p className="text-sm text-ink/40 dark:text-gray-500 py-4">Cargando...</p>;
  }

  if (session === null) {
    return <p className="text-sm text-ink/60 dark:text-gray-400">No encontramos ninguna nube con el código {code}.</p>;
  }

  if (!session.active) {
    return (
      <div>
        <p className="text-sm font-medium text-ink dark:text-gray-100 mb-1">Esta nube ya cerró</p>
        <p className="text-sm text-ink/60 dark:text-gray-400">Tu docente terminó de recibir palabras para esta actividad.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
          <IconCloud size={18} style={{ color: ACCENT }} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-ink dark:text-gray-100">Nube de Palabras</h3>
          {session.title && <p className="text-xs text-ink/50 dark:text-gray-400">{session.title}</p>}
        </div>
      </div>

      {justSent && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-xl py-2 px-3 mb-3">
          <IconCircleCheck size={16} className="shrink-0" />
          <span>&quot;{justSent}&quot; ya está en la nube</span>
        </div>
      )}

      {sendError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl py-2 px-3 mb-3">
          <IconAlertCircle size={16} className="shrink-0" />
          <span>No se pudo enviar. Probá de nuevo.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          maxLength={30}
          placeholder="Escribí una palabra..."
          className="flex-1 px-3 py-2.5 border border-pink-light dark:border-gray-700 rounded-xl focus:outline-none
                   focus:ring-2 bg-white dark:bg-gray-800 text-ink dark:text-gray-100 text-sm"
          style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
        />
        <button
          type="submit"
          disabled={!word.trim() || sending}
          className="px-4 py-2.5 text-white rounded-xl transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          style={{ backgroundColor: ACCENT }}
        >
          <IconSend size={16} />
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      <p className="text-[11px] text-ink/40 dark:text-gray-500 mt-2">Podés mandar más de una palabra si querés.</p>
    </div>
  );
};
