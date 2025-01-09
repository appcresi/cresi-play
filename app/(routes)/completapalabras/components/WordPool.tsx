import React from 'react';
import { Word } from './types';

interface WordPoolProps {
  words: Word[];
  onDragStart: (word: Word) => void;
  onTouchStart: (e: React.TouchEvent, word: Word) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onDrop: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  isDragging: boolean;
}

export const WordPool: React.FC<WordPoolProps> = ({
  words,
  onDragStart,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onDrop,
  handleDragOver,
  isDragging
}) => (
  <div
    className="relative bg-violet-100 border-4 border-black rounded-lg p-6 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform rotate-1"
    onDragOver={handleDragOver}
    onDrop={onDrop}
    data-word-pool="true"
  >
    <div className="flex flex-wrap gap-3">
      {words.map((word) => (
        <div
          key={word.id}
          draggable
          onDragStart={() => onDragStart(word)}
          onTouchStart={(e) => onTouchStart(e, word)}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          className="px-4 py-2 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-move 
                   transform transition-all duration-300 hover:scale-110 hover:-rotate-3"
        >
          <span className="font-bold">{word.text}</span>
        </div>
      ))}
    </div>
  </div>
);