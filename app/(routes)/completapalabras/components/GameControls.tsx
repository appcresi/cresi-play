import React from 'react';
import { IconRefresh, IconCircleCheck, IconArrowRight } from '@tabler/icons-react';

interface GameControlsProps {
  onReset: () => void;
  onCheck: () => void;
  onBuyLife: () => void;
  isComplete: boolean;
  isLastLevel: boolean;
  onNext: () => void;
  accentColor?: string;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onReset,
  onCheck,
  isComplete,
  isLastLevel,
  onNext,
  accentColor = '#7B1FA2',
}) => (
  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
    <button
      onClick={onReset}
      className="w-full sm:w-auto px-6 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600
                rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-sm
                flex items-center justify-center gap-2"
    >
      <IconRefresh className="w-4.5 h-4.5" />
      Reiniciar juego
    </button>

    {!isComplete && (
      <button
        onClick={onCheck}
        className="w-full sm:w-auto px-6 py-2.5 text-white rounded-full
                 hover:opacity-90 transition-colors font-medium shadow-sm
                 flex items-center justify-center gap-2"
        style={{ backgroundColor: accentColor }}
      >
        <IconCircleCheck className="w-4.5 h-4.5" />
        Comprobar respuestas
      </button>
    )}

    {isComplete && !isLastLevel && (
      <button
        onClick={onNext}
        className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-full
                 hover:bg-green-700 transition-colors font-medium shadow-sm
                 flex items-center justify-center gap-2"
      >
        Siguiente nivel
        <IconArrowRight className="w-4.5 h-4.5" />
      </button>
    )}

    {isComplete && isLastLevel && (
      <div className="w-full bg-green-50 border border-green-200 rounded-xl p-4 mt-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <IconCircleCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">¡Felicitaciones!</p>
            <p className="text-sm text-green-700">Has completado todos los niveles</p>
          </div>
        </div>
      </div>
    )}
  </div>
);