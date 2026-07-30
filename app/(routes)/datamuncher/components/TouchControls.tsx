import React from 'react';
import { IconArrowUp, IconArrowDown, IconArrowLeft, IconArrowRight } from '@tabler/icons-react';

interface TouchControlsProps {
  onMove: (direction: string) => void;
}

const TouchControls: React.FC<TouchControlsProps> = ({ onMove }) => {
    const buttonBaseClass = "w-14 h-14 bg-white/80 rounded-full flex items-center justify-center active:bg-white/60 shadow-md transition-colors";
  return (
    <div className="flex justify-center md:hidden">
      <div className="grid grid-cols-3 gap-3 bg-black/10 backdrop-blur-sm p-4 rounded-xl">
        {/* Botón Superior */}
        <div className="col-start-2">
          <button
            onClick={() => onMove('ArrowUp')}
            className={buttonBaseClass}
            aria-label="Arriba"
          >
            <IconArrowUp className="w-8 h-8" />
          </button>
        </div>

        {/* Botones Laterales */}
        <div className="col-start-1 row-start-2 flex justify-end">
          <button
            onClick={() => onMove('ArrowLeft')}
            className={buttonBaseClass}
            aria-label="Izquierda"
          >
            <IconArrowLeft className="w-8 h-8" />
          </button>
        </div>

        <div className="col-start-3 row-start-2 flex justify-start">
          <button
            onClick={() => onMove('ArrowRight')}
            className={buttonBaseClass}
            aria-label="Derecha"
          >
            <IconArrowRight className="w-8 h-8" />
          </button>
        </div>

        {/* Botón Inferior */}
        <div className="col-start-2 row-start-3">
          <button
            onClick={() => onMove('ArrowDown')}
            className={buttonBaseClass}
            aria-label="Abajo"
          >
            <IconArrowDown className="w-8 h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TouchControls;