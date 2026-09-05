import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  IconArrowLeft,
  IconLoader,
  IconClipboardList,
  IconUsers,
  IconCircleDashed,
  IconCards,
  IconSearch,
  IconPhoto,
  IconTypography,
  IconPuzzle,
  IconCloud,
  IconApps,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseFirestore';
import { ACTIVITIES, getActivityById } from '@/lib/activities';
import { bodySystems } from '@/app/(routes)/biopuzzle/data/bodySystems';
import { colorForTrivia } from '@/lib/triviaColors';
import { ToggleCard } from '@/components/teacher/ToggleCard';
import WordCloudService from '@/lib/wordCloudService';
import type { LinkedActivity, LinkedActivityType, Tarea } from '@/types/tarea';

const COMPLETA_ACCENT = getActivityById('completa')?.color ?? '#7B1FA2';
const NUBE_ACCENT = '#00897B';

interface ItemOption {
  id: string;
  label: string;
  /** Solo para infografías/BioPuzzle — se muestran como miniatura en vez de nombre. */
  cover?: string;
  /** Cantidad de preguntas (trivia) o lecciones (Completa Palabras), para
   *  la minicard. */
  count?: number;
  isOwn?: boolean;
  /** Solo para Nube de Palabras — si la sesión ya no acepta palabras. */
  active?: boolean;
}

interface AttachOption {
  type: LinkedActivityType;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

// El equivalente de este app a "Adjuntar" de Google Classroom no es
// archivos/links sueltos — es ligar la tarea a una actividad puntual del
// catálogo (o ninguna, solo la consigna de texto). Se muestran como
// chips con ícono, mismo lenguaje visual que el "Adjuntar" de la imagen,
// pero atados a algo que la app realmente sabe hacer.
const ATTACH_OPTIONS: AttachOption[] = [
  { type: 'libre', label: 'Ninguna', icon: IconCircleDashed },
  { type: 'trivia', label: 'Trivia', icon: IconCards },
  { type: 'buscador', label: 'Buscador', icon: IconSearch },
  { type: 'infografia', label: 'Infografía', icon: IconPhoto },
  { type: 'biopuzzle', label: 'BioPuzzle', icon: IconPuzzle },
  { type: 'completapalabras', label: 'Completa Palabras', icon: IconTypography },
  { type: 'nube', label: 'Nube de Palabras', icon: IconCloud },
  { type: 'actividad', label: 'Actividad del catálogo', icon: IconApps },
];

const TYPES_WITH_ITEM: LinkedActivityType[] = ['trivia', 'infografia', 'biopuzzle', 'completapalabras', 'nube', 'actividad'];
// A diferencia de los demás, elegir un desafío puntual de BioPuzzle es
// opcional — sin elegir ninguno, la tarea queda ligada a "cualquier
// sistema" y el alumno elige cuál jugar.
const OPTIONAL_ITEM_TYPES: LinkedActivityType[] = ['biopuzzle'];

// Con muchas opciones a la vez la grilla se hacía muy larga para elegir
// una sola — se pagina igual que la sección pública de Infografías (mismo
// PER_PAGE que InfografiasClient.tsx), para estos cuatro tipos que se
// muestran como grilla de tarjetas.
const ITEMS_PER_PAGE = 10;
const PAGINATED_TYPES: LinkedActivityType[] = ['trivia', 'infografia', 'completapalabras', 'nube'];

/**
 * Pantalla completa (no modal) para crear/editar una tarea — mismo
 * espíritu de layout que la pantalla de tarea de Google Classroom: tarjeta
 * grande a la izquierda (título + instrucciones + a qué se liga) y un
 * panel angosto a la derecha con para quién es, puntos y fecha de entrega.
 * Reemplaza el contenido de la clase, igual que TareaGradingScreen — no
 * es una superposición.
 */
export const CreateTareaScreen = ({
  classroomName,
  teacherId,
  existing,
  onBack,
  onSave,
}: {
  classroomName: string;
  teacherId: string;
  /** Si viene, es edición — precarga los campos. */
  existing?: Tarea;
  onBack: () => void;
  onSave: (data: { title: string; consigna: string; linkedActivity: LinkedActivity; points: number; dueDate: string }) => Promise<void>;
}) => {
  const [title, setTitle] = useState(existing?.title ?? '');
  const [consigna, setConsigna] = useState(existing?.consigna ?? '');
  const [points, setPoints] = useState(existing?.points ?? 100);
  const [dueDate, setDueDate] = useState(existing?.dueDate?.slice(0, 10) ?? '');
  const [linkedType, setLinkedType] = useState<LinkedActivityType>(existing?.linkedActivity?.type ?? 'libre');
  const [linkedId, setLinkedId] = useState<string | undefined>(existing?.linkedActivity?.id);

  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Trae las opciones de la lista puntual (trivia/infografía/completa
  // palabras/BioPuzzle/Nube de Palabras/actividad) cada vez que cambia el
  // tipo elegido. Si ya venía de una tarea existente con ese mismo tipo,
  // no pisa la selección previa.
  useEffect(() => {
    if (existing?.linkedActivity?.type !== linkedType) {
      setLinkedId(undefined);
    }
    setItemsPage(1);
    if (!TYPES_WITH_ITEM.includes(linkedType)) {
      setItemOptions([]);
      return;
    }

    if (linkedType === 'actividad') {
      setItemOptions(ACTIVITIES.map((a) => ({ id: a.id, label: a.title })));
      return;
    }

    if (linkedType === 'biopuzzle') {
      setItemOptions(bodySystems.map((s) => ({ id: s.id, label: s.name, cover: s.imageUrl })));
      return;
    }

    (async () => {
      setLoadingItems(true);
      try {
        if (linkedType === 'infografia') {
          // Las infografías son solo de CrESI (no hay creación por docente).
          const snap = await getDocs(query(collection(db, 'infografias'), where('author', '==', 'CRESI')));
          setItemOptions(snap.docs.map((d) => ({ id: d.id, label: d.data().title, cover: d.data().cover })));
        } else if (linkedType === 'trivia') {
          const [ownSnap, cresiSnap] = await Promise.all([
            getDocs(query(collection(db, 'trivia'), where('author', '==', teacherId))),
            getDocs(query(collection(db, 'trivia'), where('author', '==', 'CRESI'))),
          ]);
          const mapTrivia = (isOwn: boolean) => (d: (typeof ownSnap.docs)[number]): ItemOption => ({
            id: d.id,
            label: d.data().name,
            count: Array.isArray(d.data().questions) ? d.data().questions.length : 0,
            isOwn,
          });
          setItemOptions([...ownSnap.docs.map(mapTrivia(true)), ...cresiSnap.docs.map(mapTrivia(false))]);
        } else if (linkedType === 'completapalabras') {
          const [ownSnap, cresiSnap] = await Promise.all([
            getDocs(query(collection(db, 'completapalabras'), where('author', '==', teacherId))),
            getDocs(query(collection(db, 'completapalabras'), where('author', '==', 'CRESI'))),
          ]);
          const mapLesson = (isOwn: boolean) => (d: (typeof ownSnap.docs)[number]): ItemOption => ({
            id: d.id,
            label: d.data().title,
            count: Array.isArray(d.data().lecciones) ? d.data().lecciones.length : 0,
            isOwn,
          });
          setItemOptions([...ownSnap.docs.map(mapLesson(true)), ...cresiSnap.docs.map(mapLesson(false))]);
        } else {
          // 'nube': solo las sesiones propias del docente (no hay catálogo
          // de CrESI para esto, cada una es de una clase puntual).
          const sessions = await WordCloudService.getTeacherSessions(teacherId);
          setItemOptions(
            sessions.map((s) => ({ id: s.code, label: s.title || 'Sin consigna', active: s.active }))
          );
        }
      } catch (err) {
        console.error('Error cargando opciones para la tarea:', err);
      } finally {
        setLoadingItems(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedType, teacherId]);

  const needsItem = TYPES_WITH_ITEM.includes(linkedType);
  const itemOptional = OPTIONAL_ITEM_TYPES.includes(linkedType);
  const usesPagination = PAGINATED_TYPES.includes(linkedType);
  const totalPages = Math.max(1, Math.ceil(itemOptions.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(itemsPage, totalPages);
  const pageItems = usesPagination
    ? itemOptions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    : itemOptions;

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Ponele un título a la tarea.');
      return;
    }
    if (!dueDate) {
      setError('Elegí una fecha de entrega.');
      return;
    }
    if (needsItem && !itemOptional && !linkedId) {
      setError('Elegí cuál trivia/infografía/lección/actividad querés asignar.');
      return;
    }
    // Sin actividad ligada, la consigna es lo único que le va a decir al
    // alumno qué tiene que hacer — sin esto la tarea le llega vacía.
    if (linkedType === 'libre' && !consigna.trim()) {
      setError('Escribí las instrucciones, o ligá la tarea a una actividad.');
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
      onBack();
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la tarea.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-ink/60 dark:text-gray-400 hover:text-ink dark:hover:text-gray-100 mb-2"
          >
            <IconArrowLeft size={16} />
            Volver
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-mint text-mint-text flex items-center justify-center shrink-0">
              <IconClipboardList size={18} />
            </div>
            <h1 className="text-xl font-bold text-ink dark:text-gray-100">Tarea</h1>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-full bg-coral text-white text-sm font-semibold hover:bg-coral-dark disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {saving && <IconLoader size={16} className="animate-spin" />}
          {existing ? 'Guardar cambios' : 'Crear tarea'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Columna izquierda: título, instrucciones, a qué se liga */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm overflow-hidden">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título*"
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900/40 text-ink dark:text-gray-100 text-lg font-medium
                       border-b border-pink-light dark:border-gray-700 focus:outline-none focus:bg-white dark:focus:bg-gray-800"
            />
            <p className="px-4 pt-2 text-xs text-ink/40 dark:text-gray-500">*Obligatorio</p>

            <textarea
              value={consigna}
              onChange={(e) => setConsigna(e.target.value)}
              rows={6}
              placeholder="Instrucciones (opcional)"
              className="w-full px-4 py-3.5 bg-gray-50 dark:bg-gray-900/40 text-ink dark:text-gray-100 text-sm resize-none
                       focus:outline-none focus:bg-white dark:focus:bg-gray-800 mt-3"
            />
          </div>

          {/* "Adjuntar" — acá se liga la tarea a una actividad del catálogo */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-ink dark:text-gray-100 mb-3">Adjuntar</h3>
            <div className="flex flex-wrap gap-2">
              {ATTACH_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const selected = linkedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setLinkedType(opt.type)}
                    className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 transition-all min-w-[92px] ${
                      selected
                        ? 'border-coral bg-coral/5 text-coral-dark'
                        : 'border-pink-light dark:border-gray-700 text-ink/60 dark:text-gray-400 hover:border-ink/20 dark:hover:border-gray-500'
                    }`}
                  >
                    <Icon size={22} />
                    <span className="text-[11px] font-medium text-center leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {needsItem && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-ink dark:text-gray-100 mb-1.5">
                  {linkedType === 'biopuzzle' ? 'Elegí el desafío (opcional)' : 'Elegí cuál'}
                </label>
                {loadingItems ? (
                  <div className="flex items-center gap-2 text-ink/40 dark:text-gray-500 text-sm py-2">
                    <IconLoader size={16} className="animate-spin" /> Cargando opciones...
                  </div>
                ) : itemOptions.length === 0 && linkedType === 'nube' ? (
                  <p className="text-xs text-ink/40 dark:text-gray-500">
                    Todavía no creaste ninguna nube.{' '}
                    <a href="/docente/nube-de-palabras" target="_blank" className="text-coral-dark hover:underline font-medium">
                      Crear una →
                    </a>
                  </p>
                ) : itemOptions.length === 0 ? (
                  <p className="text-xs text-ink/40 dark:text-gray-500">No hay opciones disponibles todavía.</p>
                ) : linkedType === 'biopuzzle' ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setLinkedId(undefined)}
                      className={`flex flex-col items-center justify-center gap-1 w-20 h-20 rounded-xl border-2 transition-all text-center px-1 ${
                        !linkedId
                          ? 'border-coral bg-coral/5 text-coral-dark'
                          : 'border-pink-light dark:border-gray-700 text-ink/60 dark:text-gray-400 hover:border-ink/20 dark:hover:border-gray-500'
                      }`}
                    >
                      <IconPuzzle size={20} />
                      <span className="text-[10px] font-medium leading-tight">Cualquiera</span>
                    </button>
                    {itemOptions.map((opt) => {
                      const selected = linkedId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setLinkedId(opt.id)}
                          title={opt.label}
                          className={`relative w-20 text-left rounded-xl border-2 overflow-hidden transition-all shrink-0 ${
                            selected ? 'border-coral shadow-sm' : 'border-pink-light dark:border-gray-700 hover:border-ink/20 dark:hover:border-gray-500'
                          }`}
                        >
                          {selected && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-coral flex items-center justify-center z-10">
                              <IconCheck size={10} className="text-white" />
                            </div>
                          )}
                          <div className="relative w-20 h-14 bg-pink-light dark:bg-gray-700">
                            {opt.cover && (
                              <Image src={opt.cover} alt={opt.label} fill sizes="80px" className="object-cover" />
                            )}
                          </div>
                          <p className="text-[10px] font-medium text-ink dark:text-gray-100 leading-tight p-1 line-clamp-2">
                            {opt.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : linkedType === 'trivia' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {pageItems.map((opt) => (
                      <ToggleCard
                        key={opt.id}
                        isOn={linkedId === opt.id}
                        color={colorForTrivia(opt.id)}
                        icon={<IconCards className="w-5 h-5" />}
                        title={opt.label}
                        subtitle={`${opt.count ?? 0} preg.${opt.isOwn === false ? ' · CrESI' : ''}`}
                        onClick={() => setLinkedId(opt.id)}
                      />
                    ))}
                  </div>
                ) : linkedType === 'completapalabras' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {pageItems.map((opt) => (
                      <ToggleCard
                        key={opt.id}
                        isOn={linkedId === opt.id}
                        color={COMPLETA_ACCENT}
                        icon={<IconTypography className="w-5 h-5" />}
                        title={opt.label}
                        subtitle={`${opt.count ?? 0} lecc.${opt.isOwn === false ? ' · CrESI' : ''}`}
                        onClick={() => setLinkedId(opt.id)}
                      />
                    ))}
                  </div>
                ) : linkedType === 'nube' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {pageItems.map((opt) => (
                      <ToggleCard
                        key={opt.id}
                        isOn={linkedId === opt.id}
                        color={NUBE_ACCENT}
                        icon={<IconCloud className="w-5 h-5" />}
                        title={opt.label}
                        subtitle={opt.active === false ? 'Cerrada' : 'Activa'}
                        onClick={() => setLinkedId(opt.id)}
                      />
                    ))}
                  </div>
                ) : linkedType === 'infografia' ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {pageItems.map((opt) => {
                      const selected = linkedId === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setLinkedId(opt.id)}
                          title={opt.label}
                          className={`relative text-left rounded-xl border-2 overflow-hidden transition-all min-w-0 ${
                            selected ? 'border-coral shadow-sm' : 'border-pink-light dark:border-gray-700 hover:border-ink/20 dark:hover:border-gray-500'
                          }`}
                        >
                          {selected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-coral flex items-center justify-center z-10">
                              <IconCheck size={12} className="text-white" />
                            </div>
                          )}
                          <div className="relative w-full h-20 bg-pink-light dark:bg-gray-700">
                            {opt.cover && (
                              <Image
                                src={opt.cover}
                                alt={opt.label}
                                fill
                                sizes="(max-width: 640px) 33vw, 20vw"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-ink dark:text-gray-100 leading-tight p-1.5 line-clamp-2">
                            {opt.label}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <select
                    value={linkedId ?? ''}
                    onChange={(e) => setLinkedId(e.target.value)}
                    className="w-full px-3 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
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

                {usesPagination && itemOptions.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <button
                      type="button"
                      onClick={() => setItemsPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-full border border-pink-light dark:border-gray-700 text-ink/50 dark:text-gray-400 hover:bg-cream dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Página anterior"
                    >
                      <IconChevronLeft size={14} />
                    </button>
                    <span className="text-xs text-ink/50 dark:text-gray-400 px-1">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setItemsPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-full border border-pink-light dark:border-gray-700 text-ink/50 dark:text-gray-400 hover:bg-cream dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Página siguiente"
                    >
                      <IconChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Columna derecha: para quién, puntos, fecha de entrega */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-ink/60 dark:text-gray-400 uppercase mb-1.5">Para</p>
            <p className="text-sm font-medium text-ink dark:text-gray-100">{classroomName}</p>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink/60 dark:text-gray-400 uppercase mb-1.5">Asignar a</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cream dark:bg-gray-900/40 rounded-full text-sm text-ink dark:text-gray-100">
              <IconUsers size={15} />
              Todos los alumnos
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 dark:text-gray-400 uppercase mb-1.5">Puntos</label>
            <input
              type="number"
              min={0}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full px-3 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 dark:text-gray-400 uppercase mb-1.5">Fecha de entrega*</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-coral"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
