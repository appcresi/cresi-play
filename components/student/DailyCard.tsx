'use client';

// Tarjeta de la home del alumno: la racha de días y el reto del día. Va arriba
// del todo, visible también en el celular (antes la racha solo salía en una
// barra lateral que en pantallas chicas no se ve).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconFlame, IconTarget, IconCircleCheck, IconArrowRight } from '@tabler/icons-react';
import UserDataManager from '@/lib/userDataManager';
import ClassroomService from '@/lib/classroomService';
import { getActivityById } from '@/lib/activities';
import { challengeCandidates, type DailyChallengeView } from '@/lib/dailyChallenge';
import { nextPlayDayLabel } from '@/lib/dailyStreak';
import { trackEvent } from '@/lib/analytics';
import type { UserData } from '@/types/user';

export default function DailyCard({ userData, className = 'mb-6' }: { userData: UserData; className?: string }) {
  const classroomId = userData.profile.classroomId ?? null;
  const [state, setState] = useState<{ challenge: DailyChallengeView | null; challengesDone: number } | null>(null);

  // Primero se espera a saber qué actividades habilitó el docente (si tiene
  // clase): hasta entonces no se fija el reto, para no proponer algo que la
  // clase no tiene. Después queda guardado para el resto del día.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const allowed = classroomId
        ? await ClassroomService.getAllowedActivities(classroomId).catch(() => null)
        : null;
      if (cancelled) return;
      const { data, view } = UserDataManager.ensureDailyChallenge(challengeCandidates(allowed));
      setState({ challenge: view, challengesDone: data.progress.challengesCompleted ?? 0 });
    })();
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  const challenge = state?.challenge ?? null;
  const challengesDone = state?.challengesDone ?? userData.progress.challengesCompleted ?? 0;
  const streak = UserDataManager.getStreakView(userData);
  const activity = challenge ? getActivityById(challenge.activityId) : undefined;

  let streakText: string;
  if (streak.current > 0 && streak.playedToday) {
    streakText = `¡Ya sumaste hoy! Volvé ${nextPlayDayLabel()} para llegar a ${streak.current + 1}.`;
  } else if (streak.current > 0) {
    streakText = 'Jugá hoy para mantenerla.';
  } else if (streak.best > 0) {
    streakText = `Empezá una racha nueva hoy. Tu mejor fue de ${streak.best}.`;
  } else {
    streakText = 'Jugá hoy y empezá tu racha.';
  }

  return (
    <section
      aria-label="Tu racha y el reto del día"
      className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}
    >
      <div className="flex items-center gap-3 rounded-xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-gray-800 p-4">
        <IconFlame size={32} className={streak.current > 0 ? 'text-orange-500 shrink-0' : 'text-gray-300 dark:text-gray-600 shrink-0'} />
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {streak.current > 0
              ? `${streak.current} ${streak.current === 1 ? 'día seguido' : 'días seguidos'}`
              : 'Sin racha todavía'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">{streakText}</p>
        </div>
      </div>

      {activity && challenge && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-yellow-200 dark:border-yellow-900/50 bg-yellow-50 dark:bg-gray-800 p-4">
          <div className="flex items-center gap-3 min-w-0">
            {challenge.done ? (
              <IconCircleCheck size={28} className="text-green-600 shrink-0" />
            ) : (
              <IconTarget size={28} className="text-yellow-600 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Reto del día</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {challenge.done ? `¡Cumplido! ${activity.title}` : activity.title}
              </p>
              {challengesDone > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {challengesDone} {challengesDone === 1 ? 'reto cumplido' : 'retos cumplidos'} en total
                </p>
              )}
            </div>
          </div>
          {!challenge.done && (
            <Link
              href={activity.route}
              onClick={() => trackEvent('daily_challenge_click', { activity_id: activity.id })}
              className="inline-flex items-center gap-1 shrink-0 rounded-full bg-gray-900 dark:bg-gray-100 px-3 py-2 text-xs font-medium text-white dark:text-gray-900 hover:opacity-90"
            >
              Jugar <IconArrowRight size={14} />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
