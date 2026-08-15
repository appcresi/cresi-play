import React, { useEffect, useState, useRef } from 'react';
import { IconLoader, IconCheck, IconBooks } from '@tabler/icons-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ClassroomService from '@/lib/classroomService';
import type { Classroom } from '@/types/classroom';
import { getActivityById } from '@/lib/activities';
import { SaveIndicator } from './SaveIndicator';
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
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const scheduleSave = (next: Set<string>, total: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        // Si están todas tildadas, guardamos null (sin restricción) en vez
        // de la lista completa — así una lección nueva que se cree después
        // también aparece acá sin tener que volver a tocar nada.
        const value = next.size === total ? null : Array.from(next);
        await ClassroomService.updateVisibleCompletaPalabras(classroom.id, value);
        onChanged(value);
        setSaveState('saved');
        setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500);
      } catch (err) {
        console.error(err);
        setSaveState('error');
      }
    }, 600);
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      scheduleSave(next, lessons.length);
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set(lessons.map((l) => l.id));
    setSelected(next);
    scheduleSave(next, lessons.length);
  };

  const selectNone = () => {
    setSelected(new Set());
    scheduleSave(new Set(), lessons.length);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-medium text-gray-900">Completa Palabras visible</h3>
        {!loadingLessons && lessons.length > 0 && <SaveIndicator state={saveState} />}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Elegí qué lecciones (de CrESI y las tuyas propias) pueden ver los alumnos de esta clase — se guarda solo.
      </p>

      {loadingLessons ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <IconLoader className="w-5 h-5 animate-spin" />
        </div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">Todavía no hay lecciones disponibles.</p>
        </div>
      ) : (
        <>
          <div className="flex gap-3 text-xs mb-3">
            <button onClick={selectAll} className="hover:underline font-medium" style={{ color: ACCENT }}>
              Marcar todas
            </button>
            <button onClick={selectNone} className="text-gray-500 hover:underline font-medium">
              Desmarcar todas
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {lessons.map((lesson) => {
              const isOn = selected.has(lesson.id);
              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => toggle(lesson.id)}
                  className={`relative text-left rounded-xl border-2 p-3 transition-all min-w-0 ${
                    isOn
                      ? 'border-transparent shadow-sm'
                      : 'border-gray-100 opacity-50 grayscale hover:opacity-75 hover:grayscale-0'
                  }`}
                  style={isOn ? { borderColor: ACCENT, backgroundColor: `${ACCENT}0D` } : undefined}
                >
                  {isOn && (
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <IconCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
                    style={{ backgroundColor: ACCENT }}
                  >
                    <IconBooks className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5 line-clamp-2 break-words">
                    {lesson.title}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    {lesson.leccionesCount} lecc.{!lesson.isOwn && ' · CrESI'}
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