'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Fredoka } from 'next/font/google';
import { IconSend, IconCircleCheck, IconAlertCircle } from '@tabler/icons-react';
import WordCloudService from '@/lib/wordCloudService';
import type { WordCloudSession } from '@/types/wordcloud';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });
const ACCENT = '#00897B';

export default function EnviarPalabraPage(): JSX.Element {
  const { codigo } = useParams<{ codigo: string }>();
  const code = (codigo || '').toUpperCase();

  const [session, setSession] = useState<WordCloudSession | null | undefined>(undefined);
  const [word, setWord] = useState('');
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState<string | null>(null);
  const [sendError, setSendError] = useState(false);

  useEffect(() => {
    if (!code) return;
    // onSnapshot en vez de un getDoc único: si el/la docente termina la
    // sala mientras un alumno tiene esta pantalla abierta, se entera al
    // toque en vez de poder seguir mandando palabras a una nube cerrada.
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
    } catch (err) {
      // Antes esto se tragaba el error en silencio y el alumno veía el
      // mismo cartel de "¡listo!" aunque la palabra nunca hubiera llegado
      // a la nube (por ejemplo, sin conexión un instante). Ahora se avisa.
      console.error('Error al enviar la palabra:', err);
      setSendError(true);
    } finally {
      setSending(false);
    }
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-br from-cream to-pink dark:from-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-sm w-full border border-ink/8 dark:border-gray-700 p-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <Image src="/logocresi.svg" alt="CrESI" width={56} height={56} className="w-14 h-14" />
        </div>
        {children}
      </div>
    </div>
  );

  if (session === undefined) {
    return <Shell><p className="text-ink/50 dark:text-gray-500 text-sm">Cargando...</p></Shell>;
  }

  if (session === null) {
    return (
      <Shell>
        <h1 className={`${fredoka.className} text-lg text-ink dark:text-gray-100 mb-2`}>Código inválido</h1>
        <p className="text-ink/60 dark:text-gray-400 text-sm">No encontramos ninguna nube de palabras con el código {code}. Verificalo con tu docente.</p>
      </Shell>
    );
  }

  if (!session.active) {
    return (
      <Shell>
        <h1 className={`${fredoka.className} text-lg text-ink dark:text-gray-100 mb-2`}>Esta nube ya cerró</h1>
        <p className="text-ink/60 dark:text-gray-400 text-sm">Tu docente terminó de recibir palabras para esta actividad. ¡Gracias por participar!</p>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className={`${fredoka.className} text-xl text-ink dark:text-gray-100 mb-1`}>Nube de Palabras</h1>
      {session.title && <p className="text-ink/70 dark:text-gray-300 text-sm mb-5">{session.title}</p>}

      {justSent && (
        <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-xl py-2 px-3 mb-4">
          <IconCircleCheck size={16} />
          <span>&quot;{justSent}&quot; ya está en la nube</span>
        </div>
      )}

      {sendError && (
        <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl py-2 px-3 mb-4">
          <IconAlertCircle size={16} />
          <span>No se pudo enviar. Probá de nuevo.</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          maxLength={30}
          autoFocus
          placeholder="Escribí una palabra..."
          className="w-full px-3 py-2.5 border border-ink/15 dark:border-gray-600 rounded-xl focus:outline-none
                   focus:ring-2 bg-white dark:bg-gray-700 text-ink dark:text-gray-100 text-sm text-center mb-4"
          style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
        />

        <button
          type="submit"
          disabled={!word.trim() || sending}
          className="w-full text-white py-2.5 px-3 rounded-xl transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: ACCENT }}
        >
          <IconSend size={16} />
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </form>

      <p className="text-[11px] text-ink/40 dark:text-gray-500 mt-4">Podés mandar más de una palabra si querés.</p>
    </Shell>
  );
}
