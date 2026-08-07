import React, { useEffect, useState, useRef } from 'react';
import { IconLoader, IconCheck, IconClipboardList } from '@tabler/icons-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ClassroomService from '@/lib/classroomService';
import type { Classroom } from '@/types/classroom';
import { colorForTrivia } from '@/lib/triviaColors';
import { SaveIndicator } from './SaveIndicator';
import type { TeacherTriviaOption } from './types';

// ==================== "Trivias visibles" (inline, autoguardado) ====================
//
// Las trivias son del docente (se ven en todas sus clases por default,
// como decidimos), pero acá le damos control fino: puede apagar
// puntualmente cuáles quiere que vean los alumnos de ESTA clase en
// particular. `null` en visibleTrivias = todas (sin restricción).

export const TriviasPicker = ({
  classroom,
  teacherId,
  onChanged,
}: {
  classroom: Classroom;
  teacherId: string;
  onChanged: (visibleTrivias: string[] | null) => void;
}) => {
  const [trivias, setTrivias] = useState<TeacherTriviaOption[]>([]);
  const [loadingTrivias, setLoadingTrivias] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      try {
        setLoadingTrivias(true);
        const mapDoc = (isOwn: boolean) => (d: any): TeacherTriviaOption => {
          const data = d.data();
          return {
            id: data.id || d.id,
            name: data.name,
            questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
            isOwn,
          };
        };
        // Las propias del docente + el catálogo de CrESI — el docente puede
        // apagar tanto unas como otras (ej: una trivia de CrESI que todavía
        // no corresponde a la edad de sus alumnos, o un tema que no vieron).
        const [ownSnap, cresiSnap] = await Promise.all([
          getDocs(query(collection(db, 'trivia'), where('author', '==', teacherId))),
          getDocs(query(collection(db, 'trivia'), where('author', '==', 'CRESI'))),
        ]);
        const list: TeacherTriviaOption[] = [
          ...ownSnap.docs.map(mapDoc(true)),
          ...cresiSnap.docs.map(mapDoc(false)),
        ];
        setTrivias(list);
        // Si visibleTrivias es null (sin restricción todavía), arrancamos
        // con todas tildadas — refleja el estado real ("se ven todas").
        setSelected(new Set(classroom.visibleTrivias ?? list.map((t) => t.id)));
      } catch (err) {
        console.error('Error cargando trivias:', err);
      } finally {
        setLoadingTrivias(false);
      }
    })();
  }, [teacherId, classroom.visibleTrivias]);

  const scheduleSave = (next: Set<string>, total: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        setSaveState('saving');
        // Si están todas tildadas, guardamos null (sin restricción) en vez
        // de la lista completa — así una trivia nueva que cree después
        // también aparece acá sin tener que volver a tocar nada.
        const value = next.size === total ? null : Array.from(next);
        await ClassroomService.updateVisibleTrivias(classroom.id, value);
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
      scheduleSave(next, trivias.length);
      return next;
    });
  };

  const selectAll = () => {
    const next = new Set(trivias.map((t) => t.id));
    setSelected(next);
    scheduleSave(next, trivias.length);
  };

  const selectNone = () => {
    setSelected(new Set());
    scheduleSave(new Set(), trivias.length);
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="text-sm font-medium text-gray-900">Trivias visibles</h3>
        {!loadingTrivias && trivias.length > 0 && <SaveIndicator state={saveState} />}
      </div>
      <p className="text-xs text-gray-500 mb-3">
        Elegí cuáles de tus trivias pueden jugar los alumnos de esta clase — se guarda solo.
      </p>

      {loadingTrivias ? (
        <div className="flex items-center justify-center py-8 text-gray-400">
          <IconLoader className="w-5 h-5 animate-spin" />
        </div>
      ) : trivias.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-3">Todavía no creaste ninguna trivia.</p>
          <a
            href="/docente/trivias"
            className="text-indigo-600 hover:underline text-sm font-medium"
          >
            Crear tu primera trivia
          </a>
        </div>
      ) : (
        <>
          <div className="flex gap-3 text-xs mb-3">
            <button onClick={selectAll} className="text-indigo-600 hover:underline font-medium">
              Marcar todas
            </button>
            <button onClick={selectNone} className="text-gray-500 hover:underline font-medium">
              Desmarcar todas
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {trivias.map((trivia) => {
              const isOn = selected.has(trivia.id);
              const color = colorForTrivia(trivia.id);
              return (
                <button
                  key={trivia.id}
                  type="button"
                  onClick={() => toggle(trivia.id)}
                  className={`relative text-left rounded-xl border-2 p-3 transition-all min-w-0 ${
                    isOn
                      ? 'border-transparent shadow-sm'
                      : 'border-gray-100 opacity-50 grayscale hover:opacity-75 hover:grayscale-0'
                  }`}
                  style={isOn ? { borderColor: color, backgroundColor: `${color}0D` } : undefined}
                >
                  {isOn && (
                    <div
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: color }}
                    >
                      <IconCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
                    style={{ backgroundColor: color }}
                  >
                    <IconClipboardList className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5 line-clamp-2 break-words">
                    {trivia.name}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    {trivia.questionCount} preg.{!trivia.isOwn && ' · CrESI'}
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