import React, { useEffect, useState } from 'react';
import { IconX, IconLoader, IconCheck, IconClock, IconStar } from '@tabler/icons-react';
import TareaService from '@/lib/tareaService';
import type { Tarea, Entrega } from '@/types/tarea';
import type { ClassroomStudent } from '@/types/classroom';

export const TareaGradingModal = ({
  classroomId,
  tarea,
  students,
  onClose,
}: {
  classroomId: string;
  tarea: Tarea;
  students: ClassroomStudent[];
  onClose: () => void;
}) => {
  const [entregas, setEntregas] = useState<Record<string, Entrega>>({});
  const [loading, setLoading] = useState(true);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [gradeDraft, setGradeDraft] = useState('');
  const [feedbackDraft, setFeedbackDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEntregas = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntregas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId, tarea.id]);

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
      setSaving(true);
      await TareaService.gradeEntrega(classroomId, tarea.id, uid, {
        grade: gradeNum,
        feedback: feedbackDraft.trim() || undefined,
      });
      await loadEntregas();
      setExpandedUid(null);
    } catch (err) {
      console.error('Error calificando:', err);
    } finally {
      setSaving(false);
    }
  };

  const sortedStudents = [...students].sort((a, b) => a.username.localeCompare(b.username));

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{tarea.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Entrega: {new Date(tarea.dueDate).toLocaleDateString('es-AR')} · {tarea.points} puntos
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <IconLoader className="w-6 h-6 animate-spin" />
            </div>
          ) : sortedStudents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-12">Todavía no hay alumnos en esta clase.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sortedStudents.map((s) => {
                const entrega = entregas[s.uid];
                const isExpanded = expandedUid === s.uid;

                let statusBadge: React.ReactNode;
                if (!entrega) {
                  statusBadge = (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
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
                    <span className="flex items-center gap-1 text-xs font-medium text-indigo-600">
                      <IconCheck className="w-3.5 h-3.5" /> Entregada, sin calificar
                    </span>
                  );
                }

                return (
                  <li key={s.uid}>
                    <button
                      onClick={() => entrega && openStudent(s.uid)}
                      disabled={!entrega}
                      className={`w-full flex items-center justify-between px-5 py-3 text-left ${
                        entrega ? 'hover:bg-gray-50' : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={s.character?.image}
                          alt={s.character?.name}
                          className="w-7 h-7 rounded-full object-cover border border-gray-200"
                        />
                        <span className="text-sm font-medium text-gray-800">{s.username}</span>
                      </div>
                      {statusBadge}
                    </button>

                    {isExpanded && entrega && (
                      <div className="px-5 pb-4 bg-gray-50">
                        <p className="text-xs text-gray-500 mb-1">
                          Entregó el {new Date(entrega.submittedAt).toLocaleString('es-AR')}
                          {entrega.manuallyMarkedDone && ' · marcó la actividad como hecha'}
                        </p>
                        {entrega.responseText && (
                          <div className="bg-white rounded-lg border border-gray-200 p-3 text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                            {entrega.responseText}
                          </div>
                        )}

                        <div className="flex gap-2 items-start">
                          <div className="w-24">
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Nota</label>
                            <input
                              type="number"
                              min={0}
                              max={tarea.points}
                              value={gradeDraft}
                              onChange={(e) => setGradeDraft(e.target.value)}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[11px] font-medium text-gray-600 mb-1">Comentario (opcional)</label>
                            <input
                              type="text"
                              value={feedbackDraft}
                              onChange={(e) => setFeedbackDraft(e.target.value)}
                              placeholder="Devolución para el alumno..."
                              className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleSaveGrade(s.uid)}
                          disabled={saving || gradeDraft === ''}
                          className="mt-2 px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-full hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Guardar calificación
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};