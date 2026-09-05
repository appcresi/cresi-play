'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import {
  IconArrowLeft,
  IconCopy,
  IconCheck,
  IconPlayerPlay,
  IconTrophy,
  IconUsers,
  IconArrowRight,
  IconFlag,
  IconMedal,
} from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import LiveTriviaService, { QUESTION_DURATION_SECONDS } from '@/lib/liveTriviaService';
import type { LiveTriviaSession, LiveTriviaPlayer, LiveTriviaAnswer } from '@/types/liveTrivia';

const ACCENT = '#7C3AED';
const OPTION_COLORS = ['#E53935', '#43A047', '#FDD835', '#1E88E5'];

export default function TriviaEnVivoHostPage(): JSX.Element {
  const { codigo } = useParams<{ codigo: string }>();
  const code = (codigo || '').toUpperCase();
  const { user } = useAuth();

  const [session, setSession] = useState<LiveTriviaSession | null | undefined>(undefined);
  const [players, setPlayers] = useState<LiveTriviaPlayer[]>([]);
  const [answers, setAnswers] = useState<LiveTriviaAnswer[]>([]);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(QUESTION_DURATION_SECONDS);
  const revealedRef = useRef(false);

  useEffect(() => {
    if (!code) return;
    const unsubSession = LiveTriviaService.subscribeToSession(code, setSession);
    const unsubPlayers = LiveTriviaService.subscribeToPlayers(code, setPlayers);
    return () => {
      unsubSession();
      unsubPlayers();
    };
  }, [code]);

  const isOwner = !!user && !!session && user.uid === session.teacherId;

  // Respuestas de la pregunta ACTUAL — a propósito solo depende de
  // `currentQuestionIndex`, no de `phase`: tienen que seguir disponibles
  // al pasar de "pregunta" a "revelar" (para la barra de resultados) y a
  // "ranking", para la MISMA pregunta. Antes se reseteaban a [] apenas se
  // salía de la fase "pregunta", así que la barra de revelar siempre
  // mostraba 0 respuestas.
  useEffect(() => {
    if (!code || !session) {
      setAnswers([]);
      return;
    }
    setAnswers([]); // limpia mientras llega el primer snapshot de la nueva pregunta
    const unsub = LiveTriviaService.subscribeToAnswersForQuestion(code, session.currentQuestionIndex, setAnswers);
    return unsub;
  }, [code, session?.currentQuestionIndex]);

  // Cuenta regresiva + auto-revelar cuando se acaba el tiempo. Solo el/la
  // docente dueño/a de la sala puede escribir `phase` (ver
  // firestore.rules), así que si por algún motivo esta pantalla se abre
  // sin esa sesión (por ejemplo, la autenticación todavía no resolvió al
  // cargar la página), el intento de revelar falla — antes eso dejaba
  // `revealedRef` trabado en `true` para siempre y la partida quedaba
  // congelada sin aviso; ahora, si falla, se reintenta en el próximo tick.
  useEffect(() => {
    if (!session || session.phase !== 'question' || !session.questionStartedAt) return;
    revealedRef.current = false;

    const tick = () => {
      const elapsed = (Date.now() - new Date(session.questionStartedAt as string).getTime()) / 1000;
      const left = Math.max(0, Math.ceil(QUESTION_DURATION_SECONDS - elapsed));
      setRemaining(left);
      if (left <= 0 && !revealedRef.current && isOwner) {
        revealedRef.current = true;
        LiveTriviaService.revealAnswer(code).catch(() => {
          revealedRef.current = false;
        });
      }
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [code, session?.phase, session?.currentQuestionIndex, session?.questionStartedAt, isOwner]);
  const joinLink = `https://jugar.cresi.com.ar/vivo/${code}`;

  const currentQuestion = session ? session.questions[session.currentQuestionIndex] : null;
  const isLastQuestion = session ? session.currentQuestionIndex >= session.questions.length - 1 : false;

  const answerCounts = useMemo(() => {
    const counts = [0, 0, 0, 0];
    answers.forEach((a) => {
      if (a.optionIndex >= 0 && a.optionIndex < 4) counts[a.optionIndex] += 1;
    });
    return counts;
  }, [answers]);

  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // portapapeles no disponible — no es crítico, el código y el QR alcanzan.
    }
  };

  const handleNext = async () => {
    if (!session) return;
    if (isLastQuestion) {
      await LiveTriviaService.endGame(code);
    } else {
      await LiveTriviaService.nextQuestion(code, session.currentQuestionIndex + 1);
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
        <Link href="/docente/trivia-en-vivo" className="inline-flex items-center gap-2 text-ink/60 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100 mb-6">
          <IconArrowLeft size={18} />
          Volver
        </Link>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 p-8 text-center">
          <p className="text-ink/70 dark:text-gray-400">No encontramos ninguna partida con el código {code}.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/docente/trivia-en-vivo" className="inline-flex items-center gap-2 text-sm text-ink/60 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100 mb-4">
        <IconArrowLeft size={16} />
        Volver a Trivia en Vivo
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-6 mb-4">
        <p className="text-xs text-ink/50 dark:text-gray-500 mb-1">{session.triviaName}</p>
        <div className="flex items-center gap-1.5 text-xs font-medium mb-4" style={{ color: ACCENT }}>
          <IconUsers size={14} />
          <span>{players.length} {players.length === 1 ? 'jugador' : 'jugadores'}</span>
        </div>

        {/* ── Lobby ── */}
        {session.phase === 'lobby' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="text-center md:text-left">
              <p className="text-xs text-ink/50 dark:text-gray-500 mb-1">Código para entrar</p>
              <p className="font-mono text-4xl font-bold tracking-widest mb-4" style={{ color: ACCENT }}>{code}</p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors mb-4"
                style={{ backgroundColor: copied ? '#DCFCE7' : `${ACCENT}15`, color: copied ? '#16A34A' : ACCENT }}
              >
                {copied ? <><IconCheck size={16} />¡Link copiado!</> : <><IconCopy size={16} />Copiar link</>}
              </button>
              <p className="text-xs text-ink/40 dark:text-gray-500 mb-4">jugar.cresi.com.ar/vivo/{code}</p>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => LiveTriviaService.startGame(code)}
                  disabled={players.length === 0}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}
                >
                  <IconPlayerPlay size={18} />
                  Empezar
                </button>
              )}
              {players.length === 0 && (
                <p className="text-xs text-ink/40 dark:text-gray-500 mt-2">Esperando a que se sume al menos un jugador...</p>
              )}
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="bg-cream dark:bg-gray-900 p-3 rounded-xl border border-pink-light flex justify-center">
                <QRCode size={140} style={{ height: 'auto', maxWidth: '100%', width: '140px' }} value={joinLink} viewBox="0 0 256 256" />
              </div>
              <div className="flex flex-wrap justify-center gap-2 w-full">
                {players.map((p) => (
                  <span key={p.id} className="px-3 py-1.5 bg-cream dark:bg-gray-900/40 rounded-full text-xs font-medium text-ink dark:text-gray-100">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Pregunta ── */}
        {session.phase === 'question' && currentQuestion && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-ink/50 dark:text-gray-500">
                Pregunta {session.currentQuestionIndex + 1} de {session.questions.length}
              </span>
              <span
                className="text-lg font-bold tabular-nums px-3 py-1 rounded-full"
                style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}
              >
                {remaining}s
              </span>
            </div>

            <p className="text-xl font-semibold text-ink dark:text-gray-100 text-center mb-6">{currentQuestion.question}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {currentQuestion.options.map((opt, i) => (
                <div
                  key={i}
                  className="rounded-xl p-4 text-white font-medium text-sm flex items-center gap-2"
                  style={{ backgroundColor: OPTION_COLORS[i] }}
                >
                  {opt}
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-ink/60 dark:text-gray-400">
              {answers.length} / {players.length} respondieron
            </p>

            {isOwner && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => LiveTriviaService.revealAnswer(code)}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: ACCENT }}
                >
                  Mostrar respuesta
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Revelar ── */}
        {session.phase === 'reveal' && currentQuestion && (
          <div>
            <p className="text-lg font-semibold text-ink dark:text-gray-100 text-center mb-6">{currentQuestion.question}</p>

            <div className="space-y-2.5 mb-6">
              {currentQuestion.options.map((opt, i) => {
                const count = answerCounts[i];
                const total = answers.length || 1;
                const pct = Math.round((count / total) * 100);
                const isCorrect = i === currentQuestion.correctIndex;
                return (
                  <div key={i} className="relative rounded-lg overflow-hidden border" style={{ borderColor: isCorrect ? '#16A34A' : 'transparent' }}>
                    <div
                      className="absolute inset-y-0 left-0 opacity-25"
                      style={{ width: `${pct}%`, backgroundColor: OPTION_COLORS[i] }}
                    />
                    <div className="relative flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm font-medium text-ink dark:text-gray-100 flex items-center gap-2">
                        {isCorrect && <IconCheck size={16} className="text-green-600" />}
                        {opt}
                      </span>
                      <span className="text-xs text-ink/60 dark:text-gray-400">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {currentQuestion.resume && (
              <p className="text-sm text-ink/60 dark:text-gray-400 bg-cream dark:bg-gray-900/40 rounded-lg p-3 mb-4">{currentQuestion.resume}</p>
            )}

            {isOwner && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => LiveTriviaService.showLeaderboard(code)}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: ACCENT }}
                >
                  <IconTrophy size={16} />
                  Ver ranking
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Ranking (entre preguntas) ── */}
        {session.phase === 'leaderboard' && (
          <div>
            <h2 className="text-center text-lg font-semibold text-ink dark:text-gray-100 mb-4 flex items-center justify-center gap-2">
              <IconTrophy size={20} style={{ color: ACCENT }} />
              Ranking
            </h2>
            <ul className="space-y-2 mb-6 max-w-md mx-auto">
              {sortedPlayers.slice(0, 10).map((p, i) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2.5 bg-cream dark:bg-gray-900/40 rounded-lg">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-ink dark:text-gray-100">
                    <span className="w-5 text-center text-ink/40 dark:text-gray-500">{i + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-sm font-bold" style={{ color: ACCENT }}>{p.score}</span>
                </li>
              ))}
            </ul>

            {isOwner && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white transition-colors"
                  style={{ backgroundColor: ACCENT }}
                >
                  {isLastQuestion ? <><IconFlag size={16} />Ver resultados finales</> : <>Siguiente pregunta<IconArrowRight size={16} /></>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Terminada ── */}
        {session.phase === 'finished' && (
          <div>
            <h2 className="text-center text-xl font-bold text-ink dark:text-gray-100 mb-6 flex items-center justify-center gap-2">
              <IconMedal size={24} style={{ color: ACCENT }} />
              ¡Partida terminada!
            </h2>

            <div className="flex items-end justify-center gap-3 mb-8">
              {[1, 0, 2].map((podiumIndex) => {
                const p = sortedPlayers[podiumIndex];
                if (!p) return <div key={podiumIndex} className="w-20" />;
                const heights = ['h-28', 'h-20', 'h-14'];
                const place = podiumIndex === 0 ? 1 : podiumIndex === 1 ? 2 : 3;
                return (
                  <div key={p.id} className="flex flex-col items-center w-20">
                    <p className="text-xs font-semibold text-ink dark:text-gray-100 truncate w-full text-center mb-1">{p.name}</p>
                    <p className="text-[11px] text-ink/50 dark:text-gray-500 mb-1">{p.score} pts</p>
                    <div
                      className={`w-full ${heights[podiumIndex]} rounded-t-lg flex items-start justify-center pt-1.5 text-white font-bold`}
                      style={{ backgroundColor: place === 1 ? '#F59E0B' : place === 2 ? '#94A3B8' : '#B45309' }}
                    >
                      {place}
                    </div>
                  </div>
                );
              })}
            </div>

            <ul className="space-y-2 mb-6 max-w-md mx-auto">
              {sortedPlayers.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2 bg-cream dark:bg-gray-900/40 rounded-lg">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-ink dark:text-gray-100">
                    <span className="w-5 text-center text-ink/40 dark:text-gray-500">{i + 1}</span>
                    {p.name}
                  </span>
                  <span className="text-sm font-bold" style={{ color: ACCENT }}>{p.score}</span>
                </li>
              ))}
            </ul>

            <div className="text-center">
              <Link
                href="/docente/trivia-en-vivo"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white transition-colors"
                style={{ backgroundColor: ACCENT }}
              >
                Volver a Trivia en Vivo
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
