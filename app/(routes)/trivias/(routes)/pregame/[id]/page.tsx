import React from 'react';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { IconArrowNarrowLeft, IconArrowNarrowRight } from '@tabler/icons-react';
import TriviaSettings from '../../../components/TriviaSettings';
import { API_URL } from '@/utils/helpers';
import { type CustomResponse } from '@/types/response';
import { type Trivia } from '@/types/trivia';
import type { Metadata } from 'next';
import ComicBurst from '@/components/ComicBurst';

// Types
interface Params {
  id: string;
}

export const metadata: Metadata = {
  title: 'Presentación trivias | CrESI',
  description: 'Poné a prueba tus conocimientos con nuestras trivias y aprendé mientras jugás.',
};

// Workshop fetching function
async function getWorkshops(id: string): Promise<Trivia> {
  try {
    const response = await fetch(`${API_URL}/trivias/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const body = (await response.json()) as CustomResponse<Trivia>;

    if (body.hasError || !body.data) {
      throw new Error(`API Error: ${body.message || 'No se encontraron datos.'}`);
    }

    return body.data;
  } catch (error) {
    console.error('Error fetching trivia:', error);
    throw new Error('Failed to fetch trivia. Please try again later.');
  }
}

export default async function Page({ params }: { params: Params }) {
  const data = await getWorkshops(params.id);

  return (
    <main className="min-h-screen bg-[#FFE5E5] font-bold relative overflow-hidden">
      {/* Decorative elements */}
      <ComicBurst text="¡POW!" className="top-20 right-20 animate-pulse" />
      
      <div className="mx-auto px-4 max-w-5xl relative pt-8">
        {/* Back button */}
        <Link 
          href="/trivias" 
          className="fixed top-8 left-8 bg-[#4ADE80] p-4 rounded-full border-4 border-black
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:scale-110
                    transition-all duration-300"
        >
          <IconArrowNarrowLeft size={32} />
        </Link>

        {/* Title */}
        <div className="text-center mb-12">
          <h2 className="text-6xl font-black text-[#4ADE80] transform hover:scale-105 transition-transform"
              style={{ textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
            ¡TRIVIA!
          </h2>
        </div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Info Card */}
          <div className="w-full md:w-1/2">
            <div className="bg-white border-4 border-black p-8 rounded-lg 
                           shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] 
                           transform -rotate-2 hover:rotate-0 transition-all duration-300">
              <div className="space-y-4 text-xl">
                <p className="flex items-center gap-2">
                  <span className="text-[#FF6B6B] font-black">Nombre:</span>
                  <span className="font-bold">{data.name}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#4ADE80] font-black">Autor:</span>
                  <span className="font-bold">{data.author}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#FFD93D] font-black">Nivel:</span>
                  <span className="font-bold">{data.level}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#FF6B6B] font-black">Preguntas:</span>
                  <span className="font-bold">{data.questions.length}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-[#4ADE80] font-black">Creado el:</span>
                  <span className="font-bold">
                    {new Date(data.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    })}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="w-full md:w-1/2">
            <div className="bg-white border-4 border-black p-8 rounded-lg 
                           shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] 
                           transform rotate-2 hover:rotate-0 transition-all duration-300">
              <h4 className="text-3xl font-black text-[#4ADE80] mb-6 text-center"
                  style={{ textShadow: '2px 2px 0 #000' }}>
                ¡Compartir!
              </h4>
              <div className="bg-white p-4 rounded-lg border-4 border-black text-center flex justify-center items-center">
                <QRCode
                  size={256}
                  style={{ height: 'auto', maxWidth: '50%', width: '50%' }}
                  value={`https://jugar.cresi.com.ar/trivias/pregame/${data.id}`}
                  viewBox={`0 0 256 256`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Play Button */}
        <div className="flex justify-center mt-12 mb-8">
          <Link
            href={`/trivias/${data.id}`}
            className="bg-[#4ADE80] px-12 py-4 rounded-full font-black text-2xl
                     border-4 border-black transform hover:scale-105 hover:-rotate-3 
                     transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                     flex items-center gap-2"
          >
            ¡JUGAR AHORA!
            <IconArrowNarrowRight size={32} />
          </Link>
        </div>

        {/* Settings Button */}
        <div className="fixed bottom-6 right-6 transform hover:scale-110 transition-transform">
          <div className="bg-[#4ADE80] rounded-full border-4 border-black 
                         shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <TriviaSettings />
          </div>
        </div>
      </div>
    </main>
  );
}