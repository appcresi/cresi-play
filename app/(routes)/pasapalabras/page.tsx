// app/page.tsx
import type { Metadata } from 'next';
import Wordgame from './components/Wordgame';


export const metadata: Metadata = {
  title: "CrESI | Pasapalabras",
  description:
    'Adiviná la palabra oculta escondida detrás de la definición.',
};

import React from 'react';

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


export default async function Completeword(): Promise<JSX.Element> {
  
  return (
    <main className="min-h-screen bg-[#FFE5E5] font-bold relative overflow-hidden">
      {/* Decorative elements */}
      <ComicStar className="top-10 right-10 animate-bounce delay-100 z-10" />
      <ComicStar className="bottom-20 left-10 animate-bounce delay-300 z-10" />
      
      <div className="mx-auto px-4 max-w-5xl relative">
        {/* Header section */}
        <section className="relative pt-8 pb-1">
          <ComicBurst text="¡POW!" className="top-0 right-0 animate-pulse z-10" />
          
          <div className="bg-white border-4 border-black p-8 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] 
                         transform -rotate-2 hover:rotate-0 transition-all duration-300">
            <p className="text-[#FF6B6B] text-xl font-black mb-2">
              Aprender más, para cuidarse mejor
            </p>
            
            <h1 className="text-6xl font-black text-[#4ADE80] mb-4 transform hover:scale-105 transition-transform"
                style={{ textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
              ¡SIMULADOR DE GROOMING!
            </h1>
            
            <h2 className="text-xl text-gray-700 leading-relaxed">
              <span className="text-[#FF6B6B]">¡KAPOW!</span> ¡Es hora de prevenir el grooming! 
              <span className="text-[#4ADE80]">¡ZAP!</span> Lee cada pregunta y elegí la respuesta correcta. 
              <span className="text-[#FFD93D]">¡BOOM!</span> ¡A prestar atención a los datos que damos por internet!
            </h2>
          </div>
        </section>

        <div className="my-8 transform -rotate-1">
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