"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  IconClipboardList,
  IconClock,
  IconCheck,
  IconStar,
  IconExternalLink,
  IconLoader,
  IconX,
} from '@tabler/icons-react';
import TareaService from '@/lib/tareaService';
import UserDataManager from '@/lib/userDataManager';
import type { Tarea, Entrega, LinkedActivity } from '@/types/tarea';

const LINKED_TYPE_LABELS: Record<LinkedActivity['type'], string> = {
  libre: '',
  trivia: 'Jugar la trivia',
  buscador: 'Ir al Buscador de Preguntas',
  infografia: 'Ver la infografía',
  completapalabras: 'Ir a Completa Palabras',
  actividad: 'Ir a la actividad',
};

/** A dónde mandar al alumno para hacer la actividad ligada — cuando hay
 *  una ruta directa (trivia, actividad del catálogo), deep-link preciso;
 *  para las demás, a la sección general (no hay una URL por ítem). */
function linkedActivityHref(linked: LinkedActivity): string | null {
  switch (linked.type) {
    case 'trivia':
      return linked.id ? `/trivias/pregame/${linked.id}` : '/trivias';
    case 'buscador':
      return '/buscador';
    case 'infografia':
      return '/infografias';
    case 'completapalabras':
      return '/lecciones';
    case 'actividad':
      return linked.id ? `/${linked.id}` : null;
    default:
      return null;
  }
}

export const TareasStudentTab = ({ classroomId, studentUid }: { classroomId: string; studentUid: string }) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [entregas, setEntregas] = useState<Record<string, Entrega | null>>({});
  const [loading, setLoading] = useState(true);
  const [openTarea, setOpenTarea] = useState<Tarea | null>(null);

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
                <button onClick={() => setOpenTarea(t)} className="w-full flex items-start gap-3 px-5 py-4 hover:bg-cream dark:hover:bg-gray-700 transition-colors text-left">
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

      {openTarea && (
        <TareaDetailModal
          classroomId={classroomId}
          studentUid={studentUid}
          tarea={openTarea}
          entrega={entregas[openTarea.id] ?? null}
          onClose={() => setOpenTarea(null)}
          onSubmitted={() => {
            setOpenTarea(null);
            load();
          }}
        />
      )}
    </div>
  );
};

const TareaDetailModal = ({
  classroomId,
  studentUid,
  tarea,
  entrega,
  onClose,
  onSubmitted,
}: {
  classroomId: string;
  studentUid: string;
  tarea: Tarea;
  entrega: Entrega | null;
  onClose: () => void;
  onSubmitted: () => void;
}) => {
  const [responseText, setResponseText] = useState(entrega?.responseText ?? '');
  const [markedDone, setMarkedDone] = useState(entrega?.manuallyMarkedDone ?? false);
  const [saving, setSaving] = useState(false);

  const href = linkedActivityHref(tarea.linkedActivity);
  const alreadyGraded = entrega?.status === 'calificada';

  const handleSubmit = async () => {
    try {
      setSaving(true);
      await TareaService.submitEntrega(classroomId, tarea.id, studentUid, {
        responseText: responseText.trim() || undefined,
        manuallyMarkedDone: markedDone,
      });
      onSubmitted();
    } catch (err) {
      console.error('Error entregando la tarea:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-pink-light dark:border-gray-700">
          <h2 className="text-lg font-bold text-ink dark:text-gray-100">{tarea.title}</h2>
          <button onClick={onClose} className="text-ink/40 dark:text-gray-500 hover:text-ink/70 dark:hover:text-gray-300">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-ink/80 dark:text-gray-300 whitespace-pre-wrap">{tarea.consigna}</p>
          <p className="text-xs text-ink/60 dark:text-gray-400">
            Entrega: {new Date(tarea.dueDate).toLocaleDateString('es-AR')} · vale {tarea.points} puntos
          </p>

          {href && (
            <Link
              href={href}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-mint text-mint-text rounded-full text-sm font-semibold hover:bg-mint-light transition-colors"
            >
              {LINKED_TYPE_LABELS[tarea.linkedActivity.type]}
              {tarea.linkedActivity.label ? `: ${tarea.linkedActivity.label}` : ''}
              <IconExternalLink className="w-4 h-4" />
            </Link>
          )}

          {alreadyGraded ? (
            <div className="p-4 bg-green-50 dark:bg-green-950/40 rounded-lg border border-green-100 dark:border-green-900">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-1.5">
                <IconStar className="w-4 h-4" /> Calificada: {entrega?.grade} / {tarea.points} puntos
              </p>
              {entrega?.feedback && <p className="text-sm text-green-700 dark:text-green-300 mt-1.5">{entrega.feedback}</p>}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-ink dark:text-gray-100 mb-1">Tu respuesta (opcional)</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  placeholder="Escribí tu respuesta acá..."
                  className="w-full px-3 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </div>

              {tarea.linkedActivity.type !== 'libre' && (
                <label className="flex items-center gap-2 text-sm text-ink/80 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markedDone}
                    onChange={(e) => setMarkedDone(e.target.checked)}
                    className="w-4 h-4"
                  />
                  Ya hice la actividad de arriba
                </label>
              )}

              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full px-5 py-2.5 bg-coral text-white rounded-full text-sm font-semibold hover:bg-coral-dark disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <IconLoader className="w-4 h-4 animate-spin" />}
                {entrega ? 'Actualizar entrega' : 'Entregar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};