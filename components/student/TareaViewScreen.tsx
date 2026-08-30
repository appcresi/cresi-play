'use client';

import React, { useEffect, useState } from 'react';
import {
  IconArrowLeft,
  IconClipboardList,
  IconClock,
  IconCheck,
  IconStar,
  IconLoader,
} from '@tabler/icons-react';
import TareaService from '@/lib/tareaService';
import { LinkedActivityAttachment } from '@/components/tareas/LinkedActivityPreview';
import type { Tarea, Entrega, LinkedActivityType } from '@/types/tarea';

// Para estos tipos, el desafío está embebido y usable ahí mismo (ver
// LinkedActivityPreview.tsx) — a diferencia de trivia/completa
// palabras/actividad (que abren en otra pestaña y no se pueden verificar),
// acá SÍ podemos exigir haberlo resuelto/usado antes de dejar entregar,
// en vez de confiar en el check manual "ya lo hice".
const VERIFIABLE_TYPES: LinkedActivityType[] = ['biopuzzle', 'buscador', 'nube'];

/**
 * Pantalla completa (no modal) para que el alumno vea el detalle de una
 * tarea y la entregue — mismo espíritu de layout que la pantalla de tarea
 * de Google Classroom: contenido grande a la izquierda (consigna + a qué
 * está ligada) y un panel angosto a la derecha ("Tu trabajo") con el
 * estado y el botón de entregar. Reemplaza el contenido del aula, igual
 * que CreateTareaScreen/TareaGradingScreen del lado del docente — al
 * volver, la lista de tareas se remonta sola y trae el estado actualizado.
 */
export const TareaViewScreen = ({
  classroomId,
  studentUid,
  tarea,
  onBack,
  onSubmitted,
}: {
  classroomId: string;
  studentUid: string;
  tarea: Tarea;
  onBack: () => void;
  onSubmitted: () => void;
}) => {
  const [entrega, setEntrega] = useState<Entrega | null | undefined>(undefined);
  const [responseText, setResponseText] = useState('');
  const [markedDone, setMarkedDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  useEffect(() => {
    TareaService.getEntregaForStudent(classroomId, tarea.id, studentUid)
      .then((e) => {
        setEntrega(e);
        setResponseText(e?.responseText ?? '');
        setMarkedDone(e?.manuallyMarkedDone ?? false);
      })
      .catch(() => setEntrega(null));
  }, [classroomId, tarea.id, studentUid]);

  const isPastDue = new Date(tarea.dueDate).getTime() < Date.now();
  const alreadyGraded = entrega?.status === 'calificada';

  // Para trivia/buscador/biopuzzle: si es verificable, exigimos haberlo
  // resuelto en esta visita O que ya conste como hecho de una entrega
  // anterior (para no trabar a quien vuelve solo a actualizar su
  // respuesta de texto).
  const isVerifiable = VERIFIABLE_TYPES.includes(tarea.linkedActivity.type);
  const alreadyVerified = entrega?.manuallyMarkedDone === true;
  const challengeDone = challengeCompleted || alreadyVerified;
  const canSubmit = !isVerifiable || challengeDone;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    try {
      setSaving(true);
      await TareaService.submitEntrega(classroomId, tarea.id, studentUid, {
        responseText: responseText.trim() || undefined,
        manuallyMarkedDone: isVerifiable ? challengeDone : markedDone,
      });
      onSubmitted();
    } catch (err) {
      console.error('Error entregando la tarea:', err);
    } finally {
      setSaving(false);
    }
  };

  let statusLabel: string;
  let statusClass: string;
  if (entrega?.status === 'calificada') {
    statusLabel = `Calificada: ${entrega.grade} / ${tarea.points} pts`;
    statusClass = 'text-green-600';
  } else if (entrega?.status === 'entregada') {
    statusLabel = 'Entregada';
    statusClass = 'text-coral-dark';
  } else {
    statusLabel = isPastDue ? 'Vencida' : 'Sin entregar';
    statusClass = isPastDue ? 'text-red-500' : 'text-ink/50 dark:text-gray-400';
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-ink/60 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100 mb-4"
      >
        <IconArrowLeft size={16} />
        Volver
      </button>

      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-9 h-9 rounded-lg bg-mint text-mint-text flex items-center justify-center shrink-0">
          <IconClipboardList size={18} />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-ink dark:text-gray-100 truncate">{tarea.title}</h1>
          <p className="text-xs text-ink/50 dark:text-gray-400 mt-0.5">
            Tareas · {tarea.points} puntos | Fecha de entrega: {new Date(tarea.dueDate).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Columna izquierda: consigna + a qué está ligada */}
        <div className="lg:col-span-2 space-y-4">
          {tarea.consigna && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-5">
              <p className="text-sm text-ink/80 dark:text-gray-300 whitespace-pre-wrap">{tarea.consigna}</p>
            </div>
          )}

          {tarea.linkedActivity.type !== 'libre' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-5">
              <LinkedActivityAttachment
                linked={tarea.linkedActivity}
                classroomId={classroomId}
                awardPoints
                onComplete={() => setChallengeCompleted(true)}
              />
            </div>
          )}
        </div>

        {/* Columna derecha: "Tu trabajo" */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink dark:text-gray-100">Tu trabajo</h2>
            <span className={`flex items-center gap-1 text-xs font-medium ${statusClass}`}>
              {entrega?.status === 'calificada' ? (
                <IconStar className="w-3.5 h-3.5" />
              ) : entrega?.status === 'entregada' ? (
                <IconCheck className="w-3.5 h-3.5" />
              ) : (
                <IconClock className="w-3.5 h-3.5" />
              )}
              {statusLabel}
            </span>
          </div>

          {entrega === undefined ? (
            <div className="flex items-center gap-2 text-ink/40 dark:text-gray-500 text-sm py-2">
              <IconLoader className="w-4 h-4 animate-spin" /> Cargando...
            </div>
          ) : alreadyGraded ? (
            <div className="p-4 bg-green-50 dark:bg-green-950/40 rounded-lg border border-green-100 dark:border-green-900">
              <p className="text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-1.5">
                <IconStar className="w-4 h-4" /> {entrega?.grade} / {tarea.points} puntos
              </p>
              {entrega?.feedback && <p className="text-sm text-green-700 dark:text-green-300 mt-1.5">{entrega.feedback}</p>}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-ink/60 dark:text-gray-400 uppercase mb-1.5">
                  Tu respuesta (opcional)
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={4}
                  placeholder="Escribí tu respuesta acá..."
                  className="w-full px-3 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
                />
              </div>

              {isVerifiable ? (
                <p className={`flex items-center gap-1.5 text-sm ${challengeDone ? 'text-green-600' : 'text-ink/50 dark:text-gray-400'}`}>
                  {challengeDone ? <IconCheck className="w-4 h-4 shrink-0" /> : <IconClock className="w-4 h-4 shrink-0" />}
                  {challengeDone ? 'Desafío completado' : 'Todavía te falta completar el desafío de arriba'}
                </p>
              ) : (
                tarea.linkedActivity.type !== 'libre' && (
                  <label className="flex items-center gap-2 text-sm text-ink/80 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={markedDone}
                      onChange={(e) => setMarkedDone(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Ya hice la actividad de arriba
                  </label>
                )
              )}

              <button
                onClick={handleSubmit}
                disabled={saving || !canSubmit}
                title={!canSubmit ? 'Completá el desafío de arriba antes de entregar' : undefined}
                className="w-full px-5 py-2.5 bg-coral text-white rounded-full text-sm font-semibold hover:bg-coral-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
