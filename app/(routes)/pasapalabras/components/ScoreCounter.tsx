import React from 'react';

interface ScoreCounterProps {
  score: number;
}

const ScoreCounter: React.FC<ScoreCounterProps> = ({ score }) => {
  return (
    <div className="flex flex-col items-center">
      <p className="font-medium text-lg">Puntos</p>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <p className='flex items-center justify-center absolute inset-0 text-2xl font-semibold'>{score}</p>
      </div>
    </div>
  );
};

export default ScoreCounter;