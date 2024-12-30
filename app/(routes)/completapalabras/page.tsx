import type { Metadata } from "next";
import Lecciones from "./components/Lecciones";
import React from 'react';
import type { CustomResponse } from '@/types/response';
import type { Trivia, TriviaIndexFields } from '@/types/trivia';
import { API_URL } from '@/utils/helpers';
import ComicBurst from '@/components/ComicBurst';

export const metadata: Metadata = {
  title: "CrESI | Completapalabras",
  description:
    "Aprendé sobre sexualidad completando las palabras de las lecciones.",
};


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

export default async function Completeword(): Promise<JSX.Element> {
  const indexes = await getTriviaIndexes();
 
  return (
    <main className="min-h-screen bg-[#FFE5E5] font-bold relative overflow-hidden">     
      <div className="mx-auto px-4 max-w-5xl relative">
        {/* Header section */}
        <section className="relative pt-8 pb-1">
          <ComicBurst text="¡POW!" className="top-0 right-0 animate-pulse z-10" />
          
          <div className="bg-white border-4 border-black p-8 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] 
                         transform -rotate-2 hover:rotate-0 transition-all duration-300">
            <p className="text-[#FF6B6B] text-xl font-black mb-2">
              Aprender más, para cuidarse mejor
            </p>
            
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#4ADE80] mb-4 transform hover:scale-105 transition-transform"
              style={{ textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}
            >
              ¡COMPLETAPALABRAS!
            </h1>
            
            <h2 className="hidden md:block text-xl text-gray-700 leading-relaxed">
              <span className="text-[#FF6B6B]">¡KAPOW!</span> ¡Es hora de jugar! 
              <span className="text-[#4ADE80]">¡ZAP!</span> Lee con atención y completa la palabra correcta. 
              <span className="text-[#FFD93D]">¡BOOM!</span> ¡A divertirse!
            </h2>
          </div>
        </section>

        <div className="my-8 transform sm:-rotate-1">
          <div className="bg-white border-1 border-black rounded-lg p-2 
                         shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mt-8 sm:mt-12">
              <Lecciones />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}