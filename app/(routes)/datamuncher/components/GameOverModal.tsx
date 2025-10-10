import React from 'react';

type GameOverModalProps = {
  onRestart: () => void;
  isComplete: boolean;
};

const GameOverModal = ({ onRestart, isComplete }: GameOverModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        {/* Header con color según resultado */}
        <div className={`h-2 ${isComplete ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}></div>
        
        {/* Contenido */}
        <div className="p-8 text-center">
          {/* Ícono circular */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl
            ${isComplete ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isComplete ? '🎉' : '💀'}
          </div>
          
          {/* Título */}
          <h2 className={`text-2xl font-medium mb-3
            ${isComplete ? 'text-green-700' : 'text-red-700'}`}>
            {isComplete ? '¡Victoria total!' : '¡Fin del juego!'}
          </h2>
          
          {/* Mensaje */}
          <p className="text-gray-600 text-base mb-8 leading-relaxed">
            {isComplete 
              ? 'Has completado todos los niveles exitosamente. ¡Excelente trabajo!' 
              : 'No te rindas. Cada intento es una oportunidad para aprender.'}
          </p>
          
          {/* Botón estilo Material */}
          <button 
            onClick={onRestart}
            className={`w-full py-3 px-6 text-white text-base font-medium rounded 
                     transition-all duration-200 shadow-sm hover:shadow-md
                     ${isComplete 
                       ? 'bg-green-600 hover:bg-green-700' 
                       : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isComplete ? 'Jugar de nuevo' : 'Intentar nuevamente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;