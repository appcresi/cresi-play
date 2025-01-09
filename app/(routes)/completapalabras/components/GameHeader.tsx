import React from 'react';

interface GameHeaderProps {
  title: string;
  currentLevel: number;
  totalLevels: number;
  score: number;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ title, currentLevel, totalLevels, score }) => (
  <div className="flex justify-between items-center mb-4">
    <div className="relative bg-black text-white px-6 py-3 rounded-full transform -rotate-2 text-center">
      <h2 className="text-xl font-black">{title} - Nivel {currentLevel + 1}/{totalLevels}</h2>
      <h2>{`${score} pts`}</h2>
    </div>
  </div>
);