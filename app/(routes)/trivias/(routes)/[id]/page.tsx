import { type CustomResponse } from '@/types/response'
import { type Trivia, type TriviaQuestion } from '@/types/trivia'
import { API_URL, sortArrayRandomly } from '@/utils/helpers'
import { generateTriviaPathFromName } from '@/utils/trivia'
import TriviaGame from '../../components/TriviaGame'

async function getTriviaById (id: string): Promise<Trivia | undefined> {
  const response = await fetch(API_URL.concat('/trivias'), { cache: 'no-store' })
  const body = await response.json() as CustomResponse<Trivia[]>

  if (body.hasError && typeof body.error !== 'undefined') {
    throw new Error(body.error)
  }

  if (typeof body.data === 'undefined') {
    throw new Error('No data found')
  }

  return body.data.find(trivia => generateTriviaPathFromName(trivia.name, trivia.level ?? 1) === id)
}

export async function generateStaticParams (): Promise<Array<{ params: { id: string } }>> {
  const response = await fetch(API_URL.concat('/trivias'))
  const body = await response.json() as CustomResponse<Trivia[]>

  if (body.hasError && typeof body.error !== 'undefined') {
    throw new Error(body.error)
  }

  if (typeof body.data === 'undefined') {
    throw new Error('No data found')
  }

  return body.data.map(trivia => ({
    params: { id: generateTriviaPathFromName(trivia.name, trivia.level ?? 1) }
  }))
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
