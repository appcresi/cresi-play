'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Fredoka } from 'next/font/google';
import { IconCheck, IconX, IconTrophy, IconMedal, IconClock } from '@tabler/icons-react';
import LiveTriviaService, { QUESTION_DURATION_SECONDS, pointsForAnswer } from '@/lib/liveTriviaService';
import type { LiveTriviaSession, LiveTriviaPlayer, LiveTriviaAnswer } from '@/types/liveTrivia';

const fredoka = Fredoka({ subsets: ['latin'], weight: ['600', '700'], display: 'swap' });
const ACCENT = '#7C3AED';
const OPTION_COLORS = ['#E53935', '#43A047', '#FDD835', '#1E88E5'];

function playerStorageKey(code: string): string {
  return `cresi_livetrivia_player_${code}`;
}

export default function JugarTriviaEnVivoPage(): JSX.Element {
  const { codigo } = useParams<{ codigo: string }>();
  const code = (codigo || '').toUpperCase();

  const [session, setSession] = useState<LiveTriviaSession | null | undefined>(undefined);
  const [players, setPlayers] = useState<LiveTriviaPlayer[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(false);

  const [myAnswer, setMyAnswer] = useState<LiveTriviaAnswer | null | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [remaining, setRemaining] = useState(QUESTION_DURATION_SECONDS);

  useEffect(() => {
    if (!code) return;
    setPlayerId(sessionStorage.getItem(playerStorageKey(code)));
    const unsubSession = LiveTriviaService.subscribeToSession(code, setSession);
    const unsubPlayers = LiveTriviaService.subscribeToPlayers(code, setPlayers);
    return () => {
      unsubSession();
      unsubPlayers();
    };
  }, [code]);

  // Chequeamos si la pregunta ACTUAL ya se respondió — así un refresh a
  // mitad de la pregunta no deja volver a contestar. A propósito solo
  // depende de `currentQuestionIndex`, no de `phase`: tiene que
  // mantenerse (no resetear a `undefined`) al pasar de "pregunta" a
  // "revelar"/"ranking" para la MISMA pregunta, o la pantalla de revelar
  // pierde el rastro de si acertó.
  useEffect(() => {
    if (!code || !playerId || !session) {
      setMyAnswer(undefined);
      return;
    }
    setMyAnswer(undefined);
    // Si esta lectura falla (ej. un corte de red), asumimos "todavía no
    // respondida" en vez de dejar al alumno colgado en "Cargando
    // pregunta..." para siempre — si en realidad ya había respondido, el
    // intento de volver a mandar la respuesta lo bloquea la regla de
    // Firestore igual (el id del documento ya existe).
    LiveTriviaService.getMyAnswerForQuestion(code, playerId, session.currentQuestionIndex)
      .then(setMyAnswer)
      .catch(() => setMyAnswer(null));
  }, [code, playerId, session?.currentQuestionIndex]);

  useEffect(() => {
    if (!session || session.phase !== 'question' || !session.questionStartedAt) return;
    const tick = () => {
      const elapsed = (Date.now() - new Date(session.questionStartedAt as string).getTime()) / 1000;
      setRemaining(Math.max(0, Math.ceil(QUESTION_DURATION_SECONDS - elapsed)));
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [session?.phase, session?.currentQuestionIndex, session?.questionStartedAt]);

  const me = useMemo(() => players.find((p) => p.id === playerId) ?? null, [players, playerId]);
  const sortedPlayers = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const myRank = useMemo(() => (playerId ? sortedPlayers.findIndex((p) => p.id === playerId) + 1 : 0), [sortedPlayers, playerId]);
  const currentQuestion = session ? session.questions[session.currentQuestionIndex] : null;

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setJoining(true);
    setJoinError(false);
    try {
      const id = await LiveTriviaService.joinSession(code, trimmed);
      sessionStorage.setItem(playerStorageKey(code), id);
      setPlayerId(id);
    } catch (err) {
      console.error('Error al unirse a la partida:', err);
      setJoinError(true);
    } finally {
      setJoining(false);
    }
  };

  const handleAnswer = async (optionIndex: number) => {
    // `myAnswer` es `undefined` mientras todavía no sabemos si esta
    // pregunta ya se respondió (evita una carrera si tocan antes de que
    // resuelva `getMyAnswerForQuestion`), y un objeto si YA hay una
    // respuesta guardada — en los dos casos hay que bloquear. Solo se deja
    // contestar cuando quedó confirmado en `null` (sin respuesta todavía).
    if (!session || !playerId || !currentQuestion || submitting || myAnswer === undefined || myAnswer) return;
    setSubmitting(true);
    try {
      const elapsed = (Date.now() - new Date(session.questionStartedAt as string).getTime()) / 1000;
      const correct = optionIndex === currentQuestion.correctIndex;
      const points = pointsForAnswer(correct, elapsed);
      await LiveTriviaService.submitAnswer(code, playerId, session.currentQuestionIndex, optionIndex, correct, points);
      setMyAnswer({
        id: `${playerId}_${session.currentQuestionIndex}`,
        playerId,
        questionIndex: session.currentQuestionIndex,
        optionIndex,
        correct,
        pointsEarned: points,
        answeredAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error al enviar la respuesta:', err);
    } finally {
      setSubmitting(false);
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
        <p className="text-ink/60 dark:text-gray-400 text-sm">No encontramos ninguna partida con el código {code}. Verificalo con tu docente.</p>
      </Shell>
    );
  }

  // Todavía no eligió su nombre / no se unió.
  if (!playerId || !me) {
    if (session.phase !== 'lobby') {
      return (
        <Shell>
          <h1 className={`${fredoka.className} text-lg text-ink dark:text-gray-100 mb-2`}>Ya empezó</h1>
          <p className="text-ink/60 dark:text-gray-400 text-sm">Esta partida ya arrancó — pedile a tu docente que abra una nueva ronda.</p>
        </Shell>
      );
    }
    return (
      <Shell>
        <h1 className={`${fredoka.className} text-xl text-ink dark:text-gray-100 mb-1`}>Trivia en Vivo</h1>
        <p className="text-ink/70 dark:text-gray-300 text-sm mb-5">{session.triviaName}</p>

        {joinError && (
          <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl py-2 px-3 mb-4">
            <IconX size={16} />
            <span>No se pudo unir. Probá de nuevo.</span>
          </div>
        )}

        <form onSubmit={handleJoin}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoFocus
            placeholder="Escribí tu nombre..."
            className="w-full px-3 py-2.5 border border-ink/15 dark:border-gray-600 rounded-xl focus:outline-none
                     focus:ring-2 bg-white dark:bg-gray-700 text-ink dark:text-gray-100 text-sm text-center mb-4"
            style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
          />
          <button
            type="submit"
            disabled={!name.trim() || joining}
            className="w-full text-white py-2.5 px-3 rounded-xl transition-colors font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: ACCENT }}
          >
            {joining ? 'Uniéndote...' : 'Unirme a la partida'}
          </button>
        </form>
      </Shell>
    );
  }

  // ── Lobby: ya se unió, esperando que arranque ──
  if (session.phase === 'lobby') {
    return (
      <Shell>
        <h1 className={`${fredoka.className} text-lg text-ink dark:text-gray-100 mb-2`}>¡Listo, {me.name}!</h1>
        <p className="text-ink/60 dark:text-gray-400 text-sm mb-4">Esperando a que tu docente empiece la partida...</p>
        <div className="flex items-center justify-center gap-1.5 text-xs font-medium" style={{ color: ACCENT }}>
          <IconClock size={14} />
          {players.length} {players.length === 1 ? 'jugador listo' : 'jugadores listos'}
        </div>
      </Shell>
    );
  }

  // ── Pregunta ──
  if (session.phase === 'question' && currentQuestion) {
    const alreadyAnswered = myAnswer !== undefined && myAnswer !== null;
    return (
      <div className="min-h-screen bg-cream dark:bg-gray-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-ink/50 dark:text-gray-500">
              Pregunta {session.currentQuestionIndex + 1} de {session.questions.length}
            </span>
            <span className="text-sm font-bold tabular-nums px-2.5 py-1 rounded-full" style={{ backgroundColor: `${ACCENT}15`, color: ACCENT }}>
              {remaining}s
            </span>
          </div>

          {myAnswer === undefined ? (
            // Todavía estamos chequeando si esta pregunta ya se respondió
            // (por ejemplo, justo después de un refresh) — no mostramos los
            // botones acá para no dar la falsa idea de que ya se puede
            // tocar, cuando por una fracción de segundo no harían nada.
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-pink-light dark:border-gray-700 p-8 text-center">
              <p className="text-ink/40 dark:text-gray-500 text-sm">Cargando pregunta...</p>
            </div>
          ) : alreadyAnswered ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-pink-light dark:border-gray-700 p-8 text-center">
              <IconCheck size={32} className="text-green-600 mx-auto mb-3" />
              <p className="text-ink dark:text-gray-100 font-semibold mb-1">¡Enviado!</p>
              <p className="text-ink/60 dark:text-gray-400 text-sm">Esperando a que respondan los demás...</p>
            </div>
          ) : (
            <>
              <p className="text-white bg-ink dark:bg-gray-800 rounded-xl p-4 text-center font-semibold mb-4">
                {currentQuestion.question}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    disabled={submitting}
                    className="rounded-xl p-5 text-white font-medium text-sm min-h-[80px] flex items-center justify-center text-center transition-transform active:scale-95 disabled:opacity-60"
                    style={{ backgroundColor: OPTION_COLORS[i] }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Revelar ──
  if (session.phase === 'reveal' && currentQuestion) {
    const wasCorrect = myAnswer?.correct === true;
    return (
      <Shell>
        {wasCorrect ? (
          <>
            <IconCheck size={40} className="text-green-600 mx-auto mb-2" />
            <h1 className={`${fredoka.className} text-xl text-ink dark:text-gray-100 mb-1`}>¡Correcto!</h1>
            <p className="text-sm text-ink/60 dark:text-gray-400 mb-3">+{myAnswer?.pointsEarned} puntos</p>
          </>
        ) : (
          <>
            <IconX size={40} className="text-red-500 mx-auto mb-2" />
            <h1 className={`${fredoka.className} text-xl text-ink dark:text-gray-100 mb-1`}>
              {myAnswer ? 'Incorrecto' : 'No respondiste a tiempo'}
            </h1>
            <p className="text-sm text-ink/60 dark:text-gray-400 mb-3">
              La correcta era: <span className="font-semibold">{currentQuestion.options[currentQuestion.correctIndex]}</span>
            </p>
          </>
        )}
        <p className="text-xs text-ink/40 dark:text-gray-500">
          Tu puntaje total: <span className="font-bold" style={{ color: ACCENT }}>{me.score}</span>
        </p>
      </Shell>
    );
  }

  // ── Ranking (entre preguntas) ──
  if (session.phase === 'leaderboard') {
    return (
      <Shell>
        <IconTrophy size={32} style={{ color: ACCENT }} className="mx-auto mb-2" />
        <h1 className={`${fredoka.className} text-lg text-ink dark:text-gray-100 mb-1`}>
          {myRank > 0 ? `Vas ${myRank}° con ${me.score} pts` : 'Ranking'}
        </h1>
        <ul className="text-left space-y-1.5 mt-4">
          {sortedPlayers.slice(0, 5).map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${
                p.id === playerId ? 'bg-cream dark:bg-gray-700 font-semibold' : ''
              }`}
            >
              <span className="text-ink dark:text-gray-100">{i + 1}. {p.name}</span>
              <span style={{ color: ACCENT }}>{p.score}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink/40 dark:text-gray-500 mt-4">Esperando la próxima pregunta...</p>
      </Shell>
    );
  }

  // ── Terminada ──
  return (
    <Shell>
      <IconMedal size={36} style={{ color: ACCENT }} className="mx-auto mb-2" />
      <h1 className={`${fredoka.className} text-xl text-ink dark:text-gray-100 mb-1`}>¡Partida terminada!</h1>
      <p className="text-sm text-ink/60 dark:text-gray-400 mb-4">
        Terminaste {myRank > 0 ? `${myRank}°` : ''} con <span className="font-bold" style={{ color: ACCENT }}>{me.score}</span> puntos.
      </p>
      <ul className="text-left space-y-1.5">
        {sortedPlayers.slice(0, 5).map((p, i) => (
          <li
            key={p.id}
            className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-sm ${
              p.id === playerId ? 'bg-cream dark:bg-gray-700 font-semibold' : ''
            }`}
          >
            <span className="text-ink dark:text-gray-100">{i + 1}. {p.name}</span>
            <span style={{ color: ACCENT }}>{p.score}</span>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
