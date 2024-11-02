import React from 'react';

interface ScoreCounterProps {
  score: number;
}

const ScoreCounter: React.FC<ScoreCounterProps> = ({ score }) => {
  return (
    <div className="flex flex-col items-center text-sm sm:text-xs md:text-base">
      <p className="font-medium text-base sm:text-sm md:text-lg">Puntos</p> {/* Ajuste de tamaño de letra */}
      <div className="relative w-10 h-10 sm:w-8 sm:h-8 md:w-12 md:h-12 flex items-center justify-center"> {/* Contenedor reducido */}
        <div className="flex items-center justify-center absolute inset-0 text-lg sm:text-base md:text-xl font-semibold">
          {score}
        </div>
      </div>
    </div>


  );
};

export default ScoreCounter;