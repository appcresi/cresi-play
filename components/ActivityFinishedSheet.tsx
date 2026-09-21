'use client';

// Pantalla final común de las actividades: cuando alguna avisa que terminó
// (lib/activityFinished.ts), muestra una tarjeta abajo con la racha, el reto
// del día y qué hacer ahora. No tapa el resultado de cada juego y se puede
// cerrar; se va sola si la persona cambia de página.
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconFlame, IconArrowRight, IconX, IconCircleCheck, IconTarget } from '@tabler/icons-react';
import { useAuth } from '@/context/AuthContext';
import UserDataManager from '@/lib/userDataManager';
import ClassroomService from '@/lib/classroomService';
import { ACTIVITIES, getActivityById } from '@/lib/activities';
import { ACTIVITY_FINISHED_EVENT, type ActivityFinishedDetail } from '@/lib/activityFinished';
import { challengeCandidates } from '@/lib/dailyChallenge';
import { nextPlayDayLabel, reachedMilestone, type StreakView } from '@/lib/dailyStreak';
import { trackEvent } from '@/lib/analytics';

/** Espera antes de mostrarla, para no pisar la animación final de cada juego. */
const SHOW_DELAY_MS = 900;

interface Summary {
  /** Página donde terminó: si la persona cambia de página, la tarjeta deja de mostrarse. */
  path: string;
  finishedTitle: string;
  streak: StreakView;
  challengeJustDone: boolean;
  /** Reto de hoy pendiente (null si ya lo cumplió, no hay o es esta misma actividad). */
  pendingChallenge: { id: string; title: string; route: string } | null;
  /** Otra actividad para seguir (null si ya hizo todo lo disponible). */
  next: { id: string; title: string; route: string } | null;
}

/** Otra actividad repetible que todavía no completó, en el orden del catálogo. */
function suggestNext(finishedTitle: string, completed: string[], allowed: string[] | null, skipId?: string) {
  const pool = challengeCandidates(allowed);
  return ACTIVITIES.find(
    (a) => pool.includes(a.id) && a.title !== finishedTitle && a.id !== skipId && !completed.includes(a.title)
  );
}

export default function ActivityFinishedSheet() {
  const { role } = useAuth();
  const pathname = usePathname();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (role === 'teacher') return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    const onFinished = (event: Event) => {
      const { title, challengeJustDone } = (event as CustomEvent<ActivityFinishedDetail>).detail;
      clearTimeout(timer);

      timer = setTimeout(async () => {
        const data = UserDataManager.loadUserData();
        let allowed: string[] | null = null;
        const classroomId = data.profile.classroomId;
        if (classroomId) {
          try {
            allowed = await ClassroomService.getAllowedActivities(classroomId);
          } catch {
            allowed = null;
          }
        }
        if (cancelled) return;

        const finished = ACTIVITIES.find((a) => a.title === title || a.id === title);
        const challenge = data.progress.dailyChallenge;
        const today = UserDataManager.getStreakView(data);
        const challengeActivity = challenge && !challenge.done ? getActivityById(challenge.activityId) : undefined;
        const pendingChallenge =
          challengeActivity && challengeActivity.id !== finished?.id
            ? { id: challengeActivity.id, title: challengeActivity.title, route: challengeActivity.route }
            : null;
        // Si el reto ya es la sugerencia, no se repite como "siguiente".
        const nextActivity = suggestNext(finished?.title ?? title, data.progress.completedActivities, allowed, pendingChallenge?.id);

        setSummary({
          path: window.location.pathname,
          finishedTitle: finished?.title ?? title,
          streak: today,
          challengeJustDone,
          pendingChallenge,
          next: nextActivity ? { id: nextActivity.id, title: nextActivity.title, route: nextActivity.route } : null,
        });
        trackEvent('next_steps_shown', {
          activity_title: finished?.title ?? title,
          streak_days: today.current,
          has_challenge: Boolean(pendingChallenge),
        });
      }, SHOW_DELAY_MS);
    };

    window.addEventListener(ACTIVITY_FINISHED_EVENT, onFinished);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener(ACTIVITY_FINISHED_EVENT, onFinished);
    };
  }, [role]);

  if (!summary || summary.path !== pathname) return null;

  const { streak, next, pendingChallenge, challengeJustDone, finishedTitle } = summary;
  const milestone = reachedMilestone(streak.current);
  const click = (target: string) => trackEvent('next_step_click', { target, from: finishedTitle });

  return (
    <section
      role="status"
      aria-live="polite"
      aria-label="Qué sigue"
      className="fixed inset-x-3 bottom-3 z-[60] sm:left-auto sm:right-4 sm:bottom-4 sm:w-96 rounded-2xl border border-pink-light dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-4 animate-pop"
    >
      <button
        type="button"
        onClick={() => setSummary(null)}
        aria-label="Cerrar"
        className="absolute top-2 right-2 p-1.5 rounded-full text-ink/50 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <IconX size={16} />
      </button>

      <p className="text-sm font-semibold text-ink dark:text-gray-100 pr-6">¡Terminaste {finishedTitle}!</p>

      {streak.current > 0 && (
        <div className="mt-2 flex items-start gap-2">
          <IconFlame size={20} className="text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-ink/80 dark:text-gray-300">
            <span className="font-semibold">
              {streak.current} {streak.current === 1 ? 'día seguido' : 'días seguidos'}.
            </span>{' '}
            {milestone
              ? `¡Llegaste a ${milestone}! Gran constancia.`
              : `Volvé ${nextPlayDayLabel()} para llegar a ${streak.current + 1}.`}
          </p>
        </div>
      )}

      {challengeJustDone && (
        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-mint-text dark:text-mint-accent">
          <IconCircleCheck size={18} className="shrink-0" />
          ¡Cumpliste el reto del día!
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {pendingChallenge && (
          <Link
            href={pendingChallenge.route}
            onClick={() => click('reto')}
            className="flex items-center justify-between gap-2 rounded-xl bg-gold-light dark:bg-gray-700 px-3 py-2.5 text-sm font-medium text-ink dark:text-gray-100 hover:opacity-90"
          >
            <span className="flex items-center gap-2">
              <IconTarget size={16} className="text-gold-accent shrink-0" />
              Reto del día: {pendingChallenge.title}
            </span>
            <IconArrowRight size={16} />
          </Link>
        )}
        {next && (
          <Link
            href={next.route}
            onClick={() => click('siguiente')}
            className="flex items-center justify-between gap-2 rounded-xl bg-coral px-3 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            <span>Seguí con {next.title}</span>
            <IconArrowRight size={16} />
          </Link>
        )}
        <Link
          href="/escritorio"
          onClick={() => click('inicio')}
          className="text-center text-sm text-ink/60 dark:text-gray-400 hover:underline py-1"
        >
          Ir al inicio
        </Link>
      </div>
    </section>
  );
}
