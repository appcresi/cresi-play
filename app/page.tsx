import { Metadata } from 'next'

import Image from 'next/image'
import Link from 'next/link'

import {
  IconArrowNarrowRight,
  IconBrain,
  IconBulb,
  IconCheck,
  IconExternalLink,
  IconSchool,
  IconTrendingUp
} from '@tabler/icons-react'

import cresiLogo from '@/public/cresi-logo.webp'
import illustration from '@/public/illustration-1.jpg'

export const metadata = {
  title: 'Aprendé jugando y poné a prueba tus conocimientos',
  description: 'Conocé la nueva forma de aprender y educar sobre diversas temáticas sociales, como la educación sexual, la violencia y la salud.'
} satisfies Metadata

export default function Home (): JSX.Element {
  return (
    <main className='mx-auto max-w-5xl flex flex-col items-center gap-8'>
      <section className='min-h-screen flex flex-col items-center justify-center lg:w-full lg:flex-row lg:justify-evenly'>
        <span className='p-4 flex flex-col items-center gap-8 text-center'>
          <div className='flex gap-2 items-center'>
            <p className='text-gray-600'>Un proyecto de</p>
            <Image src={cresiLogo} alt='Logotipo de CrESI' width={64} />
          </div>

          <h1 className='text-6xl font-bold text-primary'>Aprendé jugando</h1>
          <h2 className='text-xl text-gray-600 lg:max-w-[48ch]'>
            A través de juegos de trivia, vas a poder ampliar tus conocimientos
            en diversas temáticas de una forma interactiva y divertida.
          </h2>

          <Link
            href='/trivias'
            className='px-4 py-2 flex gap-2 justify-center items-center rounded-full font-bold bg-primary text-primary-light'
          >
            Comenzá a jugar
            <IconArrowNarrowRight />
          </Link>

          <a
            href='https://cresi.com.ar'
            target='_blank'
            rel='noreferrer'
            className='flex items-center gap-1 underline text-primary-dark'
          >
            ¿Quiénes somos?
            <IconExternalLink />
          </a>
        </span>

        <Image
          src={illustration}
          alt='Ilustración de personas aprendiendo juntas'
          width={400}
          priority
        />
      </section>

      <section>
        <SectionChip>
          Una nueva experiencia
          <IconSchool />
        </SectionChip>

        <h3 className='my-4 text-3xl font-bold lg:my-8 lg:text-5xl'>
          Educar distinto, aprender mejor.
        </h3>
        <p className='text-gray-600 lg:text-xl'>
          Creemos que los textos interminables y de poca utilidad real no tienen
          que ser la única forma de enseñar y aprender, por lo que desarrollamos
          experiencias educativas con enfoque en la interactividad y la
          re-jugabilidad, para que el aprendizaje sea una experiencia divertida
          para todos.
        </p>

        <ul className='my-4 flex flex-col gap-6 lg:grid lg:grid-cols-2'>
          <li>
            <span className='my-4 flex gap-2 items-center text-primary lg:text-xl'>
              <IconBrain />
              Poné a prueba tu conocimiento
            </span>

            <p className='lg:text-lg'>
              Con nuestros juegos vas a poder darte cuenta de lo mucho (¡o lo
              poco!) que sabías sobre muchas temáticas.
            </p>
          </li>

          <li>
            <span className='my-4 flex gap-2 items-center text-primary lg:text-xl'>
              <IconCheck />
              <p>Aprendé de tus errores, al detalle</p>
            </span>

            <p className='lg:text-lg'>
              Con cada partida que jueges, vas a poder acceder a estadísticas
              detalladas y más información sobre cada pregunta.
            </p>
          </li>

          <li>
            <span className='my-4 flex gap-2 items-center text-primary lg:text-xl'>
              <IconTrendingUp />
              <p>Compartí tu progreso</p>
            </span>

            <p className='lg:text-lg'>
              Cuando completás una trivia, podés acceder a un certificado para
              compartir con tus contactos en redes sociales o en donde lo
              necesites.
            </p>
          </li>

          <li>
            <span className='my-4 flex gap-2 items-center text-primary lg:text-xl'>
              <IconBulb />
              <p>Involucrate con tu aprendizaje</p>
            </span>

            <p className='lg:text-lg'>
              Proveemos gratuitamente diversos recursos y juegos didácticos para
              seguir aprendiendo. ¿Querés conocerlos? Visitá nuestra{' '}
              <a
                href='https://cresi.com.ar'
                target='_blank'
                rel='noreferrer'
                className='w-fit underline text-primary-dark'
              >
                página principal.
              </a>
            </p>
          </li>
        </ul>
      </section>

      <section className='flex flex-col items-center'>
        <h3 className='my-4 text-3xl font-bold lg:my-8 lg:text-5xl'>
          ¿Todo listo?
        </h3>
        <p className='text-center text-gray-700 lg:text-xl'>
          Conocé la nueva experiencia educativa que tenemos para vos.
        </p>

        <Link
          href='/trivias'
          className='my-6 px-4 py-2 flex gap-2 justify-center items-center rounded-full font-bold bg-primary text-primary-light'
        >
          Comenzá a jugar
          <IconArrowNarrowRight />
        </Link>
      </section>
    </main>
  )
}

function SectionChip ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <div className='my-6 px-4 py-2 w-fit flex gap-2 items-center justify-center rounded-full bg-primary-light text-primary-dark lg:text-lg'>
      {children}
    </div>
  )
}
