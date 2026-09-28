'use client';

// Tabla del ranking del modo libre (semanal / histórico). Es pública: la usan
// la landing, antes de loguearse, y la página /ranking.
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { IconTrophy, IconUserQuestion } from '@tabler/icons-react';
import { fetchLeaderboard } from '@/lib/leaderboardClient';
import type { LeaderboardResponse, LeaderboardRow } from '@/lib/leaderboard';

type Tab = 'week' | 'allTime';

const MEDALS = ['bg-[#FFD54F] text-[#7A5A00]', 'bg-[#E0E0E0] text-[#555]', 'bg-[#F4B183] text-[#7A3E12]'];

function resetLabel(resetsAt: string): string {
  const ms = new Date(resetsAt).getTime() - Date.now();
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `Se reinicia en ${days} ${days === 1 ? 'día' : 'días'}`;
  const hours = Math.max(1, Math.ceil(ms / 3_600_000));
  return `Se reinicia en ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
}

function Row({ row }: { row: LeaderboardRow }) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
          MEDALS[row.rank - 1] ?? 'bg-ink/5 dark:bg-gray-700 text-ink/60 dark:text-gray-300'
        }`}
      >
        {row.rank}
      </span>
      <span className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-pink dark:bg-gray-700 flex items-center justify-center">
        {row.characterImage ? (
          <Image src={row.characterImage} alt="" width={36} height={36} className="object-cover" />
        ) : (
          <IconUserQuestion className="w-5 h-5 text-coral" />
        )}
      </span>
      <span className="min-w-0 flex-1 flex items-center gap-2">
        <span className="truncate font-semibold text-sm text-ink dark:text-gray-100">{row.name}</span>
        {row.guest && (
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-ink/5 dark:bg-gray-700 text-ink/50 dark:text-gray-400">
            invitado
          </span>
        )}
      </span>
      <span className="shrink-0 tabular-nums font-bold text-sm text-coral-dark dark:text-coral">
        {row.score.toLocaleString('es-AR')}
      </span>
    </li>
  );
}

export default function LeaderboardBoard({
  limit = 10,
  className = '',
  refreshKey = 0,
}: {
  limit?: number;
  className?: string;
  /** Cambiarlo vuelve a pedir el ranking (p. ej. después de sumarse). */
  refreshKey?: number;
}) {
  const [tab, setTab] = useState<Tab>('week');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchLeaderboard()
      .then((d) => { if (!cancelled) { setData(d); setFailed(false); } })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const rows = data ? (tab === 'week' ? data.week : data.allTime).slice(0, limit) : [];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-3xl border border-ink/8 dark:border-gray-700 shadow-sm p-5 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="flex items-center gap-2 font-bold text-ink dark:text-gray-100">
          <IconTrophy className="w-5 h-5 text-gold-accent" />
          Ranking
        </h3>
        <div role="tablist" aria-label="Período del ranking" className="flex rounded-full bg-cream dark:bg-gray-900 p-1 text-xs font-semibold">
          {([['week', 'Esta semana'], ['allTime', 'Histórico']] as const).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`px-3 py-1.5 rounded-full transition-colors ${
                tab === id ? 'bg-coral text-white' : 'text-ink/60 dark:text-gray-400 hover:text-ink dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!data && !failed && (
        <ul aria-hidden className="divide-y divide-ink/5 dark:divide-gray-700">
          {Array.from({ length: Math.min(limit, 5) }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 py-2.5">
              <span className="w-7 h-7 rounded-full bg-ink/5 dark:bg-gray-700 animate-pulse" />
              <span className="w-9 h-9 rounded-full bg-ink/5 dark:bg-gray-700 animate-pulse" />
              <span className="h-3 flex-1 rounded bg-ink/5 dark:bg-gray-700 animate-pulse" />
            </li>
          ))}
        </ul>
      )}

      {failed && (
        <p className="py-6 text-center text-sm text-ink/50 dark:text-gray-400">No pudimos cargar el ranking. Probá de nuevo en un rato.</p>
      )}

      {data && rows.length === 0 && (
        <p className="py-6 text-center text-sm text-ink/60 dark:text-gray-400">
          {tab === 'week'
            ? 'Todavía nadie sumó puntos esta semana. ¡Podés ser la primera persona!'
            : 'Todavía no hay nadie en el ranking. ¡Sumate!'}
        </p>
      )}

      {rows.length > 0 && (
        <ol className="divide-y divide-ink/5 dark:divide-gray-700">
          {rows.map((row) => <Row key={`${tab}-${row.rank}`} row={row} />)}
        </ol>
      )}

      {data && tab === 'week' && (
        <p className="mt-3 text-xs text-ink/45 dark:text-gray-500">{resetLabel(data.resetsAt)} · lunes 00:00</p>
      )}
    </div>
  );
}
