// app/page.tsx
import type { Metadata } from 'next';
import Wordgame from './components/Wordgame';
import ComicBurst from '@/components/ComicBurst';
import React from 'react';

export const metadata: Metadata = {
  title: "CrESI | Pasapalabras",
  description:
    'Adiviná la palabra oculta escondida detrás de la definición.',
};

export default async function Completeword(): Promise<JSX.Element> {
  
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
              ¡PASAPALABRAS!
            </h1>
            
            <h2 className="hidden md:block text-xl text-gray-700 leading-relaxed">
              <span className="text-[#FF6B6B]">¡KAPOW!</span> ¡Es hora de prevenir el grooming! 
              <span className="text-[#4ADE80]">¡ZAP!</span> Lee cada pregunta y elegí la respuesta correcta. 
              <span className="text-[#FFD93D]">¡BOOM!</span> ¡A prestar atención a los datos que damos por internet!
            </h2>
          </div>
        </section>

        <div className="my-8 transform">
          <div className="bg-white border-4 border-black rounded-lg p-6 
                         shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mt-8 sm:mt-12">
            <Wordgame />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}