'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LeaderboardBoard from '@/components/leaderboard/LeaderboardBoard';
import MyRankingCard from '@/components/leaderboard/MyRankingCard';

export default function RankingClient() {
  // Al sumarse o salir, la tabla se vuelve a pedir para que se vea el cambio.
  const [refreshKey, setRefreshKey] = useState(0);
  const { user, loading } = useAuth();

  return (
    <main className="min-h-screen bg-cream dark:bg-gray-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Sin sesión no hay header: que haya una forma de volver. */}
        {!user && !loading && (
          <Link href="/" className="inline-block mb-4 text-sm font-semibold text-coral-dark hover:underline">
            ← Volver al inicio
          </Link>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-ink dark:text-gray-100">Ranking</h1>
        <p className="mt-1 mb-6 text-sm text-ink/60 dark:text-gray-400">
          Quienes más puntos sumaron jugando por su cuenta. El semanal arranca de cero cada lunes.
        </p>
        <div className="grid gap-5 md:grid-cols-[1fr_320px] items-start">
          <LeaderboardBoard limit={20} refreshKey={refreshKey} />
          <MyRankingCard onChange={() => setRefreshKey((k) => k + 1)} />
        </div>
      </div>
    </main>
  );
}
