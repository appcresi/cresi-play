'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import TriviaGame from '../../components/TriviaGame';
import { getActivityById } from '@/lib/activities';

const ACCENT = getActivityById('trivias')?.color ?? '#1976D2';

interface Question {
  question: string;
  answer: string;
  options: {
    first: string;
    second: string;
    third: string;
  };
  resume: string;
}

interface Trivia {
  id: string;
  name: string;
  questions: Question[];
}

interface TriviaGameProps {
  id: string;
  name: string;
  items: Array<{ question: Question; options: string[] }>;
}

function sortArrayRandomly<T>(array: T[]): T[] {
  const sorted = [...array];
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  }
  return sorted;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TriviaPage({ params }: PageProps) {
  const [id, setId] = useState<string>('');
  const [gameData, setGameData] = useState<TriviaGameProps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const resolveParams = async () => {
      const { id: triviaId } = await params;
      setId(triviaId);
    };

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const fetchTrivia = async () => {
      try {
        setLoading(true);
        const triviaRef = doc(db, 'trivia', id);
        const triviaSnap = await getDoc(triviaRef);

        if (!triviaSnap.exists()) {
          throw new Error('Trivia no encontrada');
        }

        const trivia = {
          id: triviaSnap.id,
          ...triviaSnap.data(),
        } as Trivia;

        // Sort the trivia's questions and their options
        const gameDataFormatted: TriviaGameProps = {
          id: trivia.id,
          name: trivia.name,
          items: Array.from(
            trivia.questions.map((question) => {
              return {
                question,
                options: sortArrayRandomly<string>(
                  Object.values(question.options).concat(question.answer)
                ),
              };
            })
          ),
        };

        setGameData(gameDataFormatted);

        // Antes esto se contaba solo desde el botón "Jugar" del panel del
        // docente — es decir, nunca reflejaba partidas reales de alumnos,
        // ni funcionaba para trivias de CrESI. Acá es el único lugar por
        // el que se entra a jugar de verdad, sin importar quién ni de
        // quién sea la trivia — así el contador es real. No bloquea la
        // carga del juego si falla (no es crítico).
        updateDoc(doc(db, 'trivia', id), {
          playCount: increment(1),
        }).catch((err) => {
          console.error('No se pudo registrar la partida:', err);
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Error al obtener la trivia';
        setError(errorMessage);
        console.error('Error fetching trivia:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrivia();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-pink-light p-8 text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: ACCENT }}
          />
          <p className="text-ink/60 text-sm">Cargando trivia...</p>
        </div>
      </div>
    );
  }

  if (error || !gameData) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-pink-light p-8 text-center">
          <p className="text-red-600 text-sm">{error || 'No se pudo cargar la trivia'}</p>
        </div>
      </div>
    );
  }

  return <TriviaGame {...gameData} />;
}