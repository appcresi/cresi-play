import React, { useEffect, useState } from 'react';
import { IconLoader, IconClipboardList } from '@tabler/icons-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ClassroomService from '@/lib/classroomService';
import type { Classroom } from '@/types/classroom';
import { colorForTrivia } from '@/lib/triviaColors';
import { SaveIndicator } from './SaveIndicator';
import { ToggleCard } from './ToggleCard';
import { useAutosave } from './useAutosave';
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
  const { saveState, scheduleSave } = useAutosave();

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

  // Si están todas tildadas, guardamos null (sin restricción) en vez de la
  // lista completa — así una trivia nueva que cree después también aparece
  // acá sin tener que volver a tocar nada.
  const save = (next: Set<string>) => scheduleSave(async () => {
    const value = next.size === trivias.length ? null : Array.from(next);
    await ClassroomService.updateVisibleTrivias(classroom.id, value);
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
    const next = new Set(trivias.map((t) => t.id));
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
            {trivias.map((trivia) => (
              <ToggleCard
                key={trivia.id}
                isOn={selected.has(trivia.id)}
                color={colorForTrivia(trivia.id)}
                icon={<IconClipboardList className="w-5 h-5" />}
                title={trivia.name}
                subtitle={`${trivia.questionCount} preg.${!trivia.isOwn ? ' · CrESI' : ''}`}
                onClick={() => toggle(trivia.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};