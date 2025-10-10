import React from 'react';

interface GameControlsProps {
  onReset: () => void;
  onCheck: () => void;
  onBuyLife: () => void;
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
  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
    <button
      onClick={onReset}
      className="w-full sm:w-auto px-6 py-2.5 bg-white text-gray-700 border border-gray-300 
                rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm
                flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Reiniciar juego
    </button>

    {!isComplete && (
      <button
        onClick={onCheck}
        className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white rounded-lg 
                 hover:bg-blue-700 transition-colors font-medium shadow-sm
                 flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Comprobar respuestas
      </button>
    )}

    {isComplete && !isLastLevel && (
      <button
        onClick={onNext}
        className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white rounded-lg 
                 hover:bg-green-700 transition-colors font-medium shadow-sm
                 flex items-center justify-center gap-2"
      >
        Siguiente nivel
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    )}

    {isComplete && isLastLevel && (
      <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
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