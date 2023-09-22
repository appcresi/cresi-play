import { type Metadata } from 'next'
import { type CustomResponse } from '@/types/response'
import { type Trivia, type TriviaQuestion } from '@/types/trivia'
import { API_URL, sortArrayRandomly } from '@/utils/helpers'
import TriviaGame from '../../components/TriviaGame'

async function getTriviaById (id: string): Promise<Trivia> {
  const response = await fetch(API_URL.concat(`/trivias/${id}`), { cache: 'no-store' })
  const body = await response.json() as CustomResponse<Trivia>

  if (body.hasError && typeof body.error !== 'undefined') {
    throw new Error(body.error)
  }

  if (typeof body.data === 'undefined') {
    throw new Error('No data found')
  }

  return body.data
}

export async function generateMetadata ({ params }: { params: { id: string } }): Promise<Metadata> {
  const trivia = await getTriviaById(params.id)

  if (typeof trivia === 'undefined') {
    return {
      title: 'No se encontró la trivia | CrESI',
      description: 'No se encontró la trivia que estás buscando. ¡Probá con otra!'
    }
  }

  return {
    title: `Aprendé sobre ${trivia.name} jugando a nuestra trivia | CrESI`,
    description: `A través de esta trivia vas a poder aprender sobre ${trivia.name} de una manera divertida y entretenida. ¡Jugá ahora!`
  }
}

interface TriviaGameProps {
  id: string
  name: string
  items: Array<{ question: TriviaQuestion, options: string[] }>
}

export default async function TriviaPage ({ params }: { params: { id: string } }): Promise<JSX.Element> {
  const trivia = await getTriviaById(params.id)

  if (typeof trivia === 'undefined') {
    return <p>No se encontró la trivia.</p>
  }

  // This will sort the trivia's questions and their options BEFORE sending them to the client
  const gameData: TriviaGameProps = {
    id: trivia.id,
    name: trivia.name,
    items: Array.from(
      trivia.questions.map(question => {
        return {
          question,
          options: sortArrayRandomly<string>(Object.values(question.options).concat(question.answer))
        }
      })
    )
  }

  return (
    <TriviaGame {...gameData} />
  )
}
