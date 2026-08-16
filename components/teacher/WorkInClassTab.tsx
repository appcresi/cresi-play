import React, { useState } from 'react';
import type { Classroom, ClassroomStudent } from '@/types/classroom';
import type { Tarea } from '@/types/tarea';
import { ActivitiesPicker } from './ActivitiesPicker';
import { TriviasPicker } from './TriviasPicker';
import { QuestionsPicker } from './QuestionsPicker';
import { CompletaPalabrasPicker } from './CompletaPalabrasPicker';
import { InfografiasPicker } from './InfografiasPicker';
import { TareasTab } from './TareasTab';

type WorkSubTab = 'actividades' | 'trivias' | 'preguntas' | 'completapalabras' | 'infografias' | 'tareas';

const SUB_TABS: { key: WorkSubTab; label: string }[] = [
  { key: 'actividades', label: 'Actividades' },
  { key: 'trivias', label: 'Trivias' },
  { key: 'preguntas', label: 'Preguntas' },
  { key: 'completapalabras', label: 'Completa Palabras' },
  { key: 'infografias', label: 'Infografías' },
  { key: 'tareas', label: 'Tareas' },
];

// Antes las 3 (Actividades/Trivias/Preguntas) se mostraban apiladas, una
// tarjeta debajo de la otra, en "Trabajo en clase". Con las 3 juntas el
// scroll se hacía largo — ahora son solapas dentro de una sola tarjeta.
// "Tareas" se agregó acá (no como solapa propia del detalle de la clase)
// porque conceptualmente es parte de "qué trabajo tienen los alumnos",
// igual que las demás.
export const WorkInClassTab = ({
  classroom,
  teacherId,
  students,
  totalActivities,
  onActivitiesChanged,
  onTriviasChanged,
  onQuestionsChanged,
  onCompletaPalabrasChanged,
  onInfografiasChanged,
  onOpenTarea,
}: {
  classroom: Classroom;
  teacherId: string;
  students: ClassroomStudent[];
  totalActivities: number;
  onActivitiesChanged: (allowedActivities: string[] | null) => void;
  onTriviasChanged: (visibleTrivias: string[] | null) => void;
  onQuestionsChanged: (restrictedTags: string[] | null, restrictedQuestionIds: string[] | null) => void;
  onCompletaPalabrasChanged: (visibleCompletaPalabras: string[] | null) => void;
  onInfografiasChanged: (restrictedInfografias: string[] | null) => void;
  onOpenTarea: (tarea: Tarea) => void;
}) => {
  const [subTab, setSubTab] = useState<WorkSubTab>('actividades');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-pink-light overflow-hidden">
      <div className="flex border-b border-pink-light px-5 overflow-x-auto">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`py-3 px-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              subTab === t.key
                ? 'border-coral text-coral-dark'
                : 'border-transparent text-ink/60 hover:text-ink/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {subTab === 'actividades' && (
          <ActivitiesPicker
            classroom={classroom}
            totalActivities={totalActivities}
            onChanged={onActivitiesChanged}
          />
        )}
        {subTab === 'trivias' && (
          <TriviasPicker classroom={classroom} teacherId={teacherId} onChanged={onTriviasChanged} />
        )}
        {subTab === 'preguntas' && (
          <QuestionsPicker classroom={classroom} onChanged={onQuestionsChanged} />
        )}
        {subTab === 'completapalabras' && (
          <CompletaPalabrasPicker classroom={classroom} teacherId={teacherId} onChanged={onCompletaPalabrasChanged} />
        )}
        {subTab === 'infografias' && (
          <InfografiasPicker classroom={classroom} onChanged={onInfografiasChanged} />
        )}
        {subTab === 'tareas' && (
          <TareasTab classroomId={classroom.id} teacherId={teacherId} students={students} onOpenTarea={onOpenTarea} />
        )}
      </div>
    </div>
  );
};