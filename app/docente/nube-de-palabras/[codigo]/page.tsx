'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { IconArrowLeft, IconCopy, IconCheck, IconPlayerStop, IconRefresh, IconMessage2 } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import WordCloudService from '@/lib/wordCloudService';
import type { WordCloudSession, WordCloudEntry } from '@/types/wordcloud';

const ACCENT = '#00897B';

// Paleta rotativa solo para que la nube no se vea de un único color — son
// los mismos acentos que ya usa el resto de la plataforma en otros lados
// (biopuzzle, condón, lenguajes del amor, etc.), no colores nuevos.
const WORD_COLORS = ['#00897B', '#1976D2', '#7B1FA2', '#EC407A', '#F57C00', '#388E3C'];

const MIN_FONT_PX = 16;
const MAX_FONT_PX = 76;

// Hash simple y estable (mismo texto siempre da el mismo número) para
// derivar color/rotación/corrimiento vertical de cada palabra a partir de
// su propio id — así cada una mantiene su "identidad visual" fija mientras
// está en pantalla, en vez de cambiar de color o de tamaño de salto cada
// vez que llega una palabra nueva y la lista se reordena por conteo.
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export default function NubeProyeccionPage(): JSX.Element {
  const { codigo } = useParams<{ codigo: string }>();
  const code = (codigo || '').toUpperCase();
  const { user } = useAuth();

  const [session, setSession] = useState<WordCloudSession | null | undefined>(undefined);
  const [words, setWords] = useState<WordCloudEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!code) return;
    const unsubSession = WordCloudService.subscribeToSession(code, setSession);
    const unsubWords = WordCloudService.subscribeToWords(code, setWords);
    return () => {
      unsubSession();
      unsubWords();
    };
  }, [code]);

  const isOwner = !!user && !!session && user.uid === session.teacherId;
  const joinLink = `https://jugar.cresi.com.ar/nube/${code}`;

  const { minCount, maxCount, totalResponses } = useMemo(() => {
    if (words.length === 0) return { minCount: 0, maxCount: 0, totalResponses: 0 };
    const counts = words.map((w) => w.count);
    return {
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts),
      totalResponses: counts.reduce((sum, c) => sum + c, 0),
    };
  }, [words]);

  const fontSizeFor = (count: number): number => {
    if (maxCount === minCount) return (MIN_FONT_PX + MAX_FONT_PX) / 2;
    const ratio = (count - minCount) / (maxCount - minCount);
    return Math.round(MIN_FONT_PX + ratio * (MAX_FONT_PX - MIN_FONT_PX));
  };

  // Look de nube: cada palabra inclinada y corrida verticalmente un poco,
  // siempre igual para la misma palabra (ver hashString arriba), en vez de
  // filas prolijas todas alineadas sobre la misma línea de base.
  const styleFor = (word: WordCloudEntry): React.CSSProperties => {
    const hash = hashString(word.id);
    const rotation = (hash % 21) - 10; // -10° a 10°
    const offsetY = ((hash >> 4) % 17) - 8; // -8px a 8px
    const color = WORD_COLORS[hash % WORD_COLORS.length];
    return {
      fontSize: `${fontSizeFor(word.count)}px`,
      color,
      transform: `translateY(${offsetY}px) rotate(${rotation}deg)`,
    };
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // portapapeles no disponible — no es crítico, el código y el QR alcanzan.
    }
  };

  const handleDeleteWord = (wordId: string) => {
    if (!isOwner) return;
    WordCloudService.deleteWord(code, wordId).catch(() => {});
  };

  const handleToggleActive = async () => {
    if (!isOwner || !session) return;
    setEnding(true);
    try {
      if (session.active) {
        await WordCloudService.endSession(code);
      } else {
        await WordCloudService.reopenSession(code);
      }
    } finally {
      setEnding(false);
    }
  };

  if (session === undefined) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <p className="text-ink/50 dark:text-gray-500">Cargando...</p>
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/docente/nube-de-palabras" className="inline-flex items-center gap-2 text-ink/60 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100 mb-6">
          <IconArrowLeft size={18} />
          Volver
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 p-8 text-center">
          <p className="text-ink/70 dark:text-gray-400">No encontramos ninguna nube con el código {code}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link href="/docente/nube-de-palabras" className="inline-flex items-center gap-2 text-sm text-ink/60 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100 mb-4">
        <IconArrowLeft size={16} />
        Volver a Nube de Palabras
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel de la sala — código, QR, controles */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-6 lg:order-2">
          {session.title && (
            <p className="text-sm font-semibold text-ink dark:text-gray-100 mb-2">{session.title}</p>
          )}

          <div className="flex items-center gap-1.5 mb-4 text-xs font-medium" style={{ color: ACCENT }}>
            <IconMessage2 size={14} />
            <span>
              {totalResponses} {totalResponses === 1 ? 'palabra recibida' : 'palabras recibidas'}
              {words.length > 0 && ` · ${words.length} ${words.length === 1 ? 'distinta' : 'distintas'}`}
            </span>
          </div>

          <p className="text-xs text-ink/50 dark:text-gray-500 mb-1">Código para entrar</p>
          <p className="font-mono text-4xl font-bold tracking-widest mb-4" style={{ color: ACCENT }}>{code}</p>

          <div className="bg-cream dark:bg-gray-900 p-3 rounded-xl border border-pink-light flex justify-center mb-3">
            <QRCode size={140} style={{ height: 'auto', maxWidth: '100%', width: '140px' }} value={joinLink} viewBox="0 0 256 256" />
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors mb-2"
            style={{ backgroundColor: copied ? '#DCFCE7' : `${ACCENT}15`, color: copied ? '#16A34A' : ACCENT }}
          >
            {copied ? <><IconCheck size={16} />¡Link copiado!</> : <><IconCopy size={16} />Copiar link</>}
          </button>

          <p className="text-xs text-ink/40 dark:text-gray-500 mb-4">jugar.cresi.com.ar/nube/{code}</p>

          {isOwner && (
            <button
              type="button"
              onClick={handleToggleActive}
              disabled={ending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: session.active ? '#DC2626' : ACCENT }}
            >
              {session.active ? <><IconPlayerStop size={16} />Terminar nube</> : <><IconRefresh size={16} />Reabrir nube</>}
            </button>
          )}

          {!session.active && (
            <p className="text-xs text-center text-ink/50 dark:text-gray-500 mt-3">
              Esta nube ya no acepta palabras nuevas.
            </p>
          )}
        </div>

        {/* La nube en vivo */}
        <div className="lg:col-span-2 lg:order-1 bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-6 min-h-[420px] flex items-center justify-center">
          {words.length === 0 ? (
            <p className="text-ink/40 dark:text-gray-500 text-sm text-center">
              Todavía no llegó ninguna palabra.<br />Compartí el código para empezar.
            </p>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 w-full">
              {words.map((word) => (
                <span
                  key={word.id}
                  onClick={() => handleDeleteWord(word.id)}
                  title={isOwner ? 'Tocar para quitar' : undefined}
                  className={`font-bold leading-none inline-block transition-opacity ${isOwner ? 'cursor-pointer hover:opacity-60' : ''}`}
                  style={styleFor(word)}
                >
                  {word.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
