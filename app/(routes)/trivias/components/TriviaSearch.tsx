'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { TriviaCard } from './TriviaCard';
import { type TriviaIndexFields } from '@/types/trivia';

export default function TriviaSearch({ indexes }: { indexes: TriviaIndexFields[] }): JSX.Element {
  const [query, setQuery] = useState<string>('');
  const [shownIndexes, setShownIndexes] = useState<TriviaIndexFields[]>([]);

  // Función para manejar la búsqueda al presionar el botón
  const handleSearch = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const filteredIndexes = indexes.filter((index) =>
      index.name.toLowerCase().includes(query.toLowerCase())
    );
    setShownIndexes(filteredIndexes);
  };

  return (
    <section className="my-8 flex flex-col items-center">
      {/* Formulario para la búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-4 justify-center items-center w-full pb-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className='p-2 border border-gray-300 rounded-lg w-full'
        />
        <button
          type="submit"
          className='px-4 py-2 bg-primary text-white rounded-lg'
        >
          Buscar
        </button>
      </form>



      <ul className="w-full flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        {shownIndexes.map((index) => (
          <li key={index.id}>
            <TriviaCard {...index} />
          </li>
        ))}
      </ul>
    </section>
  );
}
