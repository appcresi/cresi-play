'use client';

import { useEffect, useRef } from 'react';
import { IconAlertTriangle, IconTrash, IconX } from '@tabler/icons-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  triviaName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  triviaName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-pink-light dark:border-gray-700 w-full max-w-md p-6">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 text-ink/40 dark:text-gray-500 hover:text-ink/70 dark:hover:text-gray-300 hover:bg-pink-light dark:hover:bg-gray-700 rounded-lg transition"
          aria-label="Cerrar"
        >
          <IconX size={18} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
            <IconAlertTriangle size={28} className="text-red-600" />
          </div>

          <div>
            <h2 id="delete-modal-title" className="text-lg font-bold text-ink dark:text-gray-100 mb-1">
              ¿Eliminar trivia?
            </h2>
            <p className="text-ink/60 dark:text-gray-400 text-sm">
              Vas a eliminar{' '}
              <span className="font-semibold text-ink dark:text-gray-100">"{triviaName}"</span>.
              Esta acción no se puede deshacer.
            </p>
          </div>

          <div className="flex gap-3 w-full pt-2">
            <button
              ref={cancelRef}
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-pink-light dark:bg-gray-700 hover:bg-pink dark:hover:bg-gray-600 text-ink/80 dark:text-gray-300 font-semibold rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition"
            >
              <IconTrash size={17} />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}