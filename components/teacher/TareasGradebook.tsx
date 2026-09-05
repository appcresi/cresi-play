import React, { useEffect, useState } from 'react';
import { IconLoader } from '@tabler/icons-react';
import TareaService, { isEntregaLate } from '@/lib/tareaService';
import type { Tarea, Entrega } from '@/types/tarea';
import type { ClassroomStudent } from '@/types/classroom';

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Cuaderno de calificaciones: progreso general de la app (actividades
 * completadas, puntos, racha) Y una columna por tarea, todo en la misma
 * fila por alumno — antes eran dos tablas separadas, así que para ver el
 * panorama completo de un alumno había que mirar dos lugares distintos.
 */
export const TareasGradebook = ({
  classroomId,
  students,
  totalActivities,
  onOpenTarea,
  onSelectStudent,
}: {
  classroomId: string;
  students: ClassroomStudent[];
  totalActivities: number;
  onOpenTarea: (tarea: Tarea) => void;
  onSelectStudent: (s: ClassroomStudent) => void;
}) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [entregasByTarea, setEntregasByTarea] = useState<Record<string, Record<string, Entrega>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [list, allEntregas] = await Promise.all([
          TareaService.getTareasForClassroom(classroomId),
          // Una sola lectura para TODA la clase (collectionGroup por
          // classroomId) en vez de una consulta por tarea — antes, una
          // clase con 20 tareas costaba 20 lecturas separadas cada vez
          // que se abría este cuaderno.
          TareaService.getAllEntregasForClassroom(classroomId),
        ]);
        const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setTareas(sorted);

        const byTarea: Record<string, Record<string, Entrega>> = {};
        allEntregas.forEach((e) => {
          if (!e.tareaId) return; // entrega vieja, sin migrar todavía
          (byTarea[e.tareaId] ??= {})[e.studentUid] = e;
        });
        setEntregasByTarea(byTarea);
      } catch (err) {
        console.error('Error cargando el cuaderno de calificaciones:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [classroomId]);

  const isLate = isEntregaLate;

  // % general de un alumno: promedio de (nota/puntos) entre las tareas que
  // ya le calificaron — las que todavía no se corrigieron no cuentan ni a
  // favor ni en contra.
  const overallForStudent = (uid: string): number | null => {
    const percentages: number[] = [];
    tareas.forEach((t) => {
      const e = entregasByTarea[t.id]?.[uid];
      if (e?.status === 'calificada' && typeof e.grade === 'number' && t.points > 0) {
        percentages.push((e.grade / t.points) * 100);
      }
    });
    if (percentages.length === 0) return null;
    return round1(percentages.reduce((a, b) => a + b, 0) / percentages.length);
  };

  const classAverageForTarea = (tareaId: string): number | null => {
    const grades = Object.values(entregasByTarea[tareaId] ?? {})
      .filter((e) => e.status === 'calificada' && typeof e.grade === 'number')
      .map((e) => e.grade as number);
    if (grades.length === 0) return null;
    return round1(grades.reduce((a, b) => a + b, 0) / grades.length);
  };

  const classOverallAverage = (): number | null => {
    const percentages = students
      .map((s) => overallForStudent(s.uid))
      .filter((p): p is number => p !== null);
    if (percentages.length === 0) return null;
    return round1(percentages.reduce((a, b) => a + b, 0) / percentages.length);
  };

  const sortedStudents = [...students].sort((a, b) => a.username.localeCompare(b.username));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-ink/40 dark:text-gray-500">
        <IconLoader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  const thBase = 'text-left text-[11px] font-medium text-ink/60 dark:text-gray-400 uppercase px-3 py-2 whitespace-nowrap';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-pink-light dark:border-gray-700">
            <th className={`${thBase} sticky left-0 bg-white dark:bg-gray-800`}>Alumno</th>
            <th className={thBase}>Progreso</th>
            <th className={thBase}>Completadas</th>
            <th className={thBase}>Puntos</th>
            <th className={thBase}>Racha</th>
            <th className={thBase}>Calificación general</th>
            {tareas.map((t) => (
              <th key={t.id} className="text-left px-3 py-2 min-w-[130px] align-bottom">
                <button
                  onClick={() => onOpenTarea(t)}
                  className="text-xs font-semibold text-coral-dark hover:underline text-left line-clamp-2"
                  title={t.title}
                >
                  {t.title}
                </button>
                <p className="text-[10px] font-normal text-ink/40 dark:text-gray-500 mt-0.5 normal-case">
                  Tareas de {t.points} · {new Date(t.dueDate).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-pink-light dark:border-gray-700 bg-cream dark:bg-gray-900/40 font-medium">
            <td className="px-3 py-2.5 sticky left-0 bg-cream dark:bg-gray-900/40 text-ink dark:text-gray-100 whitespace-nowrap">
              Media de la clase
            </td>
            <td className="px-3 py-2.5" />
            <td className="px-3 py-2.5" />
            <td className="px-3 py-2.5" />
            <td className="px-3 py-2.5" />
            <td className="px-3 py-2.5 text-ink dark:text-gray-100 whitespace-nowrap">
              {classOverallAverage() !== null ? `${classOverallAverage()}%` : '—'}
            </td>
            {tareas.map((t) => (
              <td key={t.id} className="px-3 py-2.5 text-ink/70 dark:text-gray-300 whitespace-nowrap">
                {classAverageForTarea(t.id) ?? '—'}
              </td>
            ))}
          </tr>

          {sortedStudents.map((s) => {
            const overall = overallForStudent(s.uid);
            const completed = s.progress?.completedCount ?? 0;
            const percentage = totalActivities > 0 ? Math.round((completed / totalActivities) * 100) : 0;
            return (
              <tr
                key={s.uid}
                onClick={() => onSelectStudent(s)}
                className="border-b border-pink-light dark:border-gray-700 hover:bg-cream dark:hover:bg-gray-700/40 cursor-pointer"
              >
                <td className="px-3 py-2.5 sticky left-0 bg-white dark:bg-gray-800 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <img
                      src={s.character?.image}
                      alt={s.character?.name}
                      className="w-6 h-6 rounded-full object-cover border border-pink-light dark:border-gray-700 shrink-0"
                    />
                    <span className="font-medium text-ink dark:text-gray-100">{s.username}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-pink-light dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-coral h-1.5 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-xs text-ink/60 dark:text-gray-400">{percentage}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-ink/80 dark:text-gray-300 whitespace-nowrap">
                  {completed}/{totalActivities}
                </td>
                <td className="px-3 py-2.5 text-yellow-700 font-medium whitespace-nowrap">{s.progress?.totalScore ?? 0}</td>
                <td className="px-3 py-2.5 text-orange-600 whitespace-nowrap">{s.progress?.streak ?? 0}</td>
                <td className="px-3 py-2.5 text-ink/80 dark:text-gray-300 whitespace-nowrap">
                  {overall !== null ? `${overall}%` : '—'}
                </td>
                {tareas.map((t) => {
                  const e = entregasByTarea[t.id]?.[s.uid];
                  return (
                    <td key={t.id} className="px-3 py-2.5 whitespace-nowrap">
                      {!e ? (
                        <span className="text-red-500 text-xs font-medium">Sin entregar</span>
                      ) : e.status === 'calificada' ? (
                        <span className="text-ink dark:text-gray-100 font-medium">
                          {e.grade}/{t.points}
                        </span>
                      ) : (
                        <div>
                          <span className="text-ink/40 dark:text-gray-500">__/{t.points}</span>
                          <p className="text-[10px] text-coral-dark">
                            Entregada{isLate(t, e) ? ' con retraso' : ''}
                          </p>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
