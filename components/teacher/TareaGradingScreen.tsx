import React, { useEffect, useState } from 'react';
import {
  IconArrowLeft,
  IconLoader,
  IconCheck,
  IconClock,
  IconStar,
  IconPencil,
  IconClipboardList,
} from '@tabler/icons-react';
import TareaService, { isEntregaLate } from '@/lib/tareaService';
import { LinkedActivityAttachment } from '@/components/tareas/LinkedActivityPreview';
import type { Tarea, Entrega, LinkedActivity } from '@/types/tarea';
import type { ClassroomStudent } from '@/types/classroom';

type GradingSubTab = 'instrucciones' | 'trabajo';

const LINKED_TYPE_LABELS: Record<LinkedActivity['type'], string> = {
  libre: 'Sin actividad ligada',
  trivia: 'Trivia',
  buscador: 'Buscador de Preguntas',
  infografia: 'Infografía',
  completapalabras: 'Completa Palabras',
  biopuzzle: 'BioPuzzle',
  nube: 'Nube de Palabras',
  actividad: 'Actividad del catálogo',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

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
  teacherName,
  onBack,
  onTareaUpdated,
}: {
  classroomId: string;
  tarea: Tarea;
  students: ClassroomStudent[];
  teacherName: string;
  onBack: () => void;
  onTareaUpdated: (updated: Tarea) => void;
}) => {
  const [subTab, setSubTab] = useState<GradingSubTab>('instrucciones');
  const [entregas, setEntregas] = useState<Record<string, Entrega>>({});
  const [loadingEntregas, setLoadingEntregas] = useState(true);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
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

  const selectStudent = (uid: string) => {
    setSelectedUid(uid);
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

  // Agrupado por estado, mismo criterio que "Trabajo de los alumnos" en
  // Classroom: primero lo que falta calificar, para que el docente no
  // tenga que buscarlo entre todos los alumnos.
  const paraCalificar = sortedStudents.filter((s) => entregas[s.uid]?.status === 'entregada');
  const calificadas = sortedStudents.filter((s) => entregas[s.uid]?.status === 'calificada');
  const sinEntregar = sortedStudents.filter((s) => !entregas[s.uid]);
  const groups: { key: string; label: string; students: ClassroomStudent[] }[] = [
    { key: 'para-calificar', label: 'Para calificar', students: paraCalificar },
    { key: 'calificadas', label: 'Calificadas', students: calificadas },
    { key: 'sin-entregar', label: 'Sin entregar', students: sinEntregar },
  ];

  // Al terminar de cargar, seleccionamos a alguien por default (prioridad a
  // quien falta calificar) — así el panel de la derecha no arranca vacío,
  // igual que Classroom abre directo en el primer alumno de la lista.
  useEffect(() => {
    if (loadingEntregas || selectedUid || sortedStudents.length === 0) return;
    const first = paraCalificar[0] ?? calificadas[0] ?? sinEntregar[0];
    if (first) selectStudent(first.uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingEntregas]);

  const selectedStudent = sortedStudents.find((s) => s.uid === selectedUid) ?? null;
  const selectedEntrega = selectedUid ? entregas[selectedUid] : undefined;
  const isLate = (entrega: Entrega) => isEntregaLate(tarea, entrega);

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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-pink-light dark:border-gray-700 p-5 sm:p-6 max-w-3xl">
            {!editingConsigna ? (
              <>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-pink-light dark:bg-gray-700 flex items-center justify-center shrink-0">
                      <IconClipboardList className="w-5 h-5 text-ink/60 dark:text-gray-300" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold text-ink dark:text-gray-100 leading-tight">{tarea.title}</h2>
                      <p className="text-xs text-ink/50 dark:text-gray-400 mt-1.5">
                        {teacherName} · {formatDate(tarea.createdAt)}
                        {tarea.updatedAt &&
                          Math.abs(new Date(tarea.updatedAt).getTime() - new Date(tarea.createdAt).getTime()) > 60_000 &&
                          ` (Última modificación: ${formatDate(tarea.updatedAt)})`}
                      </p>
                      <p className="text-xs text-ink/50 dark:text-gray-400 mt-1">
                        Tareas · {tarea.points} puntos | Fecha de entrega: {formatDate(tarea.dueDate)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingConsigna(true)}
                    title="Editar"
                    className="p-2 text-ink/40 dark:text-gray-500 hover:text-coral-dark hover:bg-pink-light dark:hover:bg-gray-700 rounded-full transition shrink-0"
                  >
                    <IconPencil className="w-4 h-4" />
                  </button>
                </div>

                <hr className="border-pink-light dark:border-gray-700 mb-4" />

                {tarea.consigna && (
                  <p className="text-sm text-ink/80 dark:text-gray-300 whitespace-pre-wrap mb-4">{tarea.consigna}</p>
                )}

                {tarea.linkedActivity.type !== 'libre' && (
                  <LinkedActivityAttachment linked={tarea.linkedActivity} classroomId={classroomId} />
                )}
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

            {loadingEntregas ? (
              <div className="flex items-center justify-center py-12 text-ink/40 dark:text-gray-500">
                <IconLoader className="w-6 h-6 animate-spin" />
              </div>
            ) : sortedStudents.length === 0 ? (
              <p className="text-sm text-ink/40 dark:text-gray-500 text-center py-12">Todavía no hay alumnos en esta clase.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-start">
                {/* Lista agrupada por estado */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-pink-light dark:border-gray-700 overflow-hidden">
                  {groups.map(
                    (group) =>
                      group.students.length > 0 && (
                        <div key={group.key}>
                          <div className="px-4 py-2 bg-cream dark:bg-gray-900/40 text-[11px] font-semibold text-ink/60 dark:text-gray-400 uppercase tracking-wide">
                            {group.label} · {group.students.length}
                          </div>
                          <ul className="divide-y divide-pink-light dark:divide-gray-700">
                            {group.students.map((s) => {
                              const entrega = entregas[s.uid];
                              const isSelected = selectedUid === s.uid;

                              let statusText: React.ReactNode;
                              if (!entrega) {
                                statusText = <span className="text-xs text-ink/40 dark:text-gray-500">—</span>;
                              } else if (entrega.status === 'calificada') {
                                statusText = (
                                  <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                    <IconStar className="w-3.5 h-3.5" /> {entrega.grade}/{tarea.points}
                                  </span>
                                );
                              } else {
                                statusText = (
                                  <span className="flex items-center gap-1 text-xs font-medium text-coral-dark">
                                    <IconCheck className="w-3.5 h-3.5" /> Sin calificar
                                  </span>
                                );
                              }

                              return (
                                <li key={s.uid}>
                                  <button
                                    onClick={() => selectStudent(s.uid)}
                                    className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left border-l-4 transition-colors ${
                                      isSelected
                                        ? 'border-coral bg-cream dark:bg-gray-700'
                                        : 'border-transparent hover:bg-cream dark:hover:bg-gray-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <img
                                        src={s.character?.image}
                                        alt={s.character?.name}
                                        className="w-8 h-8 rounded-full object-cover border border-pink-light dark:border-gray-700 shrink-0"
                                      />
                                      <span className="text-sm font-medium text-ink dark:text-gray-100 truncate">{s.username}</span>
                                    </div>
                                    <span className="shrink-0">{statusText}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )
                  )}
                </div>

                {/* Detalle del alumno seleccionado */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-pink-light dark:border-gray-700 p-5 lg:sticky lg:top-24">
                  {!selectedStudent ? (
                    <p className="text-sm text-ink/40 dark:text-gray-500 text-center py-8">
                      Elegí un alumno de la lista para ver su entrega.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 mb-1">
                        <img
                          src={selectedStudent.character?.image}
                          alt={selectedStudent.character?.name}
                          className="w-10 h-10 rounded-full object-cover border border-pink-light dark:border-gray-700 shrink-0"
                        />
                        <h3 className="text-base font-semibold text-ink dark:text-gray-100">{selectedStudent.username}</h3>
                      </div>

                      {!selectedEntrega ? (
                        <p className="text-sm text-ink/50 dark:text-gray-400 mt-3">Todavía no entregó esta tarea.</p>
                      ) : (
                        <>
                          <p className="text-xs text-ink/60 dark:text-gray-400 mt-1 mb-4">
                            Entregó el {new Date(selectedEntrega.submittedAt).toLocaleString('es-AR')}
                            {isLate(selectedEntrega) ? ' · con retraso' : ' · a tiempo'}
                            {selectedEntrega.manuallyMarkedDone && ' · marcó la actividad como hecha'}
                          </p>

                          {selectedEntrega.responseText && (
                            <div className="bg-cream dark:bg-gray-900/40 rounded-lg border border-pink-light dark:border-gray-700 p-3 text-sm text-ink/80 dark:text-gray-300 mb-4 whitespace-pre-wrap">
                              {selectedEntrega.responseText}
                            </div>
                          )}

                          <div className="flex gap-3 items-start">
                            <div className="w-28">
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
                          <button
                            onClick={() => handleSaveGrade(selectedStudent.uid)}
                            disabled={savingGrade || gradeDraft === ''}
                            className="mt-3 px-5 py-2 bg-coral text-white text-sm font-semibold rounded-full hover:bg-coral-dark disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {savingGrade && <IconLoader className="w-3.5 h-3.5 animate-spin" />}
                            {selectedEntrega.status === 'calificada' ? 'Actualizar calificación' : 'Guardar calificación'}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};