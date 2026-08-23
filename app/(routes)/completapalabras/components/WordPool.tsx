import React from 'react';
import { IconFileText, IconHandFinger } from '@tabler/icons-react';
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
  accentColor?: string;
}

export const WordPool: React.FC<WordPoolProps> = ({
  words,
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
      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Banco de palabras</h3>
    </div>

    {/* Contenedor del banco de palabras */}
    <div
      className="rounded-xl p-6 border transition-colors min-h-[120px]"
      style={{ backgroundColor: `${accentColor}0D`, borderColor: `${accentColor}30` }}
      onDragOver={handleDragOver}
      onDrop={onDrop}
      data-word-pool="true"
    >
      {words.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {words.map((word) => (
            <div
              key={word.id}
              draggable
              onDragStart={() => onDragStart(word)}
              onTouchStart={(e) => onTouchStart(e, word)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm cursor-move
                       transition-all duration-200 hover:shadow-md hover:-translate-y-0.5
                       active:shadow-sm active:translate-y-0"
            >
              <span className="font-medium text-gray-800 dark:text-gray-200 select-none">{word.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-20 text-gray-400 dark:text-gray-500">
          <div className="text-center">
            <IconFileText className="w-7 h-7 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Todas las palabras han sido usadas</p>
          </div>
        </div>
      )}
    </div>

    {/* Instrucción sutil */}
    <div className="mt-3 flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
      <IconHandFinger className="w-4 h-4 shrink-0" />
      <span>Arrastra las palabras desde aquí o toca para seleccionar</span>
    </div>
  </div>
);