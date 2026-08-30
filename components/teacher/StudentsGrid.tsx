import React, { useState } from 'react';
import Image from 'next/image';
import { IconKey, IconX } from '@tabler/icons-react';
import type { ClassroomStudent, PendingStudent } from '@/types/classroom';
import { formatDate } from './utils';

type SortKey = 'username' | 'lastActive';
type SortDir = 'asc' | 'desc';

// ==================== Roster de alumnos ("Personas") ====================
// El detalle de progreso/calificaciones vive en TareasGradebook — acá
// solo la lista de alumnos con sus credenciales y la gestión de altas/bajas.

export const StudentsGrid = ({
  students,
  pending,
  onRemoveStudent,
  onRemovePending,
  onManageStudentCredentials,
  onManagePendingCredentials,
}: {
  students: ClassroomStudent[];
  pending: PendingStudent[];
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
    if (sortKey === 'lastActive') {
      return ((a.progress?.lastActive ?? '') > (b.progress?.lastActive ?? '') ? 1 : -1) * dir;
    }
    return a.username.localeCompare(b.username) * dir;
  });

  const SortHeader = ({ label, sortableKey }: { label: string; sortableKey: SortKey }) => (
    <th
      onClick={() => toggleSort(sortableKey)}
      className="text-left text-[11px] font-medium text-ink/60 dark:text-gray-400 uppercase px-3 py-2 cursor-pointer
               hover:text-coral-dark select-none whitespace-nowrap"
    >
      {label} {sortKey === sortableKey && (sortDir === 'asc' ? '▲' : '▼')}
    </th>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-pink-light dark:border-gray-700">
            <SortHeader label="Alumno" sortableKey="username" />
            <SortHeader label="Última vez" sortableKey="lastActive" />
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {sortedStudents.map((s) => (
            <tr key={s.uid} className="border-b border-pink-light dark:border-gray-700 transition-colors">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Image
                    src={s.character?.image || '/logocresi.svg'}
                    alt={s.character?.name ?? ''}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full object-cover border border-pink-light"
                  />
                  <span className="font-medium text-ink dark:text-gray-100 whitespace-nowrap">{s.username}</span>
                </div>
              </td>

              <td className="px-3 py-2 text-ink/60 dark:text-gray-400 whitespace-nowrap text-xs">
                {formatDate(s.progress?.lastActive)}
              </td>

              <td className="px-3 py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); onManageStudentCredentials(s); }}
                    className="text-ink/25 dark:text-gray-600 hover:text-coral-dark"
                    title="Ver/cambiar usuario y contraseña"
                  >
                    <IconKey className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveStudent(s.uid); }}
                    className="text-ink/25 dark:text-gray-600 hover:text-red-600"
                    title="Eliminar alumno"
                  >
                    <IconX className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {pending.map((p) => (
            <tr key={p.id} className="border-b border-pink-light dark:border-gray-700 bg-amber-50/50 dark:bg-amber-950/20">
              <td className="px-3 py-2">
                <span className="font-medium text-ink/60 dark:text-gray-400">{p.username}</span>
              </td>
              <td className="px-3 py-2 text-xs text-amber-600">
                Todavía no inició sesión
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onManagePendingCredentials(p)}
                    className="text-ink/25 dark:text-gray-600 hover:text-coral-dark"
                    title="Ver/cambiar usuario y contraseña"
                  >
                    <IconKey className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemovePending(p.id)}
                    className="text-ink/25 dark:text-gray-600 hover:text-red-600"
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
