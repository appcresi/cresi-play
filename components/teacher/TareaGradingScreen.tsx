import React, { useEffect, useState } from 'react';
import {
  IconArrowLeft,
  IconLoader,
  IconCheck,
  IconClock,
  IconStar,
  IconPencil,
  IconX,
} from '@tabler/icons-react';
import TareaService from '@/lib/tareaService';
import type { Tarea, Entrega, LinkedActivity } from '@/types/tarea';
import type { ClassroomStudent } from '@/types/classroom';

type GradingSubTab = 'instrucciones' | 'trabajo';

const LINKED_TYPE_LABELS: Record<LinkedActivity['type'], string> = {
  libre: 'Sin actividad ligada',
  trivia: 'Trivia',
  buscador: 'Buscador de Preguntas',
  infografia: 'Infografía',
  completapalabras: 'Completa Palabras',
  actividad: 'Actividad del catálogo',
};

/**
 * Pantalla completa (no modal) para ver/editar la consigna y calificar
 * las entregas de una tarea — mismo espíritu que "Trabajo de los
 * alumnos" en Google Classroom. Se abre reemplazando el contenido de la
 * clase (no como superposición), con un botón de volver.
 */
export const TareaGradingScreen = ({
  classroomId,
  tarea,
  students,
  onBack,
  onTareaUpdated,
}: {
  classroomId: string;
  tarea: Tarea;
  students: ClassroomStudent[];
  onBack: () => void;
  onTareaUpdated: (updated: Tarea) => void;
}) => {
  const [subTab, setSubTab] = useState<GradingSubTab>('trabajo');
  const [entregas, setEntregas] = useState<Record<string, Entrega>>({});
  const [loadingEntregas, setLoadingEntregas] = useState(true);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [gradeDraft, setGradeDraft] = useState('');
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [savingGrade, setSavingGrade] = useState(false);

  // Edición de la consigna
  const [editingConsigna, setEditingConsigna] = useState(false);
  const [titleDraft, setTitleDraft] = useState(tarea.title);
  const [consignaDraft, setConsignaDraft] = useState(tarea.consigna);
  const [pointsDraft, setPointsDraft] = useState(tarea.points);
  const [dueDateDraft, setDueDateDraft] = useState(tarea.dueDate.slice(0, 10));
  const [savingConsigna, setSavingConsigna] = useState(false);

  const loadEntregas = async () => {
    setLoadingEntregas(true);
    try {
      const list = await TareaService.getEntregasForTarea(classroomId, tarea.id);
      const map: Record<string, Entrega> = {};
      list.forEach((e) => {
        map[e.studentUid] = e;
      });
      setEntregas(map);
    } catch (err) {
      console.error('Error cargando entregas:', err);
    } finally {
      setLoadingEntregas(false);
    }
  };

  useEffect(() => {
    loadEntregas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId, tarea.id]);

  const entregadas = Object.keys(entregas).length;
  const evaluadas = Object.values(entregas).filter((e) => e.status === 'calificada').length;

  const openStudent = (uid: string) => {
    if (expandedUid === uid) {
      setExpandedUid(null);
      return;
    }
    setExpandedUid(uid);
    const entrega = entregas[uid];
    setGradeDraft(entrega?.grade !== undefined ? String(entrega.grade) : '');
    setFeedbackDraft(entrega?.feedback ?? '');
  };

  const handleSaveGrade = async (uid: string) => {
    const gradeNum = Number(gradeDraft);
    if (Number.isNaN(gradeNum)) return;
    try {
      setSavingGrade(true);
      await TareaService.gradeEntrega(classroomId, tarea.id, uid, {
        grade: gradeNum,
        feedback: feedbackDraft.trim() || undefined,
      });
      await loadEntregas();
      setExpandedUid(null);
    } catch (err) {
      console.error('Error calificando:', err);
    } finally {
      setSavingGrade(false);
    }
  };

  const handleSaveConsigna = async () => {
    try {
      setSavingConsigna(true);
      const updates = {
        title: titleDraft.trim(),
        consigna: consignaDraft.trim(),
        points: pointsDraft,
        dueDate: new Date(dueDateDraft).toISOString(),
      };
      await TareaService.updateTarea(classroomId, tarea.id, updates);
      onTareaUpdated({ ...tarea, ...updates });
      setEditingConsigna(false);
    } catch (err) {
      console.error('Error guardando la consigna:', err);
    } finally {
      setSavingConsigna(false);
    }
  };

  const sortedStudents = [...students].sort((a, b) => a.username.localeCompare(b.username));

  return (
    <div>
      {/* Encabezado */}
      <div className="border-b border-pink-light dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-ink/60 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100 mb-3 transition-colors"
          >
            <IconArrowLeft className="w-4 h-4" />
            Volver a la clase
          </button>
          <h1 className="text-xl font-semibold text-ink dark:text-gray-100">📌 {tarea.title}</h1>
          <p className="text-xs text-ink/60 dark:text-gray-400 mt-1">
            Entrega: {new Date(tarea.dueDate).toLocaleDateString('es-AR')} · {tarea.points} puntos ·{' '}
            {LINKED_TYPE_LABELS[tarea.linkedActivity.type]}
            {tarea.linkedActivity.label ? `: ${tarea.linkedActivity.label}` : ''}
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-6 flex gap-6">
          {(['instrucciones', 'trabajo'] as GradingSubTab[]).map((key) => (
            <button
              key={key}
              onClick={() => setSubTab(key)}
              className={`py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                subTab === key ? 'border-coral text-coral-dark' : 'border-transparent text-ink/60 dark:text-gray-400 hover:text-ink/80 dark:hover:text-gray-200'
              }`}
            >
              {key === 'instrucciones' ? 'Instrucciones' : 'Trabajo de los alumnos'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* ── Instrucciones ── */}
        {subTab === 'instrucciones' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-pink-light dark:border-gray-700 p-5 max-w-2xl">
            {!editingConsigna ? (
              <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-base font-semibold text-ink dark:text-gray-100">{tarea.title}</h2>
                  <button
                    onClick={() => setEditingConsigna(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-coral-dark hover:text-coral shrink-0"
                  >
                    <IconPencil className="w-3.5 h-3.5" />
                    Editar
                  </button>
                </div>
                <p className="text-sm text-ink/80 dark:text-gray-300 whitespace-pre-wrap">{tarea.consigna}</p>
              </>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink/80 dark:text-gray-300 mb-1">Título</label>
                  <input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    className="w-full px-3 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/80 dark:text-gray-300 mb-1">Consigna</label>
                  <textarea
                    value={consignaDraft}
                    onChange={(e) => setConsignaDraft(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink/80 dark:text-gray-300 mb-1">Puntos</label>
                    <input
                      type="number"
                      min={0}
                      value={pointsDraft}
                      onChange={(e) => setPointsDraft(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink/80 dark:text-gray-300 mb-1">Fecha de entrega</label>
                    <input
                      type="date"
                      value={dueDateDraft}
                      onChange={(e) => setDueDateDraft(e.target.value)}
                      className="w-full px-3 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setEditingConsigna(false)}
                    className="px-4 py-1.5 text-sm text-ink/70 dark:text-gray-400 hover:bg-pink-light dark:hover:bg-gray-700 rounded-full"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveConsigna}
                    disabled={savingConsigna}
                    className="px-4 py-1.5 text-sm bg-coral text-white rounded-full hover:bg-coral-dark disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {savingConsigna && <IconLoader className="w-3.5 h-3.5 animate-spin" />}
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Trabajo de los alumnos ── */}
        {subTab === 'trabajo' && (
          <div>
            {/* Cifras, igual que en el feed del Tablón */}
            <div className="flex items-center gap-8 mb-6">
              <div>
                <p className="text-3xl font-semibold text-ink dark:text-gray-100 leading-none">{entregadas}</p>
                <p className="text-xs text-ink/60 dark:text-gray-400 mt-1">Entregadas</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-ink dark:text-gray-100 leading-none">{students.length}</p>
                <p className="text-xs text-ink/60 dark:text-gray-400 mt-1">Asignadas</p>
              </div>
              <div>
                <p className="text-3xl font-semibold text-ink dark:text-gray-100 leading-none">{evaluadas}</p>
                <p className="text-xs text-ink/60 dark:text-gray-400 mt-1">Evaluadas</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-pink-light dark:border-gray-700 overflow-hidden">
              {loadingEntregas ? (
                <div className="flex items-center justify-center py-12 text-ink/40 dark:text-gray-500">
                  <IconLoader className="w-6 h-6 animate-spin" />
                </div>
              ) : sortedStudents.length === 0 ? (
                <p className="text-sm text-ink/40 dark:text-gray-500 text-center py-12">Todavía no hay alumnos en esta clase.</p>
              ) : (
                <ul className="divide-y divide-pink-light dark:divide-gray-700">
                  {sortedStudents.map((s) => {
                    const entrega = entregas[s.uid];
                    const isExpanded = expandedUid === s.uid;

                    let statusBadge: React.ReactNode;
                    if (!entrega) {
                      statusBadge = (
                        <span className="flex items-center gap-1 text-xs text-ink/40 dark:text-gray-500">
                          <IconClock className="w-3.5 h-3.5" /> Sin entregar
                        </span>
                      );
                    } else if (entrega.status === 'calificada') {
                      statusBadge = (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                          <IconStar className="w-3.5 h-3.5" /> {entrega.grade} / {tarea.points}
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span className="flex items-center gap-1 text-xs font-medium text-coral-dark">
                          <IconCheck className="w-3.5 h-3.5" /> Entregada, sin calificar
                        </span>
                      );
                    }

                    return (
                      <li key={s.uid}>
                        <button
                          onClick={() => entrega && openStudent(s.uid)}
                          disabled={!entrega}
                          className={`w-full flex items-center justify-between px-5 py-3.5 text-left ${
                            entrega ? 'hover:bg-cream' : 'cursor-default'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={s.character?.image}
                              alt={s.character?.name}
                              className="w-8 h-8 rounded-full object-cover border border-pink-light dark:border-gray-700"
                            />
                            <span className="text-sm font-medium text-ink dark:text-gray-100">{s.username}</span>
                          </div>
                          {statusBadge}
                        </button>

                        {isExpanded && entrega && (
                          <div className="px-5 pb-4 bg-cream">
                            <p className="text-xs text-ink/60 dark:text-gray-400 mb-1">
                              Entregó el {new Date(entrega.submittedAt).toLocaleString('es-AR')}
                              {entrega.manuallyMarkedDone && ' · marcó la actividad como hecha'}
                            </p>
                            {entrega.responseText && (
                              <div className="bg-white dark:bg-gray-900/40 rounded-lg border border-pink-light dark:border-gray-700 p-3 text-sm text-ink/80 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                                {entrega.responseText}
                              </div>
                            )}

                            <div className="flex gap-2 items-start">
                              <div className="w-24">
                                <label className="block text-[11px] font-medium text-ink/70 dark:text-gray-400 mb-1">Nota</label>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={tarea.points}
                                    value={gradeDraft}
                                    onChange={(e) => setGradeDraft(e.target.value)}
                                    className="w-full px-2 py-1.5 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm"
                                  />
                                  <span className="text-xs text-ink/40 dark:text-gray-500 shrink-0">/{tarea.points}</span>
                                </div>
                              </div>
                              <div className="flex-1">
                                <label className="block text-[11px] font-medium text-ink/70 dark:text-gray-400 mb-1">Comentario (opcional)</label>
                                <input
                                  type="text"
                                  value={feedbackDraft}
                                  onChange={(e) => setFeedbackDraft(e.target.value)}
                                  placeholder="Devolución para el alumno..."
                                  className="w-full px-2 py-1.5 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSaveGrade(s.uid)}
                                disabled={savingGrade || gradeDraft === ''}
                                className="px-4 py-1.5 bg-coral text-white text-xs font-semibold rounded-full hover:bg-coral-dark disabled:opacity-50"
                              >
                                Guardar calificación
                              </button>
                              <button
                                onClick={() => setExpandedUid(null)}
                                className="px-3 py-1.5 text-ink/60 dark:text-gray-400 text-xs font-medium rounded-full hover:bg-pink-light dark:hover:bg-gray-700 flex items-center gap-1"
                              >
                                <IconX className="w-3.5 h-3.5" />
                                Cerrar
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};