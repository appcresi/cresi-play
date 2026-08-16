import React, { useEffect, useState } from 'react';
import { IconX, IconLoader } from '@tabler/icons-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ACTIVITIES } from '@/lib/activities';
import type { LinkedActivity, LinkedActivityType, Tarea } from '@/types/tarea';

interface ItemOption {
  id: string;
  label: string;
}

const TYPE_LABELS: Record<LinkedActivityType, string> = {
  libre: 'Ninguna (solo la consigna)',
  trivia: 'Jugar una trivia',
  buscador: 'Buscar en el Buscador de Preguntas',
  infografia: 'Ver una infografía',
  completapalabras: 'Completar una lección de Completa Palabras',
  actividad: 'Hacer una actividad del catálogo',
};

const TYPES_WITH_ITEM: LinkedActivityType[] = ['trivia', 'infografia', 'completapalabras', 'actividad'];

export const CreateTareaModal = ({
  teacherId,
  existing,
  onClose,
  onSave,
}: {
  teacherId: string;
  /** Si viene, es edición — precarga los campos. */
  existing?: Tarea;
  onClose: () => void;
  onSave: (data: { title: string; consigna: string; linkedActivity: LinkedActivity; points: number; dueDate: string }) => Promise<void>;
}) => {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [consigna, setConsigna] = useState(existing?.consigna ?? '');
  const [points, setPoints] = useState(existing?.points ?? 50);
  const [dueDate, setDueDate] = useState(existing?.dueDate?.slice(0, 10) ?? '');
  const [linkedType, setLinkedType] = useState<LinkedActivityType>(existing?.linkedActivity?.type ?? 'libre');
  const [linkedId, setLinkedId] = useState<string | undefined>(existing?.linkedActivity?.id);

  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Trae las opciones de la lista puntual (trivia/infografía/completa
  // palabras/actividad) cada vez que cambia el tipo elegido.
  useEffect(() => {
    setLinkedId(undefined);
    if (!TYPES_WITH_ITEM.includes(linkedType)) {
      setItemOptions([]);
      return;
    }

    if (linkedType === 'actividad') {
      setItemOptions(ACTIVITIES.map((a) => ({ id: a.id, label: a.title })));
      return;
    }

    (async () => {
      setLoadingItems(true);
      try {
        const collectionName = linkedType === 'trivia' ? 'trivia' : linkedType === 'infografia' ? 'infografias' : 'completapalabras';
        const fieldForLabel = linkedType === 'trivia' ? 'name' : 'title';

        if (linkedType === 'infografia') {
          // Las infografías son solo de CrESI (no hay creación por docente).
          const snap = await getDocs(query(collection(db, collectionName), where('author', '==', 'CRESI')));
          setItemOptions(snap.docs.map((d) => ({ id: d.id, label: d.data()[fieldForLabel] })));
        } else {
          const [ownSnap, cresiSnap] = await Promise.all([
            getDocs(query(collection(db, collectionName), where('author', '==', teacherId))),
            getDocs(query(collection(db, collectionName), where('author', '==', 'CRESI'))),
          ]);
          const own = ownSnap.docs.map((d) => ({ id: d.id, label: `${d.data()[fieldForLabel]} (mía)` }));
          const cresi = cresiSnap.docs.map((d) => ({ id: d.id, label: `${d.data()[fieldForLabel]} (CrESI)` }));
          setItemOptions([...own, ...cresi]);
        }
      } catch (err) {
        console.error('Error cargando opciones para la tarea:', err);
      } finally {
        setLoadingItems(false);
      }
    })();
  }, [linkedType, teacherId]);

  const needsItem = TYPES_WITH_ITEM.includes(linkedType);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Ponele un título a la tarea.');
      return;
    }
    if (!consigna.trim()) {
      setError('Escribí la consigna.');
      return;
    }
    if (!dueDate) {
      setError('Elegí una fecha de entrega.');
      return;
    }
    if (needsItem && !linkedId) {
      setError('Elegí cuál trivia/infografía/lección/actividad querés asignar.');
      return;
    }

    const selectedLabel = itemOptions.find((o) => o.id === linkedId)?.label;

    try {
      setSaving(true);
      setError('');
      await onSave({
        title: title.trim(),
        consigna: consigna.trim(),
        points,
        dueDate: new Date(dueDate).toISOString(),
        linkedActivity: {
          type: linkedType,
          id: needsItem ? linkedId : undefined,
          label: needsItem ? selectedLabel : undefined,
        },
      });
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la tarea.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-pink-light">
          <h2 className="text-lg font-bold text-ink">{existing ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <button onClick={onClose} className="text-ink/40 hover:text-ink/70">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Repaso de consentimiento"
              className="w-full px-3 py-2 border border-pink-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1">Consigna</label>
            <textarea
              value={consigna}
              onChange={(e) => setConsigna(e.target.value)}
              rows={3}
              placeholder="Qué tiene que hacer el alumno..."
              className="w-full px-3 py-2 border border-pink-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1">¿Ligada a alguna actividad?</label>
            <select
              value={linkedType}
              onChange={(e) => setLinkedType(e.target.value as LinkedActivityType)}
              className="w-full px-3 py-2 border border-pink-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {needsItem && (
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Elegí cuál</label>
              {loadingItems ? (
                <div className="flex items-center gap-2 text-ink/40 text-sm py-2">
                  <IconLoader className="w-4 h-4 animate-spin" /> Cargando opciones...
                </div>
              ) : itemOptions.length === 0 ? (
                <p className="text-xs text-ink/40">No hay opciones disponibles todavía.</p>
              ) : (
                <select
                  value={linkedId ?? ''}
                  onChange={(e) => setLinkedId(e.target.value)}
                  className="w-full px-3 py-2 border border-pink-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
                >
                  <option value="" disabled>
                    Seleccionar...
                  </option>
                  {itemOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Puntos</label>
              <input
                type="number"
                min={0}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3 py-2 border border-pink-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink mb-1">Fecha de entrega</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-pink-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
              />
            </div>
          </div>

          {error && <p className="text-red-600 text-xs">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-pink-light text-ink/80 text-sm font-medium hover:bg-cream"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 rounded-full bg-coral text-white text-sm font-medium hover:bg-coral-dark disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <IconLoader className="w-4 h-4 animate-spin" />}
              {existing ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};