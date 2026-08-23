'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconTrophy, IconListCheck, IconSparkles, IconCheck } from '@tabler/icons-react';
import UserDataManager from '@/lib/userDataManager';
import { ACTIVITIES } from '@/lib/activities';
import { ActivityIcon } from '@/components/ActivityIcon';
import type { UserData } from '@/types/user';

// Los docentes ya tienen la misma estructura de `UserData` que un alumno
// (game.totalScore, progress.completedActivities, etc. — ver
// buildTeacherData en app/docente/page.tsx), así que jugar acá suma puntos
// y progreso de la misma forma que a cualquier alumno, sin lógica nueva de
// puntaje. Esta pestaña es solo la vidriera: un catálogo pensado para que
// el docente conozca y pruebe el contenido antes de asignarlo.
export function MyTrainingTab(): JSX.Element {
  const [userData, setUserData] = useState<UserData>(UserDataManager.getDefaultUserData());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUserData(UserDataManager.loadUserData());
    setMounted(true);
  }, []);

  const completedCount = ACTIVITIES.filter((a) =>
    userData.progress.completedActivities.includes(a.title)
  ).length;
  const progressPct = ACTIVITIES.length > 0
    ? Math.round((completedCount / ACTIVITIES.length) * 100)
    : 0;

  if (!mounted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 bg-mint text-mint-text text-xs font-bold px-3 py-1.5 rounded-full mb-3">
          <IconSparkles className="w-3.5 h-3.5" />
          Para vos, docente
        </div>
        <h1 className="text-2xl font-semibold text-ink dark:text-gray-100 mb-1">Mi formación</h1>
        <p className="text-sm text-ink/60 dark:text-gray-400 max-w-2xl">
          Jugá los mismos desafíos que van a hacer tus alumnos — te sirve para conocer el
          contenido de primera mano y probar cada actividad antes de asignarla. Vas sumando
          tus propios puntos, como cualquier jugador.
        </p>
      </div>

      {/* Resumen */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-5 mb-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gold-light flex items-center justify-center shrink-0">
            <IconTrophy size={20} className="text-gold-text" />
          </div>
          <div>
            <p className="text-xl font-semibold text-ink dark:text-gray-100">{userData.game.totalScore.toLocaleString()}</p>
            <p className="text-xs text-ink/50 dark:text-gray-500">puntos acumulados</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-mint flex items-center justify-center shrink-0">
            <IconListCheck size={20} className="text-mint-text" />
          </div>
          <div>
            <p className="text-xl font-semibold text-ink dark:text-gray-100">{completedCount}/{ACTIVITIES.length}</p>
            <p className="text-xs text-ink/50 dark:text-gray-500">actividades probadas</p>
          </div>
        </div>

        <div className="flex-1 min-w-[140px]">
          <div className="w-full bg-pink-light dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-coral h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-ink/50 dark:text-gray-500 mt-1.5">{progressPct}% del catálogo</p>
        </div>
      </div>

      {/* Catálogo de actividades */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {ACTIVITIES.map((activity) => {
          const isCompleted = userData.progress.completedActivities.includes(activity.title);
          const score = userData.progress.activityScores[activity.title] || 0;

          return (
            <Link
              key={activity.id}
              href={activity.route}
              onClick={() => UserDataManager.visitActivity(activity.title)}
              className="relative bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm hover:shadow-md
                       hover:-translate-y-0.5 transition-all p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: activity.color }}
                >
                  <ActivityIcon iconName={activity.iconName} size={activity.iconSize ?? 16} />
                </div>
                {isCompleted && (
                  <div className="w-5 h-5 rounded-full bg-mint-accent flex items-center justify-center shrink-0">
                    <IconCheck size={12} className="text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-sm text-ink dark:text-gray-100 leading-tight">{activity.title}</p>
                <p className="text-[11px] text-ink/45 dark:text-gray-500 mt-0.5">{activity.category}</p>
              </div>
              {isCompleted && score > 0 && (
                <p className="text-[11px] font-medium text-gold-text mt-auto">{score} pts</p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
