import { Trivia, TriviaIndexFields } from '@/types/trivia'
import { API_URL } from '@/utils/server'
import { Metadata } from 'next'
import Image from 'next/image'
import illustration from '@/public/illustration-2.jpg'
import TriviaSettings from './components/TriviaSettings'
import TriviaGrid from './components/TriviaGrid'

/* We choose to omit irrelevant fields (and their long content) to optimize algorithms. */

/** Return to client only indexing required values from a trivia. */
function getOnlyIndexFields (trivia: Trivia): TriviaIndexFields {
  const { id, name, level } = trivia

  return { id, name, level }
}

/** Return an object for every available level of trivias, with their corresponding set of trivias. */
function organizeIndexesByLevel (
  indexFields: TriviaIndexFields[]
): Record<number, TriviaIndexFields[]> {
  const availableLevels = new Set(indexFields.map((index) => index.level))

  return Object.fromEntries(
    Array.from(availableLevels).map((level) => [
      level,
      indexFields.filter((index) => index.level === level)
    ])
  )
}

/* Return available trivia indexes from the back-end. */
async function getTriviaIndexes (): Promise<TriviaIndexFields[]> {
  const response = await fetch(API_URL.concat('/trivias?author=CRESI'), {
    next: { revalidate: 3600 }
  })
  const body = (await response.json()) as CustomResponse<Trivia[]>

  if (typeof body.data === 'undefined' || body.hasError) {
    throw new Error(body.error ?? body.message)
  }

  const indexFields = body.data.map(getOnlyIndexFields)

  return indexFields
}

export const metadata: Metadata = {
  title: 'Trivias | CrESI',
  description: 'Aprendé contestando preguntas sobre diversas temáticas y certificate.'
}

export default async function Trivias (): Promise<JSX.Element> {
  const indexes = await getTriviaIndexes()
  const indexesByLevel = organizeIndexesByLevel(indexes)

  return (
    <main className='mx-4'>
      <section className='min-h-screen flex flex-col gap-4 justify-center'>
        <span>
          <h1 className='my-4 text-5xl font-bold text-primary'>Trivias</h1>
          <h2 className='text-lg text-gray-600'>
            Estos juegos de preguntas sirven para poner a prueba el nivel de
            conocimiento sobre diversas temáticas y, además, seguir aprendiendo a
            través del análisis retroactivo de cada partida. ¡Descubrilas todas!
          </h2>
        </span>

        <Image src={illustration} alt='Ilustración de personas jugando por internet' placeholder='blur' className='contrast-125 rounded-xl' width={400} />
      </section>

      <TriviaSettings />

      <TriviaGrid indexesByLevel={indexesByLevel} />
    </main>
  )
}
