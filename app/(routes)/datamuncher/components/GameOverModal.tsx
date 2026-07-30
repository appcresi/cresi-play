import React from 'react';
import { getActivityById } from '@/lib/activities';

const ACCENT = getActivityById('datamuncher')?.color ?? '#D32F2F';

type GameOverModalProps = {
  onRestart: () => void;
  isComplete: boolean;
};

const GameOverModal = ({ onRestart, isComplete }: GameOverModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
        {/* Header con color según resultado */}
        <div className={`h-2 ${isComplete ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}></div>

        {/* Contenido */}
        <div className="p-8 text-center">
          {/* Ícono circular */}
          <div className={`w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center text-3xl
            ${isComplete ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isComplete ? '🎉' : '💀'}
          </div>

          {/* Título */}
          <h2 className={`text-xl font-bold mb-2
            ${isComplete ? 'text-green-700' : 'text-red-700'}`}>
            {isComplete ? '¡Victoria total!' : '¡Fin del juego!'}
          </h2>

          {/* Mensaje */}
          <p className="text-gray-500 text-sm mb-7 leading-relaxed">
            {isComplete
              ? 'Has completado todos los niveles exitosamente. ¡Excelente trabajo!'
              : 'No te rindas. Cada intento es una oportunidad para aprender.'}
          </p>

          {/* Botón */}
          <button
            onClick={onRestart}
            className="w-full py-2.5 px-6 text-white text-sm font-semibold rounded-full
                     transition-all duration-200 shadow-sm hover:opacity-90"
            style={{ backgroundColor: isComplete ? '#16A34A' : ACCENT }}
          >
            {isComplete ? 'Jugar de nuevo' : 'Intentar nuevamente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;