import React from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { Blank, Word } from './types';

interface BlankSpaceProps {
  blank: Blank;
  onDragStart: (word: Word | null, blankId?: string) => void;
  onTouchStart: (e: React.TouchEvent, word: Word | null, blankId?: string) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onDrop: (targetBlankId: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  isDragging: boolean;
}

const BlankSpace: React.FC<BlankSpaceProps> = ({
  blank,
  onDragStart,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onDrop,
  handleDragOver,
  isDragging
}) => {
  const isCorrect = blank.filledWord === blank.correctWord;

  const filledWordObject = blank.filledWord
    ? {
        id: blank.filledWordId || '',
        text: blank.filledWord,
        isCorrect: isCorrect,
      }
    : null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop(blank.id);
  };

  return (
    <span
      data-blank-id={blank.id}
      draggable={!!blank.filledWord}
      onDragStart={() => blank.filledWord && onDragStart(filledWordObject, blank.id)}
      onTouchStart={(e) => blank.filledWord && onTouchStart(e, filledWordObject, blank.id)}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`
        inline-block mx-1 px-3 py-1 min-w-20 border rounded-lg
        transition-all duration-200
        ${isDragging ? 'hover:bg-indigo-50 hover:border-indigo-300' : ''}
        ${
          blank.filledWord
            ? isCorrect
              ? 'bg-green-50 border-green-400 text-green-900 cursor-move shadow-sm'
              : 'bg-red-50 border-red-400 text-red-900 cursor-move shadow-sm'
            : 'border-gray-300 border-dashed text-gray-400 bg-white hover:border-gray-400'
        }
      `}
    >
      <span
        className={`
          flex items-center justify-center text-center font-medium text-sm select-none
          ${blank.filledWord ? 'cursor-move' : ''}
        `}
      >
        {blank.filledWord ? (
          <span className="flex items-center gap-1">
            {isCorrect ? (
              <IconCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
            ) : (
              <IconX className="w-3.5 h-3.5 text-red-600 shrink-0" />
            )}
            {blank.filledWord}
          </span>
        ) : (
          '________'
        )}
      </span>
    </span>
  );
};

export default BlankSpace;