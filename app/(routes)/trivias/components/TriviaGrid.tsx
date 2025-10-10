'use client';

import React, { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { type TriviaIndexFields } from '@/types/trivia';
import { TriviaCard } from './TriviaCard';
import classNames from 'classnames';

interface TriviaGridProps {
  indexesByLevel: Record<number, TriviaIndexFields[]>;
}

export default function TriviaGrid({
  indexesByLevel,
}: TriviaGridProps): JSX.Element {
  const levelColors: Record<number, string> = {
    1: 'blue',
    2: 'indigo',
    3: 'purple',
  };

  const levelLabels: Record<number, string> = {
    1: 'Básico',
    2: 'Intermedio',
    3: 'Avanzado',
  };

  return (
    <section>
      <Tab.Group>
        <Tab.List className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4">
          {Object.keys(indexesByLevel).map((level) => {
            const numericLevel = Number(level);
            const color = levelColors[numericLevel];
            return (
              <Tab as={Fragment} key={numericLevel}>
                {({ selected }) => (
                  <button
                    type="button"
                    className={classNames(
                      'px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200',
                      {
                        [`bg-${color}-600 text-white shadow-sm`]: selected,
                        'bg-gray-100 text-gray-700 hover:bg-gray-200': !selected,
                      }
                    )}
                    style={
                      selected
                        ? {
                            backgroundColor:
                              color === 'blue'
                                ? '#2563eb'
                                : color === 'indigo'
                                ? '#4f46e5'
                                : '#9333ea',
                          }
                        : undefined
                    }
                  >
                    <span className="hidden sm:inline">Nivel {numericLevel}</span>
                    <span className="sm:hidden">{numericLevel}</span>
                    <span className="ml-2 text-xs opacity-90">
                      ({indexesByLevel[numericLevel].length})
                    </span>
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
                className="focus:outline-none"
              >
                {/* Level description */}
                <div className="mb-6 bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {levelLabels[numericLevel]}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {numericLevel === 1 && 'Perfectas para comenzar tu aprendizaje'}
                    {numericLevel === 2 && 'Desafía tus conocimientos'}
                    {numericLevel === 3 && 'Para expertos en el tema'}
                  </p>
                </div>

                {/* Grid of cards */}
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {indexesByLevel[numericLevel].map((value, index) => (
                    <li
                      key={value.id}
                      className="opacity-0 animate-fadeInUp"
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationFillMode: 'forwards',
                      }}
                    >
                      <TriviaCard {...value} />
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
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.4s ease-out;
        }
      `}</style>
    </section>
  );
}