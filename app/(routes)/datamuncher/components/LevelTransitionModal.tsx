import React from 'react';

type LevelTransitionModalProps = {
  currentLevel: number;
};

const LevelTransitionModal = ({ currentLevel }: LevelTransitionModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-yellow-300 mb-4 animate-bounce">
          ¡Nivel {currentLevel + 1} Completado!
        </h2>
        <p className="text-2xl text-white">
          Preparándote para el siguiente nivel...
        </p>
      </div>
    </div>
  );
};

export default  LevelTransitionModal;