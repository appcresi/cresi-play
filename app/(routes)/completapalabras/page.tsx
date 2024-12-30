import type { Metadata } from "next";
import Lecciones from "./components/Lecciones";

export const metadata: Metadata = {
  title: "CrESI | Completapalabras",
  description:
    "Aprendé sobre sexualidad completando las palabras de las lecciones.",
};


import React from 'react';
import type { CustomResponse } from '@/types/response';
import type { Trivia, TriviaIndexFields } from '@/types/trivia';
import { API_URL } from '@/utils/helpers';


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

export default async function Completeword(): Promise<JSX.Element> {
  const indexes = await getTriviaIndexes();
 
  return (
    <main className="min-h-screen bg-[#FFE5E5] font-bold relative overflow-hidden">
      {/* Decorative elements */}
      <ComicStar className="top-10 right-10 animate-bounce delay-100" />
      <ComicStar className="bottom-20 left-10 animate-bounce delay-300" />
      
      <div className="mx-auto px-4 max-w-5xl relative">
        {/* Header section */}
        <section className="relative pt-8 pb-1">
          <ComicBurst text="¡POW!" className="top-0 right-0 animate-pulse" />
          
          <div className="bg-white border-4 border-black p-8 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] 
                         transform -rotate-2 hover:rotate-0 transition-all duration-300">
            <p className="text-[#FF6B6B] text-xl font-black mb-2">
              Aprender más, para cuidarse mejor
            </p>
            
            <h1 className="text-6xl font-black text-[#4ADE80] mb-4 transform hover:scale-105 transition-transform"
                style={{ textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
              ¡COMPLETAPALABRA!
            </h1>
            
            <h2 className="text-xl text-gray-700 leading-relaxed">
              <span className="text-[#FF6B6B]">¡KAPOW!</span> ¡Es hora de jugar! 
              <span className="text-[#4ADE80]">¡ZAP!</span> Lee con atención y completa la palabra correcta. 
              <span className="text-[#FFD93D]">¡BOOM!</span> ¡A divertirse!
            </h2>
          </div>
        </section>

        <div className="my-8 transform -rotate-1">
          <div className="bg-white border-4 border-black rounded-lg p-6 
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