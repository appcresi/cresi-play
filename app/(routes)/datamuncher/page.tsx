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