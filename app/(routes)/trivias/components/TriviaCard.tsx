'use client'

import { type TriviaIndexFields, type TriviaStatus } from '@/types/trivia'
import { getTriviaStatus } from '@/utils/trivia'
import {
  IconArrowNarrowRight,
  IconTrophyFilled,
  IconTrophyOff
} from '@tabler/icons-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export function TriviaCard (index: TriviaIndexFields): JSX.Element {
  const [triviaStatus, setTriviaStatus] = useState<TriviaStatus>()

  useEffect(() => {
    setTriviaStatus(
      getTriviaStatus(index.id)
    )
  }, [])

  const isCompleted = triviaStatus?.completed ?? false

  return (
    <article className={`w-full p-4 gap-4 flex flex-col rounded-lg ${isCompleted ? 'bg-gradient-to-r from-amber-400 to-orange-300' : 'border-2 border-primary'}`}>
      <div className='flex items-center justify-between'>
        <span className='flex flex-col gap-2'>
          <h3 className='text-xl font-semibold'>{index.name}</h3>
          <p className='text-gray-600'>Nivel: {index.level ?? 1}</p>
        </span>

        {isCompleted
          ? (
            <IconTrophyFilled />
            )
          : (
            <IconTrophyOff className='text-gray-400' />
            )
        }
      </div>

      <p>
        Mejor intento: <b>{triviaStatus?.percentage ?? 0}%</b>
      </p>

      <Link
        href={`/trivias/${index.id}`}
        className='px-4 py-2 flex gap-2 justify-center items-center rounded-full font-bold bg-primary text-primary-light'
      >
        Jugar
        <IconArrowNarrowRight />
      </Link>
    </article>
  )
}
