import React from 'react';
import type { CustomResponse } from '@/types/response';
import type { Trivia, TriviaIndexFields } from '@/types/trivia';
import { API_URL } from '@/utils/helpers';
import TriviaSettings from './components/TriviaSettings';
import TriviaGrid from './components/TriviaGrid';
import TriviaSearch from './components/TriviaSearch';
import type { Metadata } from "next";

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
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto px-4 max-w-6xl py-8">
        {/* Search section */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <TriviaSearch indexes={indexes} />
          </div>
        </div>

        {/* Grid section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-20">
          <TriviaGrid indexesByLevel={indexesByLevel} />
        </div>

        {/* Settings button - flotante */}
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl">
            <TriviaSettings />
          </div>
        </div>
      </div>
    </main>
  );
}