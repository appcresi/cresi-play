'use client';

import React, { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { type TriviaIndexFields } from '@/types/trivia';
import { TriviaCard } from './TriviaCard';
import classNames from 'classnames';

interface ComicBurstProps {
  text: string;
  className: string;
}

const ComicBurst: React.FC<ComicBurstProps> = ({ text, className }) => (
  <div className={`absolute transform ${className}`}>
    <svg viewBox="0 0 100 100" className="w-16 h-16">
      <path
        d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z"
        fill="#FF6B6B"
        stroke="black"
        strokeWidth="3"
      />
      <text
        x="50"
        y="55"
        textAnchor="middle"
        className="font-bold text-white text-xs"
      >
        {text}
      </text>
    </svg>
  </div>
);

interface TriviaGridProps {
  indexesByLevel: Record<number, TriviaIndexFields[]>;
}

export default function TriviaGrid({
  indexesByLevel,
}: TriviaGridProps): JSX.Element {
  const levelColors: Record<number, string> = {
    1: '#4ADE80',
    2: '#FFD93D',
    3: '#FF6B6B',
  };

  const levelBursts: Record<number, string> = {
    1: '¡NIVEL 1!',
    2: '¡NIVEL 2!',
    3: '¡NIVEL 3!',
  };

  return (
    <section className="my-8 relative">
      <Tab.Group>
        <Tab.List className="relative flex flex-wrap gap-4 justify-center items-center mb-8">
          {Object.keys(indexesByLevel).map((level) => {
            const numericLevel = Number(level);
            return (
              <Tab as={Fragment} key={numericLevel}>
                {({ selected }) => (
                  <button
                    type="button"
                    className={classNames(
                      'relative px-6 py-3 rounded-full font-black text-lg border-4 border-black transform transition-all duration-300 hover:scale-105 hover:-rotate-3',
                      {
                        [`bg-black text-white shadow-[6px_6px_0px_0px_${levelColors[numericLevel]}]`]:
                          selected,
                        'bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100':
                          !selected,
                      }
                    )}
                  >
                    {selected && (
                      <ComicBurst
                        text={levelBursts[numericLevel]}
                        className="absolute -top-4 -right-4 animate-pulse"
                      />
                    )}
                    NIVEL {numericLevel}
                  </button>
                )}
              </Tab>
            );
          })}
        </Tab.List>

        <Tab.Panels>
          {Object.keys(indexesByLevel).map((level) => {
            const numericLevel = Number(level);
            return (
              <Tab.Panel
                key={numericLevel}
                className="relative transform transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{
                  borderColor: levelColors[numericLevel],
                }}
              >
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {indexesByLevel[numericLevel].map((value, index) => (
                    <li
                      key={value.id}
                      className="transform transition-all duration-300 hover:scale-102"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.5s ease-out forwards',
                      }}
                    >
                      <div className="relative bg-white border-4 border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 transform hover:rotate-1">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent rounded-lg" />
                        <TriviaCard {...value} />
                      </div>
                    </li>
                  ))}
                </ul>
              </Tab.Panel>
            );
          })}
        </Tab.Panels>
      </Tab.Group>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}
