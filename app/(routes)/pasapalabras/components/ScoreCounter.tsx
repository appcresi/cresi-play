import React from 'react';

interface ScoreCounterProps {
  score: number;
}

const ScoreCounter: React.FC<ScoreCounterProps> = ({ score }) => {
  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold">Puntos: {score}</h2>
    </div>
  );
};

export default ScoreCounter;