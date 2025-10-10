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
  <div className="relative">
    {/* Encabezado de la sección */}
    <div className="mb-4 flex items-center gap-2">
      <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
      <h3 className="text-lg font-medium text-gray-800">Completa el texto</h3>
    </div>

    {/* Contenedor del texto */}
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
      <div className="text-base leading-relaxed text-gray-800">
        {textParts.map((part, index) => (
          <React.Fragment key={index}>
            <span className="select-text">{part}</span>
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

    {/* Instrucción sutil */}
    <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>Arrastra las palabras a los espacios en blanco</span>
    </div>
  </div>
);