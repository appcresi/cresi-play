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
        inline-block mx-1 px-3 py-1 min-w-20 border rounded-lg 
        transition-all duration-200
        ${isDragging ? 'hover:bg-blue-50 hover:border-blue-400' : ''}
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
            {isCorrect && (
              <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {!isCorrect && blank.filledWord && (
              <svg className="w-3.5 h-3.5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
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