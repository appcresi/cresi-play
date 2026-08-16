import React from 'react';

export const DeleteClassModal = ({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5">
      <h3 className="font-bold text-ink mb-1">¿Eliminar esta clase?</h3>
      <p className="text-sm text-ink/60 mb-4">
        Se van a borrar también todos los alumnos asociados. Esta acción no se puede deshacer.
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-ink/70 hover:bg-pink-light rounded-lg"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Eliminar
        </button>
      </div>
    </div>
  </div>
);