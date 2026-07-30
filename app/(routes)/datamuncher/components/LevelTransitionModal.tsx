import React from 'react';
import { IconCircleCheck } from '@tabler/icons-react';
import { getActivityById } from '@/lib/activities';

const ACCENT = getActivityById('datamuncher')?.color ?? '#D32F2F';

type LevelTransitionModalProps = {
  currentLevel: number;
};

const LevelTransitionModal = ({ currentLevel }: LevelTransitionModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
        {/* Barra superior verde */}
        <div className="h-2 bg-gradient-to-r from-green-500 to-green-600"></div>

        {/* Contenido */}
        <div className="p-8 text-center">
          {/* Ícono de éxito */}
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-green-50 flex items-center justify-center">
            <IconCircleCheck className="w-9 h-9 text-green-600" />
          </div>

          {/* Título */}
          <h2 className="text-xl font-bold text-green-700 mb-2">
            ¡Nivel {currentLevel + 1} completado!
          </h2>

          {/* Mensaje */}
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Excelente trabajo. Preparándote para el siguiente desafío...
          </p>

          {/* Indicador de carga */}
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full animate-pulse"
              style={{ width: '70%', backgroundColor: ACCENT }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelTransitionModal;