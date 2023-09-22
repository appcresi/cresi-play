'use client'

import { type TriviaIndexFields } from '@/types/trivia'
import { TriviaCard } from './TriviaCard'
import { Tab } from '@headlessui/react'
import { Fragment } from 'react'

interface TriviaGridProps {
  indexesByLevel: Record<number, TriviaIndexFields[]>
}

export default function TriviaGrid ({ indexesByLevel }: TriviaGridProps): JSX.Element {
  return (
    <section className='my-4'>
      <Tab.Group>
        <Tab.List className='my-4 flex gap-4 justify-center items-center'>
          {Object.keys(indexesByLevel).map((level) => (
            <Tab as={Fragment} key={level}>
              {({ selected }) => (
                <button type='button' className={`px-4 py-2 rounded-lg ${selected ? 'bg-primary text-white' : 'bg-primary-light text-primary-dark'}`}>
                  Nivel {level}
                </button>
              )}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          {Object.keys(indexesByLevel).map((level) => (
            <Tab.Panel key={level}>
              <ul className='flex flex-col gap-4 md:grid md:grid-cols-2 lg:grid-cols-3'>
                {indexesByLevel[Number(level)].map((value) => (
                  <li key={value.id}>
                    <TriviaCard {...value} />
                  </li>
                ))}
              </ul>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </section>
  )
}
