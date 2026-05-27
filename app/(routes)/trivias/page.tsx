'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
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

interface CustomTrivia {
  id: string;
  name: string;
  description?: string;
  questions?: any[];
  author: string;
  isPublic?: boolean;
  created_at?: string;
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

async function getUserCustomTrivias(userId: string): Promise<CustomTrivia[]> {
  try {
    const triviaCollection = collection(db, 'trivia');
    const q = query(triviaCollection, where('author', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const customTrivias: CustomTrivia[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: data.id || doc.id,
        name: data.name,
        description: data.description,
        questions: data.questions,
        author: data.author,
        isPublic: data.isPublic,
        created_at: data.created_at
      };
    });

    return customTrivias;
  } catch (error) {
    console.error('Error fetching user trivias:', error);
    return [];
  }
}

export default function Trivias(): JSX.Element {
  const { user } = useAuth();
  const [indexes, setIndexes] = useState<TriviaIndexFields[]>([]);
  const [customTrivias, setCustomTrivias] = useState<CustomTrivia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'publicas' | 'mias'>('publicas');
  const [showSearch, setShowSearch] = useState(false);

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

  useEffect(() => {
    if (!user?.uid) {
      setCustomTrivias([]);
      return;
    }

    const loadUserCustomTrivias = async () => {
      const customData = await getUserCustomTrivias(user.uid);
      setCustomTrivias(customData);
    };

    loadUserCustomTrivias();
  }, [user?.uid]);

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

        {/* Header con título y botones alineados horizontalmente */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">ESI: Trivias</h1>

          <div className="flex items-center gap-2">
            {/* Botón buscar */}
            {(!user || customTrivias.length === 0 || activeTab === 'publicas') && (
              <button
                onClick={() => setShowSearch((prev) => !prev)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 hover:shadow-lg ${
                  showSearch ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                title={showSearch ? 'Cerrar búsqueda' : 'Buscar trivia'}
              >
                {showSearch ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                )}
              </button>
            )}

            {/* Botón crear trivia */}
            {user && (
              <Link href="/crear-trivia">
                <button
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center text-2xl font-bold transition shadow-md hover:shadow-lg"
                  title="Crear trivia"
                >
                  +
                </button>
              </Link>
            )}

            {/* Botón configuración */}
            <div className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-md transition-all duration-200 hover:shadow-lg">
              <TriviaSettings />
            </div>
          </div>
        </div>

        {/* Barra de búsqueda desplegable */}
        {showSearch && (!user || customTrivias.length === 0 || activeTab === 'publicas') && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <TriviaSearch indexes={indexes} />
            </div>
          </div>
        )}

        {/* Tabs */}
        {user && customTrivias.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('mias')}
                className={`px-6 py-3 font-semibold transition ${
                  activeTab === 'mias'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mis trivias ({customTrivias.length})
              </button>
              <button
                onClick={() => setActiveTab('publicas')}
                className={`px-6 py-3 font-semibold transition ${
                  activeTab === 'publicas'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Trivias públicas
              </button>
            </div>
          </div>
        )}

        {/* Mis trivias tab */}
        {user && customTrivias.length > 0 && activeTab === 'mias' && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <TriviaGrid indexesByLevel={{ 1: customTrivias.map(t => ({ id: t.id, name: t.name, level: 1 })) }} />
          </div>
        )}

        {/* Trivias públicas tab */}
        {(!user || customTrivias.length === 0 || activeTab === 'publicas') && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <TriviaGrid indexesByLevel={indexesByLevel} />
          </div>
        )}

      </div>
    </main>
  );
}