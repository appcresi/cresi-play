'use client';

import { useState, type FormEvent } from 'react';
import { TriviaCard } from './TriviaCard';
import { type TriviaIndexFields } from '@/types/trivia';
import { IconSearch, IconX } from '@tabler/icons-react';

export default function TriviaSearch({ indexes }: { indexes: TriviaIndexFields[] }): JSX.Element {
  const [query, setQuery] = useState<string>('');
  const [shownIndexes, setShownIndexes] = useState<TriviaIndexFields[]>([]);

  const handleSearch = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    if (query.trim() !== '') {
      const filteredIndexes = indexes.filter((index) =>
        index.name.toLowerCase().includes(query.toLowerCase())
      );
      setShownIndexes(filteredIndexes);
    } else {
      setShownIndexes([]);
    }
  };

  const clearSearch = (): void => {
    setQuery('');
    setShownIndexes([]);
  };

  return (
    <section>
      {/* Formulario de búsqueda */}
      <form
        onSubmit={handleSearch}
        className="flex gap-3 items-center"
      >
        <div className="relative flex-1">
          <IconSearch 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
            size={20} 
          />
          <input
            type="text"
            placeholder="Buscar trivias..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      text-gray-700 placeholder-gray-400 transition-all duration-200"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 
                        text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <IconX size={20} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold
                    rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
        >
          Buscar
        </button>
      </form>

      {/* Resultados de búsqueda */}
      {query.trim() !== '' && (
        <div className="mt-6">
          {/* Header de resultados */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">
              Resultados de búsqueda
            </h3>
            <p className="text-sm text-gray-600 mt-1">
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <IconSearch size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">
                No se encontraron trivias que coincidan con "{query}"
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}