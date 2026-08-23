import React, { useEffect, useState } from 'react';
import { IconClipboardList, IconLoader } from '@tabler/icons-react';
import TareaService from '@/lib/tareaService';
import type { Tarea } from '@/types/tarea';

interface TareaStats {
  entregadas: number;
  evaluadas: number;
}

/**
 * Feed de tareas para el Tablón (docente) / Novedades (alumno) — ordenado
 * de la más nueva a la más antigua (por fecha de creación, no de
 * entrega), como un feed de novedades. La gestión real (crear/entregar/
 * calificar) vive en la sub-solapa "Tareas" dentro de Trabajo en clase;
 * acá es solo el resumen de lectura.
 *
 * `showStats` (solo para el docente, como en Google Classroom): muestra
 * cuántas entregaron / cuántos alumnos tiene la clase / cuántas ya se
 * calificaron. Trae una consulta extra por tarea, por eso queda apagado
 * por default — un alumno no necesita ver estos números.
 */
export const TareasFeedSummary = ({
  classroomId,
  emptyLabel,
  showStats = false,
  totalStudents = 0,
  onOpenTarea,
}: {
  classroomId: string;
  emptyLabel: string;
  showStats?: boolean;
  totalStudents?: number;
  /** Si viene, cada tarjeta se vuelve clickeable y navega a la pantalla
   *  completa de calificación (solo tiene sentido para el docente). */
  onOpenTarea?: (tarea: Tarea) => void;
}) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [stats, setStats] = useState<Record<string, TareaStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await TareaService.getTareasForClassroom(classroomId);
        const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setTareas(sorted);

        if (showStats && sorted.length > 0) {
          const entries = await Promise.all(
            sorted.map(async (t) => {
              const entregas = await TareaService.getEntregasForTarea(classroomId, t.id);
              return [
                t.id,
                {
                  entregadas: entregas.length,
                  evaluadas: entregas.filter((e) => e.status === 'calificada').length,
                },
              ] as const;
            })
          );
          const map: Record<string, TareaStats> = {};
          entries.forEach(([id, s]) => {
            map[id] = s;
          });
          setStats(map);
        }
      } catch (err) {
        console.error('Error cargando tareas:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [classroomId, showStats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-ink/40 dark:text-gray-500">
        <IconLoader className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (tareas.length === 0) {
    return <p className="text-xs text-ink/40 dark:text-gray-500">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2.5">
      {tareas.map((t) => {
        const isPastDue = new Date(t.dueDate).getTime() < Date.now();
        const s = stats[t.id];
        return (
          <li key={t.id} className="p-3 bg-cream dark:bg-gray-900/40 rounded-lg border border-pink-light dark:border-gray-700">
            <div
              className={`flex items-start gap-3 ${onOpenTarea ? 'cursor-pointer' : ''}`}
              onClick={() => onOpenTarea?.(t)}
              role={onOpenTarea ? 'button' : undefined}
              tabIndex={onOpenTarea ? 0 : undefined}
            >
              <div className="w-8 h-8 rounded-lg bg-mint text-mint-text flex items-center justify-center shrink-0">
                <IconClipboardList className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink dark:text-gray-100 truncate">{t.title}</p>
                <p className="text-xs text-ink/60 dark:text-gray-400 line-clamp-1 mt-0.5">{t.consigna}</p>
                <p className={`text-[11px] mt-1 ${isPastDue ? 'text-red-500' : 'text-ink/40 dark:text-gray-500'}`}>
                  Entrega: {new Date(t.dueDate).toLocaleDateString('es-AR')} · {t.points} pts
                </p>
              </div>
            </div>

            {showStats && s && (
              <div className="flex items-center gap-5 mt-3 pt-3 border-t border-pink-light dark:border-gray-700">
                <div className="text-center">
                  <p className="text-lg font-semibold text-ink dark:text-gray-100 leading-none">{s.entregadas}</p>
                  <p className="text-[10px] text-ink/60 dark:text-gray-400 mt-1">Entregadas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-ink dark:text-gray-100 leading-none">{totalStudents}</p>
                  <p className="text-[10px] text-ink/60 dark:text-gray-400 mt-1">Asignadas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-ink dark:text-gray-100 leading-none">{s.evaluadas}</p>
                  <p className="text-[10px] text-ink/60 dark:text-gray-400 mt-1">Evaluadas</p>
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};