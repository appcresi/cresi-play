import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { IconLoader, IconCheck, IconPhoto } from '@tabler/icons-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebaseFirestore';
import ClassroomService from '@/lib/classroomService';
import type { Classroom } from '@/types/classroom';
import { getActivityById } from '@/lib/activities';
import { SaveIndicator } from './SaveIndicator';
import { useAutosave } from './useAutosave';

const ACCENT = getActivityById('infografias')?.color ?? '#00897B';

interface InfografiaOption {
  id: string;
  title: string;
  cover: string;
}

// ==================== "Infografías visibles" (inline, autoguardado) ====================
//
// Mismo criterio "lista de bloqueadas" que QuestionsPicker: todo visible
// salvo lo que el docente apague — así una infografía nueva que se suba
// después queda visible por default. Acá no hay agrupación por etiqueta
// (no aplica), es una grilla plana de las infografías con su propia
// miniatura como identificador visual.

export const InfografiasPicker = ({
  classroom,
  onChanged,
}: {
  classroom: Classroom;
  onChanged: (restrictedInfografias: string[] | null) => void;
}) => {
  const [infografias, setInfografias] = useState<InfografiaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState<Set<string>>(new Set(classroom.restrictedInfografias ?? []));
  const { saveState, scheduleSave } = useAutosave();

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'infografias'), where('author', '==', 'CRESI')));
        setInfografias(
          snap.docs.map((d) => ({ id: d.id, title: d.data().title, cover: d.data().cover }))
        );
      } catch (err) {
        console.error('Error cargando infografías:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = (next: Set<string>) => scheduleSave(async () => {
    const value = next.size === 0 ? null : Array.from(next);
    await ClassroomService.updateRestrictedInfografias(classroom.id, value);
    onChanged(value);
  });

  const toggle = (id: string) => {
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      save(next);
      return next;
    });
  };

  const allowAll = () => {
    setBlocked(new Set());
    save(new Set());
  };

  const visibleCount = infografias.length - blocked.size;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-medium text-ink flex items-center gap-1.5">
          <IconPhoto className="w-4 h-4" style={{ color: ACCENT }} />
          Infografías visibles
        </h3>
        {!loading && infografias.length > 0 && <SaveIndicator state={saveState} />}
      </div>
      <p className="text-xs text-ink/60 mb-3">
        Tocá una infografía para prenderla/apagarla en esta clase — se guarda solo
        ({visibleCount}/{infografias.length} visibles).
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-ink/40">
          <IconLoader className="w-5 h-5 animate-spin" />
        </div>
      ) : infografias.length === 0 ? (
        <p className="text-sm text-ink/60">No se pudo cargar el listado de infografías.</p>
      ) : (
        <>
          <button onClick={allowAll} className="hover:underline text-xs font-medium mb-3 block" style={{ color: ACCENT }}>
            Permitir todas
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {infografias.map((info) => {
              const isBlocked = blocked.has(info.id);
              return (
                <button
                  key={info.id}
                  type="button"
                  onClick={() => toggle(info.id)}
                  className={`relative text-left rounded-xl border-2 overflow-hidden transition-all min-w-0 ${
                    isBlocked ? 'border-pink-light opacity-50 grayscale' : 'border-transparent shadow-sm'
                  }`}
                  style={!isBlocked ? { borderColor: ACCENT } : undefined}
                >
                  {!isBlocked && (
                    <div
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center z-10"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <IconCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="relative w-full h-20 bg-pink-light">
                    <Image
                      src={info.cover}
                      alt={info.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="text-[11px] font-medium text-ink leading-tight p-2 line-clamp-2">
                    {info.title}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};