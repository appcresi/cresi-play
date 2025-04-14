import React from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import type { CustomResponse } from '@/types/response';
import type { Trivia, TriviaIndexFields } from '@/types/trivia';
import { API_URL } from '@/utils/helpers';
import TriviaSettings from './components/TriviaSettings';
import TriviaGrid from './components/TriviaGrid';
import TriviaSearch from './components/TriviaSearch';
import type { Metadata } from "next";
import ComicBurst from '@/components/ComicBurst';


export const metadata: Metadata = {
  metadataBase: new URL("https://jugar.cresi.com.ar"),
  title: "CrESI | Trivia",
  description:
    "Jugá a responder a más de 700 preguntas, distribuidas en diferentes temáticas y niveles de dificultad. Aprendé mientras te divertís con CrESI.",
  keywords: [
    "CrESI",
    "trivia",
    "juegos educativos",
    "trivia didácticas",
    "educación sexual integral",
    "trivia ESI",
    "preguntas y respuestas",
    "juegos para jóvenes",
    "aprender jugando",
  ],
  openGraph: {
    title: "CrESI | Trivia",
    description:
      "Jugá a responder a más de 700 preguntas, distribuidas en diferentes temáticas y niveles de dificultad. Aprendé mientras te divertís con CrESI.",
    url: "https://jugar.cresi.com.ar/trivias",
    siteName: "CrESI",
    images: [
      {
        url: "illustration-1.jpg",
        width: 1200,
        height: 630,
        alt: "CrESI Trivia - Responde más de 700 preguntas distribuidas en temáticas y niveles.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CrESI | Trivia",
    description:
      "Jugá a responder a más de 700 preguntas, distribuidas en diferentes temáticas y niveles de dificultad. Aprendé mientras te divertís con CrESI.",
    images: ["illustration-1.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  }
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

export default async function Trivias(): Promise<JSX.Element> {
  const indexes = await getTriviaIndexes();
  const indexesByLevel = organizeIndexesByLevel(indexes);

  return (
    <main className="min-h-screen bg-[#FFE5E5] font-bold relative overflow-hidden">
      <div className="mx-auto px-4 max-w-5xl relative">
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