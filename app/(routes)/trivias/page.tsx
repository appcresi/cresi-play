import type { Metadata } from 'next'
import type { CustomResponse } from '@/types/response'
import type { Trivia, TriviaIndexFields } from '@/types/trivia'
import { API_URL } from '@/utils/helpers'
import Image from 'next/image'
import illustration from '@/public/illustration-2.jpg'
import TriviaSettings from './components/TriviaSettings'
import TriviaGrid from './components/TriviaGrid'
import { IconExternalLink } from '@tabler/icons-react'

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
    <main className='mx-auto px-4 max-w-5xl'>
      <section className='min-h-screen flex flex-col gap-4 justify-center items-center md:flex-row md:items-center lg:justify-evenly'>
        <span className='md:max-w-sm'>
          <h1 className='my-4 text-5xl font-bold text-primary md:text-6xl'>Trivias</h1>
          <h2 className='text-lg text-gray-600'>
            Estos juegos de preguntas sirven para poner a prueba el nivel de
            conocimiento sobre diversas temáticas y, además, seguir aprendiendo a
            través del análisis retroactivo de cada partida. ¡Descubrilas todas!
          </h2>

          <a
            href='https://cresi.com.ar/buscar'
            target='_blank'
            rel='noreferrer'
            className='px-4 py-2 my-4 w-fit flex items-center gap-1 font-semibold rounded-full bg-primary-light text-primary-dark'
          >
            ¿De dónde salen las preguntas?
            <IconExternalLink />
          </a>
        </span>

        <span className='w-64 h-48 relative lg:w-80 lg:h-64'>
          <Image src={illustration} alt='Ilustración de personas jugando por internet' placeholder='blur' className='contrast-125 rounded-xl' fill />
        </span>
      </section>

      <TriviaSettings />

      <TriviaGrid indexesByLevel={indexesByLevel} />
    </main>
  )
}
