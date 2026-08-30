'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseFirestore';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import TriviaGame from '@/app/(routes)/trivias/components/TriviaGame';
import type { TriviaQuestion } from '@/types/trivia';

interface Trivia {
  id: string;
  name: string;
  questions: TriviaQuestion[];
}

interface TriviaGameData {
  id: string;
  name: string;
  items: Array<{ question: TriviaQuestion; options: string[] }>;
}

function sortArrayRandomly<T>(array: T[]): T[] {
  const sorted = [...array];
  for (let i = sorted.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  }
  return sorted;
}

/**
 * Versión embebida de una trivia puntual, para jugar dentro de una tarea
 * sin mandar al alumno a otra página — mismo juego que
 * /trivias/[id] (mismas vidas, puntos, review final), sin el
 * GameStatusBar fijo ni el layout de página completa.
 */
export const TriviaInline = ({ triviaId }: { triviaId: string }) => {
  const [gameData, setGameData] = useState<TriviaGameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const triviaSnap = await getDoc(doc(db, 'trivia', triviaId));
        if (!triviaSnap.exists()) throw new Error('Trivia no encontrada');

        const trivia = { id: triviaSnap.id, ...triviaSnap.data() } as Trivia;
        setGameData({
          id: trivia.id,
          name: trivia.name,
          items: trivia.questions.map((question) => ({
            question,
            options: sortArrayRandomly<string>(Object.values(question.options).concat(question.answer)),
          })),
        });

        updateDoc(doc(db, 'trivia', triviaId), { playCount: increment(1) }).catch((err) => {
          console.error('No se pudo registrar la partida:', err);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al obtener la trivia');
        console.error('Error fetching trivia:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [triviaId]);

  if (loading) {
    return <p className="text-sm text-ink/40 dark:text-gray-500 py-6">Cargando trivia...</p>;
  }

  if (error || !gameData) {
    return <p className="text-sm text-red-600 py-4">{error || 'No se pudo cargar la trivia.'}</p>;
  }

  return <TriviaGame {...gameData} showChrome={false} />;
};
