import React from 'react';
import { AnswerOption } from '../types/types';

type GameCellProps = {
  x: number;
  y: number;
  isWall: boolean;
  isPlayer: boolean;
  isGhost: boolean;
  ghostIndex: number;
  isQuiz: boolean;
  isDot: boolean;
  direction: string;
  answerOption?: AnswerOption;
};

const GameCell = ({ 
  x, 
  y, 
  isWall, 
  isPlayer, 
  isGhost, 
  ghostIndex, 
  isQuiz, 
  isDot, 
  direction, 
  answerOption 
}: GameCellProps) => {
  const getPlayerEmoji = () => {
    switch (direction) {
      case 'right': return '😀';
      case 'left': return '😊';
      case 'up': return '😃';
      case 'down': return '😄';
      default: return '😀';
    }
  };

  const getEnemyEmoji = (index: number) => {
    const enemies = ['🦠', '🍄', '🦠'];
    return enemies[index % enemies.length];
  };

  const getContent = () => {
    if (isWall) return '🧱';
    if (isPlayer) return getPlayerEmoji();
    if (isGhost) return getEnemyEmoji(ghostIndex);
    if (answerOption) return answerOption.value ? '✅' : '❌';
    if (isQuiz) return '❓';
    if (isDot) return <div className="w-1 h-1 sm:w-2 sm:h-2 bg-yellow-300 rounded-full animate-pulse shadow-lg" />;
    return ' ';
  };

  return (
    <div
      className={`aspect-square w-full flex items-center justify-center transition-all duration-200 text-sm sm:text-base
        ${isWall ? 'bg-gradient-to-br from-blue-700 to-blue-900 shadow-inner' : ''}
        ${isPlayer || isGhost ? 'animate-pulse' : ''}
        ${answerOption ? 'bg-white/80 hover:bg-white cursor-pointer font-bold' : ''}`}
    >
      {getContent()}
    </div>
  );
};

export default GameCell;