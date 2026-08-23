'use client';

import React, { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { type TriviaIndexFields } from '@/types/trivia';
import { TriviaCard } from './TriviaCard';
import classNames from 'classnames';

interface TriviaGridProps {
  indexesByLevel: Record<number, TriviaIndexFields[]>;
}

// Colores por nivel de dificultad — son semánticos (distinguen Básico de
// Intermedio de Avanzado), no de marca, así que se mantienen distintos
// entre sí en vez de unificarlos a un solo color.
const LEVEL_COLORS: Record<number, string> = {
  1: '#2563EB',
  2: '#4F46E5',
  3: '#9333EA',
};

export default function TriviaGrid({
  indexesByLevel,
}: TriviaGridProps): JSX.Element {
  return (
    <section>
      <Tab.Group>
        <Tab.List className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          {Object.keys(indexesByLevel).map((level) => {
            const numericLevel = Number(level);
            const color = LEVEL_COLORS[numericLevel] ?? '#2563EB';
            return (
              <Tab as={Fragment} key={numericLevel}>
                {({ selected }) => (
                  <button
                    type="button"
                    className={classNames(
                      'px-4 py-2 rounded-full font-semibold text-sm transition-all duration-200',
                      {
                        'text-white shadow-sm': selected,
                        'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600': !selected,
                      }
                    )}
                    style={selected ? { backgroundColor: color } : undefined}
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