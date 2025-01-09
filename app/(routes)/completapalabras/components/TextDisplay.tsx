import React from 'react';
import BlankSpace from './BlankSpace';
import { Word, Blank } from './types';

interface TextDisplayProps {
  textParts: string[];
  blanks: Blank[];
  onDragStart: (word: Word | null, blankId?: string) => void;
  onTouchStart: (e: React.TouchEvent, word: Word | null, blankId?: string) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onDrop: (targetBlankId: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  isDragging: boolean;
}

export const TextDisplay: React.FC<TextDisplayProps> = ({
  textParts,
  blanks,
  onDragStart,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onDrop,
  handleDragOver,
  isDragging
}) => (
  <div className="relative bg-white border-4 border-black rounded-lg p-6 mb-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
    <div className="text-lg leading-relaxed">
      {textParts.map((part, index) => (
        <React.Fragment key={index}>
          {part}
          {index < blanks.length && (
            <BlankSpace 
              blank={blanks[index]} 
              onDragStart={onDragStart}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              onDrop={onDrop}
              handleDragOver={handleDragOver}
              isDragging={isDragging}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  </div>
);