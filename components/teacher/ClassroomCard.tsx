import React from 'react';
import { IconUsers, IconClock, IconCheck, IconCopy } from '@tabler/icons-react';
import type { Classroom } from '@/types/classroom';

export const ClassroomCard = ({
  classroom,
  onOpen,
  onCopyCode,
  copiedCode,
}: {
  classroom: Classroom;
  onOpen: () => void;
  onCopyCode: (code: string) => void;
  copiedCode: string | null;
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-pink-light dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group">
    {/* Banner de color, estilo Classroom */}
    <button onClick={onOpen} className="block w-full text-left">
      <div
        className="h-24 px-4 py-3 flex flex-col justify-between relative"
        style={{ backgroundColor: classroom.color }}
      >
        <h3 className="text-white font-medium text-base leading-tight pr-6 line-clamp-2">
          {classroom.name}
        </h3>
      </div>
    </button>

    {/* Cuerpo */}
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-ink/60 dark:text-gray-400">
          <IconUsers className="w-3.5 h-3.5" />
          {classroom.studentCount ?? 0} alumno{(classroom.studentCount ?? 0) !== 1 ? 's' : ''}
        </div>
        {(classroom.pendingCount ?? 0) > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <IconClock className="w-3.5 h-3.5" />
            {classroom.pendingCount} pendiente{(classroom.pendingCount ?? 0) !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <button
        onClick={() => onCopyCode(classroom.code)}
        title="Copiar link para compartir con tus alumnos"
        className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-cream dark:bg-gray-700 hover:bg-pink-light dark:hover:bg-gray-600
                 rounded-lg text-sm font-mono font-bold tracking-widest text-ink/80 dark:text-gray-300 transition-colors"
      >
        {classroom.code}
        {copiedCode === classroom.code
          ? <IconCheck className="w-4 h-4 text-green-600" />
          : <IconCopy className="w-4 h-4 text-ink/40 dark:text-gray-500" />}
      </button>
    </div>
  </div>
);