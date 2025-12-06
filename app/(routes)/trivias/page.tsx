'use client';

import React, { useEffect, useState } from 'react';
import type { Metadata } from "next";
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import TriviaSettings from './components/TriviaSettings';
import TriviaGrid from './components/TriviaGrid';
import TriviaSearch from './components/TriviaSearch';

interface Trivia {
  id: string;
  name: string;
  level: number;
  [key: string]: any;
}

interface TriviaIndexFields {
  id: string;
  name: string;
  level: number;
}

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
  try {
    const triviaCollection = collection(db, 'trivia');
    const q = query(triviaCollection, where('author', '==', 'CRESI'));
    const querySnapshot = await getDocs(q);
    
    const trivias: Trivia[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Trivia[];

    return trivias.map(getOnlyIndexFields);
  } catch (error) {
    console.error('Error fetching trivias from Firebase:', error);
    throw new Error('Error al obtener las trivias');
  }
}

export default function Trivias(): JSX.Element {
  const [indexes, setIndexes] = useState<TriviaIndexFields[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTrivias = async () => {
      try {
        setLoading(true);
        const data = await getTriviaIndexes();
        setIndexes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadTrivias();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto px-4 max-w-6xl py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-600">Cargando trivias...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto px-4 max-w-6xl py-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

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