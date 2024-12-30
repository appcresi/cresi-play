import React from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import type { CustomResponse } from '@/types/response';
import type { Trivia, TriviaIndexFields } from '@/types/trivia';
import { API_URL } from '@/utils/helpers';
import TriviaSettings from './components/TriviaSettings';
import TriviaGrid from './components/TriviaGrid';
import TriviaSearch from './components/TriviaSearch';
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "CrESI | Trivia",
  description:
    "Jugá a responder a más de 700 preguntas, distribuidas en diferentes temáticas y niveles de dificultad.",
};


const ComicBurst = ({ text, className }: { text: string; className: string }) => (
  <div className={`absolute transform ${className}`}>
    <svg viewBox="0 0 100 100" className="w-24 h-24">
      <path d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" 
            fill="#FF6B6B" stroke="black" strokeWidth="3" />
      <text x="50" y="55" textAnchor="middle" 
            className="font-bold text-white text-sm">
        {text}
      </text>
    </svg>
  </div>
);

const ComicStar = ({ className }: { className: string }) => (
  <div className={`absolute ${className}`}>
    <svg width="40" height="40" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#FFD93D" stroke="black" strokeWidth="2"/>
      <text x="50" y="55" textAnchor="middle" className="text-2xl">⭐</text>
    </svg>
  </div>
);

function getOnlyIndexFields(trivia: Trivia): TriviaIndexFields {
  const { id, name, level } = trivia;
  return { id, name, level };
}

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

export default async function Trivias(): Promise<JSX.Element> {
  const indexes = await getTriviaIndexes();
  const indexesByLevel = organizeIndexesByLevel(indexes);

  return (
    <main className="min-h-screen bg-[#FFE5E5] font-bold relative overflow-hidden">
      {/* Decorative elements */}
      <ComicStar className="top-10 right-10 animate-bounce delay-100" />
      <ComicStar className="bottom-20 left-10 animate-bounce delay-300" />
      
      <div className="mx-auto px-4 max-w-5xl relative">
        {/* Header section */}
        <section className="relative pt-8 pb-1">
          <ComicBurst text="¡POW!" className="top-0 right-0 animate-pulse z-10" />
          
          
          <div className="bg-white border-4 border-black p-8 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] 
                         transform -rotate-2 hover:rotate-0 transition-all duration-300">
            <p className="text-[#FF6B6B] text-xl font-black mb-2">
              Aprender más, para amar mejor
            </p>
            
            <h1 className="text-6xl font-black text-[#4ADE80] mb-4 transform hover:scale-105 transition-transform"
                style={{ textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
              ¡TRIVIA!
            </h1>
            
            <h2 className="text-xl text-gray-700 leading-relaxed">
              <span className="text-[#FF6B6B]">¡KAPOW!</span> ¡Es hora de jugar! 
              <span className="text-[#4ADE80]">¡ZAP!</span> Encuentra tu trivia perfecta 
              <span className="text-[#FFD93D]">¡BOOM!</span> Ajusta el tiempo y ¡a divertirse!
            </h2>

            <a href="https://cresi.com.ar/buscar"
               target="_blank"
               rel="noreferrer"
               className="inline-block mt-6 px-6 py-3 bg-[#FFD93D] text-black rounded-full font-black 
                        border-4 border-black transform hover:scale-105 hover:-rotate-3 
                        transition-all duration-300 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              ¿De dónde salen las preguntas?
              <IconExternalLink className="inline-block ml-2 animate-bounce" />
            </a>
          </div>
        </section>

        {/* Search section with comic style */}
        <div className="my-8 transform -rotate-1">
          <div className="bg-white border-4 border-black rounded-lg p-6 
                         shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <TriviaSearch indexes={indexes} />
          </div>
        </div>

        {/* Grid section */}
        <div className="relative">
          <ComicBurst text="¡WOW!" className="-top-4 -right-4 z-10" />
          <div className="bg-white/80 backdrop-blur border-4 border-black rounded-lg p-6 
                         shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <TriviaGrid indexesByLevel={indexesByLevel} />
          </div>
        </div>

        {/* Settings button */}
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