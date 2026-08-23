import React from 'react';
import Image from 'next/image';
import { IconX, IconTrophy, IconFlame, IconCalendarTime } from '@tabler/icons-react';
import type { ClassroomStudent } from '@/types/classroom';
import { ACTIVITIES } from '@/lib/activities';
import { formatDate } from './utils';

const TOTAL_ACTIVITIES = ACTIVITIES.length;

// ==================== Modal de progreso individual ====================

export const StudentProgressModal = ({
  student,
  onClose,
}: {
  student: ClassroomStudent;
  onClose: () => void;
}) => {
  const progress = student.progress;
  const completedCount = progress?.completedCount ?? 0;
  const percentage = Math.round((completedCount / TOTAL_ACTIVITIES) * 100);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-pink-light dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Image
              src={student.character?.image || '/logocresi.svg'}
              alt={student.character?.name ?? ''}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover border border-pink-light dark:border-gray-700"
            />
            <div>
              <h2 className="text-base font-bold text-ink dark:text-gray-100">{student.username}</h2>
              <p className="text-xs text-ink/60 dark:text-gray-400">
                {student.addedManually ? 'Agregado manualmente' : 'Se unió con código'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-ink/40 dark:text-gray-500 hover:text-ink/70 dark:hover:text-gray-300">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
          {!progress ? (
            <p className="text-sm text-ink/60 dark:text-gray-400 text-center py-6">
              Este alumno todavía no completó ninguna actividad.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-cream dark:bg-gray-700 rounded-lg p-3 text-center">
                  <IconTrophy className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-ink dark:text-gray-100">{progress.totalScore}</p>
                  <p className="text-[10px] text-ink/60 dark:text-gray-400">Puntos</p>
                </div>
                <div className="bg-cream dark:bg-gray-700 rounded-lg p-3 text-center">
                  <IconFlame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-ink dark:text-gray-100">{progress.streak}</p>
                  <p className="text-[10px] text-ink/60 dark:text-gray-400">Racha (días)</p>
                </div>
                <div className="bg-cream dark:bg-gray-700 rounded-lg p-3 text-center">
                  <IconCalendarTime className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs font-bold text-ink dark:text-gray-100">{formatDate(progress.lastActive)}</p>
                  <p className="text-[10px] text-ink/60 dark:text-gray-400">Última vez</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-ink/80 dark:text-gray-300">Actividades completadas</p>
                  <p className="text-xs text-ink/60 dark:text-gray-400">{completedCount}/{TOTAL_ACTIVITIES}</p>
                </div>
                <div className="w-full bg-pink-light dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-coral h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-ink/80 dark:text-gray-300 mb-2">Detalle</p>
                {progress.completedActivities.length === 0 ? (
                  <p className="text-xs text-ink/40 dark:text-gray-500">Todavía no completó actividades.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {progress.completedActivities.map((title) => (
                      <li
                        key={title}
                        className="flex items-center justify-between text-sm text-ink/80 dark:text-gray-300 bg-cream dark:bg-gray-700 rounded-lg px-3 py-2"
                      >
                        <span>{title}</span>
                        <span className="text-xs font-medium text-yellow-600">
                          {progress.activityScores?.[title] ?? 0} pts
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};