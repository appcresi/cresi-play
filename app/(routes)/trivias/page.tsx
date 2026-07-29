'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ClassroomService from '@/lib/classroomService';
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

interface ClassroomTrivia {
  id: string;
  name: string;
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

/**
 * Trivias disponibles para un alumno con clase: las que creó su propio
 * docente + el catálogo de CrESI, filtradas por lo que ese docente haya
 * restringido para su clase (`visibleTrivias`). Se combinan las dos
 * fuentes en un solo listado — si hubiera una pestaña "públicas" aparte
 * sin restricción, el alumno podría ver ahí igual lo que el docente quiso
 * ocultar (por ejemplo, un tema que todavía no vieron).
 */
async function getClassroomTrivias(
  teacherId: string,
  visibleTrivias: string[] | null
): Promise<ClassroomTrivia[]> {
  try {
    const triviaCollection = collection(db, 'trivia');
    const [ownSnap, cresiSnap] = await Promise.all([
      getDocs(query(triviaCollection, where('author', '==', teacherId))),
      getDocs(query(triviaCollection, where('author', '==', 'CRESI'))),
    ]);

    const mapDoc = (doc: any): ClassroomTrivia => {
      const data = doc.data();
      return { id: data.id || doc.id, name: data.name };
    };

    const combined = [...ownSnap.docs.map(mapDoc), ...cresiSnap.docs.map(mapDoc)];

    if (!visibleTrivias) return combined;
    return combined.filter((t) => visibleTrivias.includes(t.id));
  } catch (error) {
    console.error('Error fetching classroom trivias:', error);
    return [];
  }
}

export default function Trivias(): JSX.Element {
  const { profile } = useAuth();
  const [indexes, setIndexes] = useState<TriviaIndexFields[]>([]);
  const [classroomTrivias, setClassroomTrivias] = useState<ClassroomTrivia[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const classroomId = profile?.profile?.classroomId ?? null;

  useEffect(() => {
    // Sin clase: mismo catálogo público de siempre, sin restricción.
    if (classroomId) return;
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
  }, [classroomId]);

  // Con clase: resolvemos el docente dueño y traemos el listado combinado
  // (propias + CrESI) ya filtrado por lo que ese docente haya restringido.
  useEffect(() => {
    if (!classroomId) return;

    let cancelled = false;
    setLoading(true);

    ClassroomService.getClassroomById(classroomId)
      .then((classroom) => {
        if (cancelled) return;
        if (!classroom?.teacherId) {
          setClassroomTrivias([]);
          setLoading(false);
          return;
        }
        return getClassroomTrivias(classroom.teacherId, classroom.visibleTrivias).then((trivias) => {
          if (cancelled) return;
          setClassroomTrivias(trivias);
          setLoading(false);
        });
      })
      .catch((err) => {
        console.error('Error resolviendo el docente de la clase:', err);
        if (!cancelled) {
          setClassroomTrivias([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [classroomId]);

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
          <h1 className="text-3xl font-bold">
            {classroomId ? 'Trivias de tu clase' : 'ESI: Trivias'}
          </h1>

          <div className="flex items-center gap-2">
            {/* Botón buscar — solo tiene sentido sobre el catálogo público
                completo; si hay clase, el listado ya viene acotado por el
                docente y suele ser chico. */}
            {!classroomId && (
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

            {/* El botón "Crear trivia" (+) se sacó de acá — ahora vive en
                el panel del docente, donde además se puede elegir qué se
                ve en cada clase. */}

            {/* Botón configuración */}
            <div className="bg-blue-600 hover:bg-blue-700 rounded-full shadow-md transition-all duration-200 hover:shadow-lg">
              <TriviaSettings />
            </div>
          </div>
        </div>

        {/* Barra de búsqueda desplegable (solo sin clase) */}
        {showSearch && !classroomId && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <TriviaSearch indexes={indexes} />
            </div>
          </div>
        )}

        {classroomId ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            {classroomTrivias && classroomTrivias.length > 0 ? (
              <TriviaGrid
                indexesByLevel={{ 1: classroomTrivias.map((t) => ({ id: t.id, name: t.name, level: 1 })) }}
              />
            ) : (
              <p className="text-gray-500 text-center py-8">
                Todavía no hay trivias disponibles para tu clase.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <TriviaGrid indexesByLevel={indexesByLevel} />
          </div>
        )}

      </div>
    </main>
  );
}