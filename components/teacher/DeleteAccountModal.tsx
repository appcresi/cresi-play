'use client';

import { useState } from 'react';
import { IconAlertTriangle, IconUserOff, IconLoader } from '@tabler/icons-react';

interface DeleteAccountModalProps {
  classroomCount: number;
  isDeleting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}

// Separado de DeleteClassModal a propósito: acá el impacto es mucho mayor
// (todas las clases del docente, con sus alumnos, tareas y entregas, más
// sus trivias y completapalabras propios) — por eso pide escribir
// "ELIMINAR" en vez de un simple botón de confirmación.
export function DeleteAccountModal({
  classroomCount,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: DeleteAccountModalProps): JSX.Element {
  const [confirmText, setConfirmText] = useState('');
  const canConfirm = confirmText.trim().toUpperCase() === 'ELIMINAR';

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
          <IconAlertTriangle size={24} className="text-red-600" />
        </div>
        <h3 className="font-bold text-ink mb-1">¿Eliminar tu cuenta de docente?</h3>
        <p className="text-sm text-ink/60 mb-3">
          {classroomCount > 0 ? (
            <>
              Tenés <strong>{classroomCount}</strong> {classroomCount === 1 ? 'clase' : 'clases'} creada
              {classroomCount === 1 ? '' : 's'}. Al eliminar tu cuenta se borran también esas clases
              completas — alumnos, tareas y entregas incluidas — y tus trivias y lecciones de
              Completa Palabras propias. Esta acción es <strong>permanente</strong>.
            </>
          ) : (
            <>Se borra tu perfil y cualquier trivia o lección propia. Esta acción es <strong>permanente</strong>.</>
          )}
        </p>

        <label className="block text-xs font-semibold text-ink/70 mb-1.5">
          Escribí <span className="font-mono">ELIMINAR</span> para confirmar
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={isDeleting}
          className="w-full px-3 py-2 border border-ink/15 rounded-lg focus:outline-none
                   focus:ring-2 focus:ring-red-500 text-sm mb-3 disabled:opacity-50"
          placeholder="ELIMINAR"
          autoFocus
        />

        {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-sm text-ink/70 hover:bg-pink-light rounded-lg disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm || isDeleting}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 text-white rounded-lg
                     hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? <IconLoader size={15} className="animate-spin" /> : <IconUserOff size={15} />}
            {isDeleting ? 'Eliminando...' : 'Eliminar cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}
