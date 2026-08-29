'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { type TriviaIndexFields, type TriviaStatus } from '@/types/trivia';
import { getTriviaStatus } from '@/utils/trivia';
import { colorForTrivia } from '@/lib/triviaColors';
import {
  IconTrophyFilled,
  IconTrophyOff,
  IconBolt,
  IconStar,
  IconCircle,
  IconChevronRight,
  IconShieldCheck
} from '@tabler/icons-react';

export function TriviaCard(index: TriviaIndexFields): JSX.Element {
  const [triviaStatus, setTriviaStatus] = useState<TriviaStatus | undefined>(undefined);

  useEffect(() => {
    const status = getTriviaStatus(index.id);
    setTriviaStatus(status);
  }, [index.id]);

  const isCompleted = triviaStatus?.completed ?? false;
  const percentage = triviaStatus?.percentage ?? 0;
  const triviaColor = colorForTrivia(index.id);

  return (
    <article className="relative h-full">
      <Link href={`/trivias/pregame/${index.id}`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer group h-full flex flex-col">

          {/* Header Banner */}
          <div className="relative">
            <div
              className="h-24 rounded-t-xl flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: `${triviaColor}15` }}
            >
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

            {isCompleted && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <IconCircle size={14} className="text-white" />
                </div>
              </div>
            )}

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
              <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                {index.name}
              </h3>
              <IconChevronRight size={16} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors shrink-0" />
            </div>

            {index.endorsedBy && (
              <div className="flex items-center gap-1 mb-2 text-[11px] text-emerald-700 dark:text-emerald-400">
                <IconShieldCheck size={13} className="shrink-0" />
                <span className="truncate">Avalada por {index.endorsedBy}</span>
              </div>
            )}

            {/* Score Display */}
            <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-3 border border-gray-100 dark:border-gray-700 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Mejor intento</span>
                <div className="flex items-center gap-1">
                  <IconStar size={16} className={percentage > 0 ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'} />
                  <span className={`text-lg font-bold ${
                    percentage >= 80 ? 'text-green-600' :
                    percentage >= 50 ? 'text-blue-600' :
                    'text-gray-600 dark:text-gray-300'
                  }`}>
                    {percentage}%
                  </span>
                </div>
              </div>

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