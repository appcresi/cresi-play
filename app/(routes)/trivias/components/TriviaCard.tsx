'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { type TriviaIndexFields, type TriviaStatus } from '@/types/trivia';
import { getTriviaStatus } from '@/utils/trivia';
import {
  IconTrophyFilled,
  IconTrophyOff,
  IconBolt,
  IconStar,
  IconCircle,
  IconChevronRight
} from '@tabler/icons-react';

export function TriviaCard(index: TriviaIndexFields): JSX.Element {
  const [triviaStatus, setTriviaStatus] = useState<TriviaStatus | undefined>(undefined);

  useEffect(() => {
    const status = getTriviaStatus(index.id);
    setTriviaStatus(status);
  }, [index.id]);

  const isCompleted = triviaStatus?.completed ?? false;
  const percentage = triviaStatus?.percentage ?? 0;

  // Asignar color único basado en el ID de la trivia
  const getColorById = (id: string) => {
    const colors = [
      '#1976D2', // Azul
      '#388E3C', // Verde
      '#F57C00', // Naranja
      '#7B1FA2', // Púrpura
      '#D32F2F', // Rojo
      '#0288D1', // Cian
      '#689F38', // Verde lima
      '#E64A19', // Naranja oscuro
      '#5D4037', // Marrón
      '#C2185B', // Rosa
    ];
    
    // Crear un hash simple del ID para obtener un índice consistente
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const triviaColor = getColorById(index.id);

  return (
    <article className="relative h-full">
      <Link href={`/trivias/pregame/${index.id}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer group h-full flex flex-col">
          
          {/* Header Banner */}
          <div className="relative">
            <div 
              className="h-24 rounded-t-lg flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: `${triviaColor}15` }}
            >
              {/* Ícono circular en primer plano */}
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center relative z-10"
                style={{ backgroundColor: triviaColor }}
              >
                <div className="text-white">
                  {isCompleted ? (
                    <IconTrophyFilled size={24} />
                  ) : (
                    <IconTrophyOff size={24} />
                  )}
                </div>
              </div>
            </div>
            
            {/* Status Badge */}
            {isCompleted && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <IconCircle size={14} className="text-white" />
                </div>
              </div>
            )}

            {/* Level Badge */}
            <div className="absolute bottom-2 left-3">
              <div className="flex items-center space-x-1 text-xs backdrop-blur-sm rounded-full px-2 py-1 bg-white/80 text-gray-600">
                <IconBolt size={12} />
                <span>Nivel {index.level ?? 1}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                {index.name}
              </h3>
              <IconChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
            
            {/* Score Display */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Mejor intento</span>
                <div className="flex items-center gap-1">
                  <IconStar size={16} className={percentage > 0 ? 'text-yellow-500' : 'text-gray-300'} />
                  <span className={`text-lg font-bold ${
                    percentage >= 80 ? 'text-green-600' : 
                    percentage >= 50 ? 'text-blue-600' : 
                    'text-gray-600'
                  }`}>
                    {percentage}%
                  </span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    percentage >= 80 ? 'bg-green-500' : 
                    percentage >= 50 ? 'bg-blue-500' : 
                    'bg-gray-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-auto">
              <span 
                className="inline-block px-2 py-1 text-xs font-medium rounded-full"
                style={{ 
                  backgroundColor: `${triviaColor}15`,
                  color: triviaColor 
                }}
              >
                Trivia
              </span>
              
              {isCompleted && percentage > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  Completado
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}