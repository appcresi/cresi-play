import React, { useState } from 'react';
import Image from 'next/image';
import { IconKey, IconX } from '@tabler/icons-react';
import type { ClassroomStudent, PendingStudent } from '@/types/classroom';
import { formatDate } from './utils';

type SortKey = 'username' | 'completed' | 'score' | 'streak' | 'lastActive';
type SortDir = 'asc' | 'desc';

// ==================== Grilla de progreso de todos los alumnos ====================

export const StudentsGrid = ({
  students,
  pending,
  totalActivities,
  mode,
  onSelectStudent,
  onRemoveStudent,
  onRemovePending,
  onManageStudentCredentials,
  onManagePendingCredentials,
}: {
  students: ClassroomStudent[];
  pending: PendingStudent[];
  totalActivities: number;
  mode: 'personas' | 'calificaciones';
  onSelectStudent: (s: ClassroomStudent) => void;
  onRemoveStudent: (uid: string) => void;
  onRemovePending: (pendingId: string) => void;
  onManageStudentCredentials: (s: ClassroomStudent) => void;
  onManagePendingCredentials: (p: PendingStudent) => void;
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('username');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortKey) {
      case 'completed':
        return ((a.progress?.completedCount ?? 0) - (b.progress?.completedCount ?? 0)) * dir;
      case 'score':
        return ((a.progress?.totalScore ?? 0) - (b.progress?.totalScore ?? 0)) * dir;
      case 'streak':
        return ((a.progress?.streak ?? 0) - (b.progress?.streak ?? 0)) * dir;
      case 'lastActive':
        return ((a.progress?.lastActive ?? '') > (b.progress?.lastActive ?? '') ? 1 : -1) * dir;
      default:
        return a.username.localeCompare(b.username) * dir;
    }
  });

  const SortHeader = ({ label, sortableKey }: { label: string; sortableKey: SortKey }) => (
    <th
      onClick={() => toggleSort(sortableKey)}
      className="text-left text-[11px] font-medium text-ink/60 uppercase px-3 py-2 cursor-pointer
               hover:text-coral-dark select-none whitespace-nowrap"
    >
      {label} {sortKey === sortableKey && (sortDir === 'asc' ? '▲' : '▼')}
    </th>
  );

  const isCalificaciones = mode === 'calificaciones';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-pink-light">
            <SortHeader label="Alumno" sortableKey="username" />
            {isCalificaciones ? (
              <>
                <th className="text-left text-[11px] font-medium text-ink/60 uppercase px-3 py-2 whitespace-nowrap">
                  Progreso
                </th>
                <SortHeader label="Completadas" sortableKey="completed" />
                <SortHeader label="Puntos" sortableKey="score" />
                <SortHeader label="Racha" sortableKey="streak" />
              </>
            ) : (
              <SortHeader label="Última vez" sortableKey="lastActive" />
            )}
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((s) => {
            const completed = s.progress?.completedCount ?? 0;
            const percentage = Math.round((completed / totalActivities) * 100);
            return (
              <tr
                key={s.uid}
                onClick={isCalificaciones ? () => onSelectStudent(s) : undefined}
                className={`border-b border-pink-light transition-colors ${
                  isCalificaciones ? 'hover:bg-cream cursor-pointer' : ''
                }`}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={s.character?.image || '/logocresi.svg'}
                      alt={s.character?.name ?? ''}
                      width={24}
                      height={24}
                      className="w-6 h-6 rounded-full object-cover border border-pink-light"
                    />
                    <span className="font-medium text-ink whitespace-nowrap">{s.username}</span>
                  </div>
                </td>

                {isCalificaciones ? (
                  <>
                    <td className="px-3 py-2 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-pink-light rounded-full h-1.5">
                          <div
                            className="bg-coral h-1.5 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-ink/60">{percentage}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-ink/80 whitespace-nowrap">
                      {completed}/{totalActivities}
                    </td>
                    <td className="px-3 py-2 text-yellow-700 font-medium whitespace-nowrap">
                      {s.progress?.totalScore ?? 0}
                    </td>
                    <td className="px-3 py-2 text-orange-600 whitespace-nowrap">
                      {s.progress?.streak ?? 0}
                    </td>
                  </>
                ) : (
                  <td className="px-3 py-2 text-ink/60 whitespace-nowrap text-xs">
                    {formatDate(s.progress?.lastActive)}
                  </td>
                )}

                <td className="px-3 py-2 text-right">
                  {!isCalificaciones && (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onManageStudentCredentials(s); }}
                        className="text-ink/25 hover:text-coral-dark"
                        title="Ver/cambiar usuario y contraseña"
                      >
                        <IconKey className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveStudent(s.uid); }}
                        className="text-ink/25 hover:text-red-600"
                        title="Eliminar alumno"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}

          {!isCalificaciones && pending.map((p) => (
            <tr key={p.id} className="border-b border-pink-light bg-amber-50/50">
              <td className="px-3 py-2">
                <span className="font-medium text-ink/60">{p.username}</span>
              </td>
              <td className="px-3 py-2 text-xs text-amber-600">
                Todavía no inició sesión
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onManagePendingCredentials(p)}
                    className="text-ink/25 hover:text-coral-dark"
                    title="Ver/cambiar usuario y contraseña"
                  >
                    <IconKey className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemovePending(p.id)}
                    className="text-ink/25 hover:text-red-600"
                    title="Eliminar"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};