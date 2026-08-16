import React, { useEffect, useState } from 'react';
import { IconLoader, IconBooks } from '@tabler/icons-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ClassroomService from '@/lib/classroomService';
import type { Classroom } from '@/types/classroom';
import { getActivityById } from '@/lib/activities';
import { SaveIndicator } from './SaveIndicator';
import { ToggleCard } from './ToggleCard';
import { useAutosave } from './useAutosave';
import type { TeacherCompletaPalabrasOption } from './types';

// Mismo color que ya tiene "Completa Palabras" en el catálogo de actividades.
const ACCENT = getActivityById('completa')?.color ?? '#7B1FA2';

// ==================== "Completa Palabras visibles" (inline, autoguardado) ====================
//
// Mismo criterio que TriviasPicker: las lecciones de CrESI + las propias
// del docente se ven en todas sus clases por default, pero acá puede
// apagar puntualmente cuáles quiere que vean los alumnos de ESTA clase.
// `null` en visibleCompletaPalabras = todas (sin restricción).

export const CompletaPalabrasPicker = ({
  classroom,
  teacherId,
  onChanged,
}: {
  classroom: Classroom;
  teacherId: string;
  onChanged: (visibleCompletaPalabras: string[] | null) => void;
}) => {
  const [lessons, setLessons] = useState<TeacherCompletaPalabrasOption[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { saveState, scheduleSave } = useAutosave();

  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      try {
        setLoadingLessons(true);
        const mapDoc = (isOwn: boolean) => (d: any): TeacherCompletaPalabrasOption => {
          const data = d.data();
          return {
            id: data.id || d.id,
            title: data.title,
            leccionesCount: Array.isArray(data.lecciones) ? data.lecciones.length : 0,
            isOwn,
          };
        };
        // Las propias del docente + el catálogo de CrESI — el docente puede
        // apagar tanto unas como otras (ej: una lección de CrESI que
        // todavía no corresponde a la edad de sus alumnos).
        const [ownSnap, cresiSnap] = await Promise.all([
          getDocs(query(collection(db, 'completapalabras'), where('author', '==', teacherId))),
          getDocs(query(collection(db, 'completapalabras'), where('author', '==', 'CRESI'))),
        ]);
        const list: TeacherCompletaPalabrasOption[] = [
          ...ownSnap.docs.map(mapDoc(true)),
          ...cresiSnap.docs.map(mapDoc(false)),
        ];
        setLessons(list);
        // Si visibleCompletaPalabras es null (sin restricción todavía),
        // arrancamos con todas tildadas — refleja el estado real.
        setSelected(new Set(classroom.visibleCompletaPalabras ?? list.map((l) => l.id)));
      } catch (err) {
        console.error('Error cargando lecciones de Completa Palabras:', err);
      } finally {
        setLoadingLessons(false);
      }
    })();
  }, [teacherId, classroom.visibleCompletaPalabras]);

  // Si están todas tildadas, guardamos null (sin restricción) en vez de la
  // lista completa — así una lección nueva que se cree después también
  // aparece acá sin tener que volver a tocar nada.
  const save = (next: Set<string>) => scheduleSave(async () => {
    const value = next.size === lessons.length ? null : Array.from(next);
    await ClassroomService.updateVisibleCompletaPalabras(classroom.id, value);
    onChanged(value);
  });

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      save(next);
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set(lessons.map((l) => l.id));
    setSelected(next);
    save(next);
  };

  const selectNone = () => {
    setSelected(new Set());
    save(new Set());
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-medium text-ink">Completa Palabras visible</h3>
        {!loadingLessons && lessons.length > 0 && <SaveIndicator state={saveState} />}
      </div>
      <p className="text-xs text-ink/60 mb-3">
        Elegí qué lecciones (de CrESI y las tuyas propias) pueden ver los alumnos de esta clase — se guarda solo.
      </p>

      {loadingLessons ? (
        <div className="flex items-center justify-center py-8 text-ink/40">
          <IconLoader className="w-5 h-5 animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-ink/60">Todavía no hay lecciones disponibles.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 text-xs mb-3">
            <button onClick={selectAll} className="hover:underline font-medium" style={{ color: ACCENT }}>
              Marcar todas
            </button>
            <button onClick={selectNone} className="text-ink/60 hover:underline font-medium">
              Desmarcar todas
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {lessons.map((lesson) => (
              <ToggleCard
                key={lesson.id}
                isOn={selected.has(lesson.id)}
                color={ACCENT}
                icon={<IconBooks className="w-5 h-5" />}
                title={lesson.title}
                subtitle={`${lesson.leccionesCount} lecc.${!lesson.isOwn ? ' · CrESI' : ''}`}
                onClick={() => toggle(lesson.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};