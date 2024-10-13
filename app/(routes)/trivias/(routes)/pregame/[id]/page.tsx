//test de deploy de prueba ignorar linea
import { API_URL } from '@/utils/helpers';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons-react';
import TriviaSettings from '../../../components/TriviaSettings';
import { type CustomResponse } from '@/types/response';
import { Trivia } from '@/types/trivia';
import type { Metadata } from 'next';

// Función para obtener los workshops desde la API
async function getWorkshops(id: string): Promise<Trivia> {
  try {
    const response = await fetch(`${API_URL}/trivias/${id}`, {
      cache: 'no-store', // Evita el caché del lado del cliente
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const body = (await response.json()) as CustomResponse<Trivia>;

    console.log(body);

    // Verifica si hay algún error en el cuerpo de la respuesta
    if (body.hasError || !body.data) {
      throw new Error(
        `API Error: ${body.message || 'No se encontraron datos.'}`
      );
    }

    return body.data;
  } catch (error) {
    console.error('Error fetching trivia:', error);
    throw new Error('Failed to fetch trivia. Please try again later.');
  }
}

export const metadata: Metadata = {
  title: 'Presentación trivias | CrESI',
  description:
    'Poné a prueba tus conocimientos con nuestras trivias y aprendé mientras jugás.',
};
// Componente de servidor para mostrar los datos
export default async function Page({ params }: { params: { id: string } }) {
  const data = await getWorkshops(params.id);

  return (
    <div className='flex flex-col min-h-screen justify-start items-center'>
      <Link href='/trivias' className='fixed top-8 left-8'>
        <IconArrowNarrowLeft className='ml-4' size={40} />
      </Link>
      <h2 className='font-bold text-5xl my-8'>Trivia</h2>

      <div className='flex flex-col md:flex-row justify-evenly items-center w-full'>
        <div className='flex flex-col text-2xl '>
          <p>
            <strong>Nombre: </strong>
            {data.name}
          </p>
          <p>
            <strong>Autor: </strong>
            {data.author}
          </p>
          <p>
            <strong>Nivel: </strong>
            {data.level}
          </p>
          <p>
            <strong>Preguntas: </strong>
            {data.questions.length}
          </p>
          <p>
            <strong>Creado el: </strong>
            {new Date(data.created_at).toLocaleDateString('es-AR', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
            })}
          </p>
        </div>
        <div className=' flex flex-col gap-y-4 justify-center items-center rounded-3xl bg-violet-500 p-1'>
          <div className='flex flex-col gap-y-4 justify-center items-center rounded-3xl bg-violet-500 p-4'>
            <h4 className='text-2xl text-white font-bold text center'>
              Compartir
            </h4>
            <QRCode
              size={200}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              value={'https://jugar.cresi.com.ar/trivias/pregame/' + data.id}
              viewBox={`0 0 256 256`}
            />
          </div>
        </div>
      </div>
      <Link
        href={'/trivias/' + data.id}
        className='px-12 mt-4 font-semibold flex justify-center items-center p-2 bg-violet-600 text-2xl rounded-3xl text-white hover:bg-violet-400'
      >
        Jugar
        <IconArrowNarrowRight />
      </Link>
      <TriviaSettings />
    </div>
  );
}
