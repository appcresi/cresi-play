import type { Metadata } from 'next'
import type { CustomResponse } from '@/types/response'
import type { Trivia, TriviaQuestion } from '@/types/trivia'
import { sortArrayRandomly, API_URL } from '@/utils/helpers'
import TriviaGame from '../../components/TriviaGame'

/** Return the trivia corresponding to the ID, from the back-end. */
async function getTriviaById (id: string): Promise<Trivia> {
  const response = await fetch(API_URL.concat(`/trivias/${id}`), {
    next: { revalidate: 3600 }
  })

  const body = (await response.json()) as CustomResponse<Trivia>

  if (typeof body.data === 'undefined' || body.hasError) {
    throw new Error(body.error ?? body.message)
  }

  return body.data
}

export async function generateMetadata ({
  params
}: { params: { id: string } }): Promise<Metadata> {
  const triviaData = await getTriviaById(params.id)

  return {
    title: `Aprendé sobre "${triviaData.name}" con nuestra trivia | CrESI`,
    description: `Jugá a la trivia de "${triviaData.name}" y aprendé sobre el tema con una trivia interactiva y dinámica de preguntas y respuestas.`
  }
}

export default async function TriviaPage ({
  params
}: { params: { id: string } }): Promise<JSX.Element> {
  const triviaData = await getTriviaById(params.id)
  const questions = sortArrayRandomly<TriviaQuestion>(triviaData.questions)

  return (
    <TriviaGame
      id={triviaData.id}
      name={triviaData.name}
      questions={questions}
    />
  )
}
