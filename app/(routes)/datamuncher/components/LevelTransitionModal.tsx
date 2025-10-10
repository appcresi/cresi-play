import React from 'react';

type LevelTransitionModalProps = {
  currentLevel: number;
};

const LevelTransitionModal = ({ currentLevel }: LevelTransitionModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        {/* Barra de progreso verde */}
        <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>
        
        {/* Contenido */}
        <div className="p-8 text-center">
          {/* Ícono de éxito */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* Título */}
          <h2 className="text-2xl font-medium text-green-700 mb-3">
            ¡Nivel {currentLevel + 1} completado!
          </h2>
          
          {/* Mensaje */}
          <p className="text-gray-600 text-base mb-6 leading-relaxed">
            Excelente trabajo. Preparándote para el siguiente desafío...
          </p>
          
          {/* Indicador de carga */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelTransitionModal;