import React from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
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
  accentColor?: string;
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
  isDragging,
  accentColor = '#7B1FA2',
}) => (
  <div className="relative">
    {/* Encabezado de la sección */}
    <div className="mb-4 flex items-center gap-2">
      <div className="w-1 h-6 rounded-full" style={{ backgroundColor: accentColor }}></div>
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Completa el texto</h3>
    </div>

    {/* Contenedor del texto */}
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="text-base leading-relaxed text-gray-800 dark:text-gray-200">
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
    <div className="mt-3 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
      <IconInfoCircle className="w-4 h-4 shrink-0" />
      <span>Arrastra las palabras a los espacios en blanco</span>
    </div>
  </div>
);