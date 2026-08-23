import React from 'react';
import { IconSchool, IconPlus } from '@tabler/icons-react';
import type { Classroom } from '@/types/classroom';
import { ClassroomCard } from './ClassroomCard';

export const ClassroomGridView = ({
  classrooms,
  error,
  onOpenClassroom,
  onCreateClick,
  onCopyCode,
  copiedCode,
}: {
  classrooms: Classroom[];
  error: string;
  onOpenClassroom: (c: Classroom) => void;
  onCreateClick: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}) => (
  <div className="max-w-6xl mx-auto px-4 py-8">
    {/* Barra superior estilo Classroom */}
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-coral flex items-center justify-center">
          <IconSchool className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-medium text-ink dark:text-gray-100">Aula virtual</h1>
      </div>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-4 py-2 border border-pink-light dark:border-gray-700 rounded-lg
                 hover:bg-pink-light dark:hover:bg-gray-700 transition-colors text-sm font-medium text-ink/80 dark:text-gray-300"
      >
        <IconPlus className="w-4 h-4" />
        Crear clase
      </button>
    </div>

    {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

    {classrooms.length === 0 ? (
      <div className="text-center py-24">
        <IconSchool className="w-14 h-14 text-pink-light mx-auto mb-4" />
        <p className="text-ink/60 dark:text-gray-400 mb-4">Todavía no creaste ninguna clase.</p>
        <button
          onClick={onCreateClick}
          className="px-5 py-2 bg-coral text-white rounded-full text-sm font-medium hover:bg-coral-dark"
        >
          Crear tu primera clase
        </button>
      </div>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {classrooms.map((classroom) => (
          <ClassroomCard
            key={classroom.id}
            classroom={classroom}
            onOpen={() => onOpenClassroom(classroom)}
            onCopyCode={onCopyCode}
            copiedCode={copiedCode}
          />
        ))}
      </div>
    )}
  </div>
);