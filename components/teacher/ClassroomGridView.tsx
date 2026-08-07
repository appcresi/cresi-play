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
        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
          <IconSchool className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-medium text-gray-800">Aula virtual</h1>
      </div>
      <button
        onClick={onCreateClick}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg
                 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
      >
        <IconPlus className="w-4 h-4" />
        Crear clase
      </button>
    </div>

    {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

    {classrooms.length === 0 ? (
      <div className="text-center py-24">
        <IconSchool className="w-14 h-14 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">Todavía no creaste ninguna clase.</p>
        <button
          onClick={onCreateClick}
          className="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700"
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