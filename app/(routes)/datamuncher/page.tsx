// app/page.tsx
import type { Metadata } from 'next';
import DataMuncher from './components/DataMuncher';
import ComicBurst from '@/components/ComicBurst';
import React from 'react';

export const metadata: Metadata = {
  metadataBase: new URL("https://jugar.cresi.com.ar"),
  title: "CrESI | DataMuncher",
  description:
    "¡Pon a prueba tus conocimientos mientras te divertís! Contestá preguntas, comé datos y acumulá puntos en este emocionante juego de CrESI.",
  keywords: [
    "CrESI",
    "DataMuncher",
    "juegos educativos",
    "aprender jugando",
    "educación sexual integral",
    "juegos de trivia",
    "juegos interactivos",
    "juegos para jóvenes",
  ],
  openGraph: {
    title: "CrESI | DataMuncher",
    description:
      "¡Divertite y aprendé con DataMuncher! Contestá preguntas, comé datos y acumulá puntos para ganar. ¿Estás listo para el desafío?",
    url: "https://jugar.cresi.com.ar/datamuncher",
    siteName: "CrESI",
    images: [
      {
        url: "illustration-1.jpg",
        width: 1200,
        height: 630,
        alt: "DataMuncher - Responde preguntas y gana puntos mientras comes datos.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CrESI | DataMuncher",
    description:
      "¡Divertite y aprendé con DataMuncher! Contestá preguntas, comé datos y acumulá puntos para ganar. ¿Estás listo para el desafío?",
    images: ["illustration-1.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  }
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
              DATAMUNCHER
            </h1>

            
            <h2 className="hidden md:block text-xl text-gray-700 leading-relaxed">
              <span className="text-[#FF6B6B]">¡KAPOW!</span> ¡A comer la mayor cantidad de información! 
              <span className="text-[#4ADE80]">¡ZAP!</span> Lee cada pregunta y elegí la respuesta correcta. 
              <span className="text-[#FFD93D]">¡BOOM!</span> ¡Cuidado que no te atrapen los virus o bacterias!
            </h2>
          </div>
        </section>
        <div className="my-8 transform">
          <div className="bg-white border-4 border-black rounded-lg p-6 
                         shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mt-8 sm:mt-12">
            <DataMuncher />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}