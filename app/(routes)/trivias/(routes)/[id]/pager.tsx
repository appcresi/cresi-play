'use client'

import type { Trivia, TriviaQuestion } from '@/types/trivia'
import { sortArrayRandomly } from '@/utils/helpers'
import TriviaGame from '../../components/TriviaGame'
import { useEffect, useState } from 'react'

export default function TriviaPage ({
  params
}: { params: { id: string } }): JSX.Element {
  const [trivia, setTrivia] = useState<Trivia>()

  useEffect(() => {
    fetch(`/api/trivias/${params.id}`)
      .then(async (response) => {
        const { data } = await response.json() as { data: Trivia }
        setTrivia(data)
      })
      .catch((error) => console.error(error))
  }, [])

  if (typeof trivia === 'undefined') {
    return <p>Cargando trivia...</p>
  }

  const questions = sortArrayRandomly<TriviaQuestion>(trivia.questions)

  return (
    <TriviaGame
      id={trivia.id}
      name={trivia.name}
      questions={questions}
    />
  )
}
