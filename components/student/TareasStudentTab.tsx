"use client";

import React, { useEffect, useState } from 'react';
import { IconClipboardList, IconClock, IconCheck, IconStar, IconLoader } from '@tabler/icons-react';
import TareaService from '@/lib/tareaService';
import UserDataManager from '@/lib/userDataManager';
import type { Tarea, Entrega } from '@/types/tarea';

export const TareasStudentTab = ({
  classroomId,
  studentUid,
  onOpenTarea,
}: {
  classroomId: string;
  studentUid: string;
  /** Navega a la pantalla completa de detalle/entrega (vive en ClassroomDesk). */
  onOpenTarea: (tarea: Tarea) => void;
}) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [entregas, setEntregas] = useState<Record<string, Entrega | null>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const list = await TareaService.getTareasForClassroom(classroomId);
      setTareas(list);

      const entries = await Promise.all(
        list.map(async (t) => [t.id, await TareaService.getEntregaForStudent(classroomId, t.id, studentUid)] as const)
      );
      const map: Record<string, Entrega | null> = {};
      entries.forEach(([id, entrega]) => {
        map[id] = entrega;
      });
      setEntregas(map);

      // Si alguna ya está calificada, aplicamos los puntos a la cuenta del
      // alumno — por diferencia contra lo ya aplicado antes, para que no
      // se sumen de nuevo cada vez que entra a ver la tarea.
      applyGradedPoints(list, map);
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId, studentUid]);

  const applyGradedPoints = (list: Tarea[], map: Record<string, Entrega | null>) => {
    const current = UserDataManager.loadUserData();
    let totalDelta = 0;
    const nextActivityScores = { ...current.progress.activityScores };

    list.forEach((t) => {
      const entrega = map[t.id];
      if (entrega?.status === 'calificada' && typeof entrega.grade === 'number') {
        const key = `Tarea-${t.id}`;
        const previouslyApplied = nextActivityScores[key] || 0;
        if (entrega.grade !== previouslyApplied) {
          totalDelta += entrega.grade - previouslyApplied;
          nextActivityScores[key] = entrega.grade;
        }
      }
    });

    if (totalDelta !== 0) {
      UserDataManager.saveUserData({
        ...current,
        game: { ...current.game, totalScore: current.game.totalScore + totalDelta },
        progress: { ...current.progress, activityScores: nextActivityScores },
      });
    }
  };

  const now = Date.now();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-pink-light dark:border-gray-700 overflow-hidden">
      <div className="px-5 py-3 border-b border-pink-light dark:border-gray-700">
        <h2 className="text-sm font-semibold text-ink dark:text-gray-100/80 dark:text-gray-300">Tareas asignadas</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-ink/40 dark:text-gray-500">
          <IconLoader className="w-6 h-6 animate-spin" />
        </div>
      ) : tareas.length === 0 ? (
        <div className="p-8 text-center text-sm text-ink/40 dark:text-gray-500">Tu docente todavía no asignó ninguna tarea.</div>
      ) : (
        <ul className="divide-y divide-pink-light dark:divide-gray-700">
          {tareas.map((t) => {
            const entrega = entregas[t.id];
            const isPastDue = new Date(t.dueDate).getTime() < now;

            let statusBadge: React.ReactNode;
            if (entrega?.status === 'calificada') {
              statusBadge = (
                <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                  <IconStar className="w-3.5 h-3.5" /> {entrega.grade} / {t.points} pts
                </span>
              );
            } else if (entrega?.status === 'entregada') {
              statusBadge = (
                <span className="flex items-center gap-1 text-xs font-medium text-coral-dark">
                  <IconCheck className="w-3.5 h-3.5" /> Entregada
                </span>
              );
            } else {
              statusBadge = (
                <span className={`flex items-center gap-1 text-xs font-medium ${isPastDue ? 'text-red-500' : 'text-ink/40 dark:text-gray-500'}`}>
                  <IconClock className="w-3.5 h-3.5" /> {isPastDue ? 'Vencida' : 'Pendiente'}
                </span>
              );
            }

            return (
              <li key={t.id}>
                <button onClick={() => onOpenTarea(t)} className="w-full flex items-start gap-3 px-5 py-4 hover:bg-cream dark:hover:bg-gray-700 transition-colors text-left">
                  <div className="w-9 h-9 rounded-lg bg-mint text-mint-text flex items-center justify-center shrink-0">
                    <IconClipboardList className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink dark:text-gray-100">{t.title}</p>
                    <p className="text-xs text-ink/60 dark:text-gray-400 mt-0.5 line-clamp-1">{t.consigna}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {statusBadge}
                      <span className="text-[11px] text-ink/40 dark:text-gray-500">
                        Entrega: {new Date(t.dueDate).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
