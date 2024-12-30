'use client';

import { useState, type FormEvent } from 'react';
import { TriviaCard } from './TriviaCard';
import { type TriviaIndexFields } from '@/types/trivia';

export default function TriviaSearch({ indexes }: { indexes: TriviaIndexFields[] }): JSX.Element {
  const [query, setQuery] = useState<string>(''); // Texto de búsqueda
  const [shownIndexes, setShownIndexes] = useState<TriviaIndexFields[]>([]); // Inicializar vacío

  // Función para manejar la búsqueda
  const handleSearch = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault(); // Evitar la recarga de la página

    // Solo realizar la búsqueda si el query no está vacío
    if (query.trim() !== '') {
      const filteredIndexes = indexes.filter((index) =>
        index.name.toLowerCase().includes(query.toLowerCase())
      );
      setShownIndexes(filteredIndexes); // Actualizar los resultados visibles
    } else {
      setShownIndexes([]); // No mostrar nada si el query está vacío
    }
  };

  return (
    <section className="my-4 flex flex-col items-center">
      {/* Formulario para la búsqueda */}
      <form
        onSubmit={handleSearch}
        className="flex gap-4 justify-center items-center w-full pb-4"
      >
        <input
          type="text"
          placeholder="Buscar..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="p-3 border-4 border-black rounded-lg w-full text-black font-bold
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
        />
        <button
          type="submit"
          className="px-6 py-3 bg-black text-white font-bold border-4 border-black
                    rounded-full shadow-[4px_4px_0px_0px_rgba(255,107,107,1)]
                    transform transition-all duration-300 hover:scale-105 hover:-rotate-2"
        >
          Buscar
        </button>
      </form>

      {/* Mostrar resultados si hay búsqueda */}
      {query.trim() !== '' && (
        <ul className="w-full flex flex-col gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
          {shownIndexes.map((index) => (
            <li key={index.id}>
              <TriviaCard {...index} />
            </li>
          ))}
        </ul>
      )}

      {/* Mostrar un mensaje si no hay resultados */}
      {query.trim() !== '' && shownIndexes.length === 0 && (
        <p className="text-lg font-bold text-red-500 mt-4">No se encontraron resultados.</p>
      )}
    </section>
  );
}
