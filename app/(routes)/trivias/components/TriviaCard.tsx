'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { type TriviaIndexFields, type TriviaStatus } from '@/types/trivia';
import { getTriviaStatus } from '@/utils/trivia';
import {
  IconArrowNarrowRight,
  IconTrophyFilled,
  IconTrophyOff,
  IconBolt,
  IconStar
} from '@tabler/icons-react';
import ComicBurst from '@/components/ComicBurst';


export function TriviaCard(index: TriviaIndexFields): JSX.Element {
  const [triviaStatus, setTriviaStatus] = useState<TriviaStatus | undefined>(undefined);

  useEffect(() => {
    const status = getTriviaStatus(index.id);
    setTriviaStatus(status);
  }, [index.id]);

  const isCompleted = triviaStatus?.completed ?? false;
  const percentage = triviaStatus?.percentage ?? 0;

  return (
    <article className="relative p-6 h-full">
      {/* Background and border */}
      <div
        className={`absolute inset-0 rounded-xl ${
          isCompleted
            ? 'bg-gradient-to-br from-[#FFD93D] via-[#FFA500] to-[#FF6B6B]'
            : 'bg-white'
        } border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
      >
        {/* Comic-style pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.3)_20%)] bg-[length:10px_10px]" />
      </div>

      {/* Content container */}
      <div className="relative flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h3
              className="text-2xl font-black text-black"
              style={{ textShadow: '1px 1px 0 #fff' }}
            >
              {index.name}
            </h3>
            <div className="flex items-center gap-2">
              <IconBolt className="text-black" size={20} />
              <p className="font-bold text-black">Nivel {index.level ?? 1}</p>
            </div>
          </div>

          {/* Trophy icon with comic style */}
          <div className="relative transform transition-transform hover:scale-110">
            {isCompleted ? (
              <>
                <ComicBurst text="¡WOW!" className="-top-4 -right-4 animate-spin-slow" />
                <IconTrophyFilled size={32} className="text-black animate-pulse" />
              </>
            ) : (
              <IconTrophyOff size={32} className="text-gray-400" />
            )}
          </div>
        </div>

        {/* Score display */}
        <div className="bg-black text-white px-4 py-2 rounded-full font-black 
                      transform -rotate-2 shadow-[4px_4px_0px_0px_rgba(255,107,107,1)]">
          <p className="flex items-center gap-2">
            Mejor intento:
            <span className="text-[#FFD93D]">{percentage}%</span>
          </p>
        </div>

        {/* Action button */}
        <Link
          href={`/trivias/pregame/${index.id}`}
          className={`px-6 py-3 flex gap-2 justify-center items-center 
                     rounded-full font-black text-lg border-4 border-black
                     transform transition-all duration-300
                     hover:scale-105 hover:-rotate-2
                     ${
                       isCompleted
                         ? 'bg-[#4ADE80] text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                         : 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,107,107,1)]'
                     }`}
        >
          {isCompleted ? '¡JUGAR DE NUEVO!' : '¡JUGAR AHORA!'}
          <IconArrowNarrowRight className="animate-bounce" />
        </Link>
      </div>
    </article>
  );
}
