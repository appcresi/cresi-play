import React from 'react';

interface GameControlsProps {
  onReset: () => void;
  onCheck: () => void;
  isComplete: boolean;
  isLastLevel: boolean;
  onNext: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onReset,
  onCheck,
  isComplete,
  isLastLevel,
  onNext
}) => (
  <div className="flex gap-6 justify-center">
    <button
      onClick={onReset}
      className="px-6 py-3 bg-white border-4 border-black text-black font-black rounded-full
                shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform transition-all duration-300
                hover:scale-105 hover:-rotate-3 active:translate-y-1 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
    >
      Reiniciar juego
    </button>

    {!isComplete && (
      <button
        onClick={onCheck}
        className="px-6 py-3 bg-black text-white font-black rounded-full
                 shadow-[4px_4px_0px_0px_#FF6B6B] transform transition-all duration-300
                 hover:scale-105 hover:rotate-3 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#FF6B6B]"
      >
        Comprobar respuestas
      </button>
    )}

    {isComplete && !isLastLevel && (
      <button
        onClick={onNext}
        className="px-6 py-3 bg-green-500 text-white font-black rounded-full
                 shadow-[4px_4px_0px_0px_#4CAF50] transform transition-all duration-300
                 hover:scale-105 hover:rotate-3 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#4CAF50]"
      >
        Siguiente nivel
      </button>
    )}

    {isComplete && isLastLevel && (
      <div className="relative bg-yellow-100 border-4 border-black rounded-full px-6 py-3 transform rotate-2">
        <span className="font-black text-lg">¡Felicitaciones! Has completado todos los niveles</span>
      </div>
    )}
  </div>
);