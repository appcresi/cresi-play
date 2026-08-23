'use client';

import { useState } from 'react';
import { TriviaCard } from './TriviaCard';
import { type TriviaIndexFields } from '@/types/trivia';
import { IconSearch, IconX } from '@tabler/icons-react';
import { getActivityById } from '@/lib/activities';

const ACCENT = getActivityById('trivias')?.color ?? '#1976D2';

export default function TriviaSearch({ indexes }: { indexes: TriviaIndexFields[] }): JSX.Element {
  const [query, setQuery] = useState<string>('');

  const trimmedQuery = query.trim();
  const shownIndexes = trimmedQuery !== ''
    ? indexes.filter((index) => index.name.toLowerCase().includes(trimmedQuery.toLowerCase()))
    : [];

  const clearSearch = (): void => {
    setQuery('');
  };

  return (
    <section>
      {/* Búsqueda en vivo — no hace falta enviar el formulario */}
      <div className="relative">
        <IconSearch
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
          size={20}
        />
        <input
          type="text"
          placeholder="Buscar trivias..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-xl
                    focus:outline-none focus:ring-2 focus:border-transparent
                    text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
          style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2
                      text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <IconX size={20} />
          </button>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {trimmedQuery !== '' && (
        <div className="mt-6">
          {/* Header de resultados */}
          <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Resultados de búsqueda
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {shownIndexes.length > 0
                ? `Se encontraron ${shownIndexes.length} trivia${shownIndexes.length !== 1 ? 's' : ''}`
                : 'No se encontraron resultados'}
            </p>
          </div>

          {/* Grid de resultados */}
          {shownIndexes.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shownIndexes.map((index) => (
                <li key={index.id}>
                  <TriviaCard {...index} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <IconSearch size={32} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                No se encontraron trivias que coincidan con "{query}"
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}