'use client'

import { type TriviaIndexFields } from '@/types/trivia'
import { useMemo, useState } from 'react'
import { TriviaCard } from './TriviaCard'

export default function TriviaSearch ({ indexes }: { indexes: TriviaIndexFields[] }): JSX.Element {
  const [query, setQuery] = useState<string>()

  const shownIndexes = useMemo(() => {
    if (typeof query === 'undefined' || query.length === 0) return []

    return indexes.filter((index) => index.name.toLowerCase().includes(query.toLowerCase()))
  }, [query])

  return (
    <section className="my-8 flex flex-col items-center">
      <h3 className="text-center text-2xl font-bold">Buscar trivias por nombre</h3>
      <input
        type="text"
        placeholder="Buscar..."
        onChange={(event) => { setQuery(event.target.value) }}
        className="my-4 px-4 py-2 rounded-full border border-gray-600 focus:outline-none focus:border-primary"
      />

      <ul className="w-full flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
        {shownIndexes.map((index) => (
          <li key={index.id}>
            <TriviaCard {...index} />
          </li>
        ))}
      </ul>

    </section>
  )
}
