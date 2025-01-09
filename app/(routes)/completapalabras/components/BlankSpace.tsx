import React from 'react';
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
        inline-block mx-1 px-3 py-1 min-w-20 border-2 rounded-full 
        transition-all duration-300 transform 
        ${isDragging ? 'hover:bg-blue-50' : 'hover:scale-105'}
        ${
          blank.filledWord
            ? isCorrect
              ? 'bg-green-100 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-move rotate-1'
              : 'bg-red-100 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-move -rotate-1'
            : 'border-black border-dashed text-black bg-white'
        }
        ${isDragging ? 'hover:border-blue-500' : ''}
      `}
    >
      <span
        className={`
          block text-center font-medium
          ${blank.filledWord ? 'cursor-move' : 'text-gray-500'}
        `}
      >
        {blank.filledWord || '____'}
      </span>
    </span>
  );
};

export default BlankSpace;
