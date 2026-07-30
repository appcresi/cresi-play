import React from 'react';
import { AnswerOption } from '../types/types';
import { getActivityById } from '@/lib/activities';

const ACCENT = getActivityById('datamuncher')?.color ?? '#D32F2F';

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
    if (isDot) return <div className="w-1 h-1 sm:w-2 sm:h-2 rounded-full shadow-sm" style={{ backgroundColor: ACCENT }} />;
    return ' ';
  };

  return (
    <div
      className={`aspect-square w-full flex items-center justify-center transition-all duration-150 text-sm sm:text-base
        ${isWall ? 'bg-gray-200 border border-gray-300' : ''}
        ${isPlayer ? 'bg-blue-50 rounded-sm' : ''}
        ${isGhost ? 'bg-red-50 rounded-sm' : ''}
        ${answerOption ? 'bg-white border border-gray-300 hover:border-blue-500 hover:shadow-sm cursor-pointer font-medium rounded' : ''}
        ${isQuiz ? 'bg-yellow-50 rounded-sm' : ''}`}
    >
      {getContent()}
    </div>
  );
};

export default GameCell;