'use client';

// Mi lugar en el ranking: sumarse (voluntario, mostrando antes cómo va a
// aparecer), ver la posición, salir, y para invitados, vincular Google.
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { IconArrowRight, IconEyeOff, IconTrophy } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import { fetchMyRanking, joinLeaderboard, leaveLeaderboard } from '@/lib/leaderboardClient';
import { publicAlias, type LeaderboardMe } from '@/lib/leaderboard';
import GuestLinkButton from './GuestLinkButton';

function Position({ label, rank, score }: { label: string; rank: number | null; score: number }) {
  return (
    <div className="flex-1 rounded-2xl bg-cream dark:bg-gray-900 p-3">
      <p className="text-xs font-medium text-ink/55 dark:text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-ink dark:text-gray-100 tabular-nums">{rank ? `#${rank}` : '—'}</p>
      <p className="text-xs text-ink/55 dark:text-gray-400 tabular-nums">{score.toLocaleString('es-AR')} pts</p>
    </div>
  );
}

export default function MyRankingCard({ onChange }: { onChange?: () => void }) {
  const { user, profile, loading } = useAuth();
  const [me, setMe] = useState<LeaderboardMe | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetchMyRanking()
      .then(setMe)
      .catch((err) => console.error('❌ Error cargando mi ranking:', err));
  }, []);

  // `profile` cambia al vincular Google o al cambiar de cuenta. Sin sesión
  // la tarjeta no usa `me` (muestra la invitación a jugar).
  useEffect(() => {
    if (user) load();
  }, [user, profile, load]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="rounded-3xl bg-coral text-white p-5">
        <p className="font-bold text-lg">¿Querés aparecer acá?</p>
        <p className="text-sm text-white/85 mt-1">Jugá por tu cuenta, sumá puntos y entrá al ranking de la semana.</p>
        <Link href="/unirse" className="mt-4 inline-flex items-center gap-2 bg-white text-coral font-bold px-5 py-2.5 rounded-full hover:scale-105 transition-transform">
          Empezar a jugar <IconArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const cardClass = 'rounded-3xl bg-white dark:bg-gray-800 border border-ink/8 dark:border-gray-700 shadow-sm p-5';

  if (me && !me.eligible) {
    return (
      <div className={cardClass}>
        <p className="text-sm text-ink/70 dark:text-gray-300">
          {profile?.profile?.classroomId
            ? 'El ranking es para quienes juegan por su cuenta. Tu clase tiene su propio ranking con tu docente.'
            : 'El ranking es para quienes juegan por su cuenta.'}
        </p>
      </div>
    );
  }

  const run = async (action: () => Promise<LeaderboardMe>, failMsg: string) => {
    setBusy(true);
    setError('');
    try {
      setMe(await action());
      onChange?.();
    } catch (err) {
      console.error('❌', failMsg, err);
      setError(failMsg);
    } finally {
      setBusy(false);
    }
  };

  const isGuest = user.isAnonymous;
  const alias = me?.alias ?? publicAlias(profile?.profile?.username);

  return (
    <div className={cardClass}>
      {me?.optIn ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold text-ink dark:text-gray-100 flex items-center gap-2">
              <IconTrophy className="w-5 h-5 text-gold-accent" /> Tu lugar
            </p>
            <span className="text-xs text-ink/50 dark:text-gray-400">como <strong>{me.alias}</strong></span>
          </div>
          <div className="mt-3 flex gap-3">
            <Position label="Esta semana" rank={me.week.rank} score={me.week.score} />
            <Position label="Histórico" rank={me.allTime.rank} score={me.allTime.score} />
          </div>
          {me.week.score === 0 && (
            <p className="mt-2 text-xs text-ink/55 dark:text-gray-400">Jugá una actividad para sumar tus primeros puntos de la semana.</p>
          )}
        </>
      ) : (
        <>
          <p className="font-bold text-ink dark:text-gray-100 flex items-center gap-2">
            <IconTrophy className="w-5 h-5 text-gold-accent" /> Sumate al ranking
          </p>
          <p className="mt-1 text-sm text-ink/70 dark:text-gray-300">
            Vas a aparecer como <strong>{alias}</strong> con tu personaje. Nunca mostramos tu email ni tu nombre completo.
          </p>
          <button
            type="button"
            disabled={busy || !me}
            onClick={() => run(joinLeaderboard, 'No pudimos sumarte. Probá de nuevo.')}
            className="mt-3 w-full px-4 py-2.5 rounded-full bg-coral hover:bg-coral-dark text-white font-bold disabled:opacity-60"
          >
            {busy ? 'Sumándote…' : 'Sumarme al ranking'}
          </button>
          <p className="mt-2 text-xs text-ink/50 dark:text-gray-400">Podés salir cuando quieras.</p>
        </>
      )}

      {isGuest && (
        <div className="mt-4 pt-4 border-t border-ink/8 dark:border-gray-700">
          <p className="text-sm text-ink/70 dark:text-gray-300 mb-2">
            Estás jugando como invitado: si borrás los datos del navegador o cambiás de dispositivo, perdés tu progreso{me?.optIn ? ' y tu lugar en el ranking' : ''}.
          </p>
          <GuestLinkButton onDone={load} />
        </div>
      )}

      {me?.optIn && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(leaveLeaderboard, 'No pudimos sacarte del ranking. Probá de nuevo.')}
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-ink/50 dark:text-gray-400 hover:text-coral-dark"
        >
          <IconEyeOff className="w-3.5 h-3.5" /> Salir del ranking
        </button>
      )}

      {error && <p className="mt-2 text-xs text-coral-dark">{error}</p>}
    </div>
  );
}
