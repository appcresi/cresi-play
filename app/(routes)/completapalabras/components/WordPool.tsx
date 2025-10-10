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
  <div className="relative">
    {/* Encabezado de la sección */}
    <div className="mb-4 flex items-center gap-2">
      <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
      <h3 className="text-lg font-medium text-gray-800">Banco de palabras</h3>
    </div>

    {/* Contenedor del banco de palabras */}
    <div
      className="bg-purple-50 border border-purple-200 rounded-lg p-6 hover:border-purple-300 transition-colors min-h-[120px]"
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
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm cursor-move 
                       transition-all duration-200 hover:shadow-md hover:border-purple-400 hover:-translate-y-0.5
                       active:shadow-sm active:translate-y-0"
            >
              <span className="font-medium text-gray-800 select-none">{word.text}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-20 text-gray-400">
          <div className="text-center">
            <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Todas las palabras han sido usadas</p>
          </div>
        </div>
      )}
    </div>

    {/* Instrucción sutil */}
    <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
      </svg>
      <span>Arrastra las palabras desde aquí o toca para seleccionar</span>
    </div>
  </div>
);