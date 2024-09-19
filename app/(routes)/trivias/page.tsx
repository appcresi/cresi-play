import type { Metadata } from 'next';
import type { CustomResponse } from '@/types/response';
import type { Trivia, TriviaIndexFields } from '@/types/trivia';
import { API_URL } from '@/utils/helpers';
import Image from 'next/image';
import illustration from '@/public/illustration-2.jpg';
import TriviaSettings from './components/TriviaSettings';
import TriviaGrid from './components/TriviaGrid';
import { IconExternalLink } from '@tabler/icons-react';
import TriviaSearch from './components/TriviaSearch';

/** Return only necessary fields for trivia indexing */
function getOnlyIndexFields(trivia: Trivia): TriviaIndexFields {
  const { id, name, level } = trivia;
  return { id, name, level };
}

/** Organize trivia indexes by their levels */
function organizeIndexesByLevel(
  indexFields: TriviaIndexFields[]
): Record<number, TriviaIndexFields[]> {
  const availableLevels = new Set(indexFields.map((index) => index.level));
  return Object.fromEntries(
    Array.from(availableLevels).map((level) => [
      level,
      indexFields.filter((index) => index.level === level),
    ])
  );
}

/** Fetch trivia indexes from the API */
async function getTriviaIndexes(): Promise<TriviaIndexFields[]> {
  const response = await fetch(`${API_URL}/trivias?author=CRESI`, {
    next: { revalidate: 3600 },
  });
  const body = (await response.json()) as CustomResponse<Trivia[]>;
  if (!body.data || body.hasError) {
    throw new Error(body.error ?? body.message);
  }
  return body.data.map(getOnlyIndexFields);
}

export const metadata: Metadata = {
  title: 'Trivias | CrESI',
  description:
    'Poné a prueba tus conocimientos con nuestras trivias y aprendé mientras jugás.',
};

export default async function Trivias(): Promise<JSX.Element> {
  const indexes = await getTriviaIndexes();
  const indexesByLevel = organizeIndexesByLevel(indexes);

  return (
    <main className='mx-auto px-4 max-w-5xl'>
      <section className='flex flex-col gap-4 justify-center items-center md:flex-row md:items-center lg:justify-evenly py-8'>
        <span className='md:max-w-sm'>
          <h1 className='my-4 text-4xl font-bold text-primary md:text-5xl'>
            Trivias
          </h1>
          <h2 className='text-lg text-gray-600'>
            ¡Es hora de jugar! Aquí encontrarás una variedad de trivias
            clasificadas por niveles. Usa el buscador para encontrar fácilmente
            la trivia que te interese. Además, puedes ajustar el tiempo de juego
            haciendo clic en el botón de configuración.
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
          <Image
            src={illustration}
            alt='Ilustración de personas jugando por internet'
            placeholder='blur'
            className='contrast-125 rounded-xl'
            fill
          />
        </span>
      </section>

      <TriviaSearch indexes={indexes} />

      <TriviaGrid indexesByLevel={indexesByLevel} />

      <div className='fixed bottom-6 right-6'>
        <TriviaSettings />
      </div>
    </main>
  );
}
