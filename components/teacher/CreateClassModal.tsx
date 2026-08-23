import React from 'react';
import { IconX, IconLoader } from '@tabler/icons-react';

export const CreateClassModal = ({
  name,
  onNameChange,
  error,
  creating,
  onClose,
  onCreate,
}: {
  name: string;
  onNameChange: (v: string) => void;
  error: string;
  creating: boolean;
  onClose: () => void;
  onCreate: () => void;
}) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-ink dark:text-gray-100">Crear clase</h3>
        <button onClick={onClose} className="text-ink/40 dark:text-gray-500 hover:text-ink/70 dark:hover:text-gray-300">
          <IconX className="w-5 h-5" />
        </button>
      </div>
      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Nombre de la clase (ej: 4to B - Biología)"
        disabled={creating}
        autoFocus
        className="w-full px-3 py-2 border border-pink-light dark:border-gray-700 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none
                 focus:ring-2 focus:ring-coral disabled:opacity-50 mb-1"
      />
      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-ink/70 dark:text-gray-400 hover:bg-pink-light dark:hover:bg-gray-700 rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={onCreate}
          disabled={creating}
          className="flex items-center gap-2 px-4 py-2 bg-coral text-white
                   rounded-lg hover:bg-coral-dark transition-colors text-sm font-medium disabled:opacity-50"
        >
          {creating && <IconLoader className="w-4 h-4 animate-spin" />}
          Crear
        </button>
      </div>
    </div>
  </div>
);