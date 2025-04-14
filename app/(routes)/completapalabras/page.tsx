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