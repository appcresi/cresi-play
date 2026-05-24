// app/page.tsx
import type { Metadata } from 'next';
import DataMuncher from './components/DataMuncher';
import React from 'react';

export const metadata: Metadata = {
  metadataBase: new URL("https://jugar.cresi.com.ar"),
  title: "ESI | DataMuncher | CrESI",
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
    <main className="min-h-screen bg-gray-100 font-sans">
          {/* Contenido principal */}
          <div className="max-w-5xl mx-auto px-4 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                  <DataMuncher />
            </div>
          </div>
    </main>
  );
}