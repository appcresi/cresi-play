'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { IconArrowNarrowLeft, IconArrowNarrowRight, IconUser, IconCalendar, IconListNumbers, IconBolt, IconShare, IconCopy, IconCheck, IconShieldCheck } from '@tabler/icons-react';
import TriviaSettings from '../../../components/TriviaSettings';
import { db } from '@/lib/firebaseFirestore';
import { doc, getDoc } from 'firebase/firestore';
import { getActivityById } from '@/lib/activities';

const ACCENT = getActivityById('trivias')?.color ?? '#1976D2';

interface Trivia {
  id: string;
  name: string;
  author: string;
  level: number;
  questions: any[];
  created_at: string;
  description?: string;
  endorsedBy?: string;
  endorsedByUrl?: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function Page({ params }: PageProps) {
  const [id, setId] = useState<string>('');
  const [data, setData] = useState<Trivia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const resolveParams = async () => {
      const { id: triviaId } = await params;
      setId(triviaId);
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchTrivia = async () => {
      try {
        setLoading(true);
        const triviaRef = doc(db, 'trivia', id);
        const triviaSnap = await getDoc(triviaRef);

        if (!triviaSnap.exists()) {
          throw new Error('Trivia no encontrada');
        }

        const triviaData = triviaSnap.data() as Trivia;
        setData({
          ...triviaData,
          id: triviaSnap.id,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al obtener la trivia';
        setError(errorMessage);
        console.error('Error fetching trivia:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrivia();
  }, [id]);

  const shareLink = data ? `https://jugar.cresi.com.ar/trivias/pregame/${data.id}` : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar el link:', err);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-cream dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-8 text-center">
            <p className="text-ink/70 dark:text-gray-400">Cargando trivia...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-cream dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link
            href="/trivias"
            className="inline-flex items-center gap-2 text-ink/70 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100 mb-6 transition-colors"
          >
            <IconArrowNarrowLeft size={20} />
            <span className="text-sm font-medium">Volver a trivias</span>
          </Link>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-8 text-center">
            <p className="text-red-600">
              {error || 'No se pudo cargar la trivia'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col">
        {/* Back Button */}
        <Link
          href="/trivias"
          className="inline-flex items-center gap-1.5 text-ink/70 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100 mb-3 transition-colors w-fit shrink-0"
        >
          <IconArrowNarrowLeft size={18} />
          <span className="text-sm font-medium">Volver a trivias</span>
        </Link>

        {/* Header Section */}
        <div className="rounded-xl px-6 py-4 text-white shrink-0 mb-3" style={{ background: `linear-gradient(to right, ${ACCENT}, ${ACCENT}CC)` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <IconListNumbers size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs opacity-90">Trivia</p>
              <h1 className="text-xl font-bold truncate">{data.name}</h1>
            </div>
          </div>
        </div>

        {/* Aval institucional — solo se muestra si la trivia tiene una
            organización externa asociada (por ahora, las de látex). Si
            además hay un link cargado, el nombre lleva a la página oficial
            de la entidad. */}
        {data.endorsedBy && (
          <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-3 shrink-0 border bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
            <IconShieldCheck size={20} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              Avalada por{' '}
              {data.endorsedByUrl ? (
                <a
                  href={data.endorsedByUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline hover:text-emerald-900 dark:hover:text-emerald-200"
                >
                  {data.endorsedBy}
                </a>
              ) : (
                <span className="font-semibold">{data.endorsedBy}</span>
              )}
            </p>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Left Column - Info */}
          <div className="lg:col-span-2 flex flex-col gap-3 min-h-0">
            {/* Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-4">
              <h2 className="text-sm font-semibold text-ink dark:text-gray-100 mb-3">Información de la Trivia</h2>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2.5 p-2.5 bg-cream dark:bg-gray-900 rounded-lg">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
                    <IconUser size={16} style={{ color: ACCENT }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-ink/60 dark:text-gray-400">Autor</p>
                    <p className="text-xs font-medium text-ink dark:text-gray-100 truncate">
                      {data.author === 'CRESI' ? 'CrESI' : 'Usuario personalizado'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 bg-cream dark:bg-gray-900 rounded-lg">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
                    <IconBolt size={16} style={{ color: ACCENT }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-ink/60 dark:text-gray-400">Dificultad</p>
                    <p className="text-xs font-medium text-ink dark:text-gray-100">Nivel {data.level}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 bg-cream dark:bg-gray-900 rounded-lg">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
                    <IconListNumbers size={16} style={{ color: ACCENT }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-ink/60 dark:text-gray-400">Preguntas</p>
                    <p className="text-xs font-medium text-ink dark:text-gray-100">{data.questions?.length || 0} preguntas</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-2.5 bg-cream dark:bg-gray-900 rounded-lg">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ACCENT}15` }}>
                    <IconCalendar size={16} style={{ color: ACCENT }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-ink/60 dark:text-gray-400">Creación</p>
                    <p className="text-xs font-medium text-ink dark:text-gray-100 truncate">
                      {new Date(data.created_at).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Play Button */}
            <Link
              href={`/trivias/${data.id}`}
              className="w-full text-white px-6 py-3 rounded-full font-semibold text-base flex items-center justify-center gap-2 transition-colors shadow-sm hover:opacity-90 shrink-0"
              style={{ backgroundColor: ACCENT }}
            >
              Comenzar Trivia
              <IconArrowNarrowRight size={20} />
            </Link>
          </div>

          {/* Right Column - QR Code */}
          <div className="lg:col-span-1 min-h-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 p-4 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <IconShare size={16} className="text-ink/70 dark:text-gray-400" />
                <h2 className="text-sm font-semibold text-ink dark:text-gray-100">Compartir Trivia</h2>
              </div>

              <p className="text-xs text-ink/60 dark:text-gray-400 mb-3">
                Escaneá el QR o copiá el link para compartir
              </p>

              <div className="bg-cream dark:bg-gray-900 p-3 rounded-xl border border-pink-light flex justify-center">
                <QRCode
                  size={130}
                  style={{ height: 'auto', maxWidth: '100%', width: '130px' }}
                  value={shareLink}
                  viewBox={`0 0 256 256`}
                />
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: copied ? '#DCFCE7' : `${ACCENT}15`,
                  color: copied ? '#16A34A' : ACCENT,
                }}
              >
                {copied ? (
                  <>
                    <IconCheck size={16} />
                    ¡Link copiado!
                  </>
                ) : (
                  <>
                    <IconCopy size={16} />
                    Copiar link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Button (Fixed) */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-pink-light dark:border-gray-700 hover:shadow-xl transition-shadow">
          <TriviaSettings />
        </div>
      </div>
    </main>
  );
}