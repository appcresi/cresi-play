import React, { useState } from 'react';
import type { Classroom } from '@/types/classroom';
import { ActivitiesPicker } from './ActivitiesPicker';
import { TriviasPicker } from './TriviasPicker';
import { QuestionsPicker } from './QuestionsPicker';
import { CompletaPalabrasPicker } from './CompletaPalabrasPicker';

type WorkSubTab = 'actividades' | 'trivias' | 'preguntas' | 'completapalabras';

const SUB_TABS: { key: WorkSubTab; label: string }[] = [
  { key: 'actividades', label: 'Actividades' },
  { key: 'trivias', label: 'Trivias' },
  { key: 'preguntas', label: 'Preguntas' },
  { key: 'completapalabras', label: 'Completa Palabras' },
];

// Antes las 3 (Actividades/Trivias/Preguntas) se mostraban apiladas, una
// tarjeta debajo de la otra, en "Trabajo en clase". Con las 3 juntas el
// scroll se hacía largo — ahora son solapas dentro de una sola tarjeta.
export const WorkInClassTab = ({
  classroom,
  teacherId,
  totalActivities,
  onActivitiesChanged,
  onTriviasChanged,
  onQuestionsChanged,
  onCompletaPalabrasChanged,
}: {
  classroom: Classroom;
  teacherId: string;
  totalActivities: number;
  onActivitiesChanged: (allowedActivities: string[] | null) => void;
  onTriviasChanged: (visibleTrivias: string[] | null) => void;
  onQuestionsChanged: (restrictedTags: string[] | null, restrictedQuestionIds: string[] | null) => void;
  onCompletaPalabrasChanged: (visibleCompletaPalabras: string[] | null) => void;
}) => {
  const [subTab, setSubTab] = useState<WorkSubTab>('actividades');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex border-b border-gray-100 px-5 overflow-x-auto">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`py-3 px-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              subTab === t.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
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
      </div>
    </div>
  );
};