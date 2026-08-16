import React, { useEffect, useState } from 'react';
import { IconPlus, IconClipboardList, IconTrash, IconPencil, IconLoader } from '@tabler/icons-react';
import TareaService from '@/lib/tareaService';
import type { Tarea, LinkedActivity } from '@/types/tarea';
import type { ClassroomStudent } from '@/types/classroom';
import { CreateTareaModal } from './CreateTareaModal';

const LINKED_TYPE_LABELS: Record<LinkedActivity['type'], string> = {
  libre: 'Sin actividad ligada',
  trivia: 'Trivia',
  buscador: 'Buscador de Preguntas',
  infografia: 'Infografía',
  completapalabras: 'Completa Palabras',
  actividad: 'Actividad del catálogo',
};

export const TareasTab = ({
  classroomId,
  teacherId,
  students,
  onOpenTarea,
}: {
  classroomId: string;
  teacherId: string;
  students: ClassroomStudent[];
  /** Navega a la pantalla completa de calificación (vive en ClassroomDetailView). */
  onOpenTarea: (tarea: Tarea) => void;
}) => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tarea | null>(null);

  const loadTareas = async () => {
    setLoading(true);
    try {
      const list = await TareaService.getTareasForClassroom(classroomId);
      setTareas(list);
    } catch (err) {
      console.error('Error cargando tareas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTareas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  const handleCreate = async (data: Parameters<typeof TareaService.createTarea>[2]) => {
    await TareaService.createTarea(classroomId, teacherId, data);
    setShowCreateModal(false);
    await loadTareas();
  };

  const handleEdit = async (data: Parameters<typeof TareaService.createTarea>[2]) => {
    if (!editingTarea) return;
    await TareaService.updateTarea(classroomId, editingTarea.id, data);
    setEditingTarea(null);
    await loadTareas();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await TareaService.deleteTarea(classroomId, deleteTarget.id);
      setTareas((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    } catch (err) {
      console.error('Error borrando tarea:', err);
    } finally {
      setDeleteTarget(null);
    }
  };

  const isPastDue = (dueDate: string) => new Date(dueDate).getTime() < Date.now();

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-medium text-ink">Tareas</h3>
          <p className="text-xs text-ink/60 mt-0.5">Asigná consignas, ligadas o no a una actividad, con fecha de entrega y puntos.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-mint hover:bg-mint-light text-mint-text rounded-full text-xs font-medium transition-colors shrink-0"
        >
          <IconPlus className="w-4 h-4" />
          Crear tarea
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-ink/40">
          <IconLoader className="w-6 h-6 animate-spin" />
        </div>
      ) : tareas.length === 0 ? (
        <p className="text-sm text-ink/40 text-center py-12">Todavía no creaste ninguna tarea.</p>
      ) : (
        <ul className="divide-y divide-pink-light border border-pink-light rounded-lg overflow-hidden">
          {tareas.map((tarea) => (
            <li key={tarea.id} className="p-4 hover:bg-cream transition-colors">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => onOpenTarea(tarea)} className="flex items-start gap-3 flex-1 min-w-0 text-left">
                  <div className="w-9 h-9 rounded-lg bg-mint text-mint-text flex items-center justify-center shrink-0">
                    <IconClipboardList className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{tarea.title}</p>
                    <p className="text-xs text-ink/60 mt-0.5 line-clamp-1">{tarea.consigna}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="inline-block px-2 py-0.5 bg-pink-light text-ink/70 text-[11px] rounded-full">
                        {LINKED_TYPE_LABELS[tarea.linkedActivity.type]}
                        {tarea.linkedActivity.label ? `: ${tarea.linkedActivity.label}` : ''}
                      </span>
                      <span className="text-[11px] text-ink/60">{tarea.points} pts</span>
                      <span className={`text-[11px] ${isPastDue(tarea.dueDate) ? 'text-red-500' : 'text-ink/60'}`}>
                        Entrega: {new Date(tarea.dueDate).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditingTarea(tarea)}
                    className="p-1.5 text-ink/40 hover:text-coral-dark hover:bg-pink-light rounded-full transition"
                    aria-label="Editar tarea"
                  >
                    <IconPencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(tarea)}
                    className="p-1.5 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                    aria-label="Eliminar tarea"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showCreateModal && (
        <CreateTareaModal teacherId={teacherId} onClose={() => setShowCreateModal(false)} onSave={handleCreate} />
      )}

      {editingTarea && (
        <CreateTareaModal
          teacherId={teacherId}
          existing={editingTarea}
          onClose={() => setEditingTarea(null)}
          onSave={handleEdit}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
            <h3 className="font-bold text-ink mb-1">¿Eliminar esta tarea?</h3>
            <p className="text-sm text-ink/60 mb-4">
              &quot;{deleteTarget.title}&quot; se va a borrar. Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm text-ink/70 hover:bg-pink-light rounded-lg">
                Cancelar
              </button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};