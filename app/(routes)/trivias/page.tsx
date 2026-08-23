'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseFirestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import ClassroomService from '@/lib/classroomService';
import { IconSearch, IconX, IconCards } from '@tabler/icons-react';
import TriviaSettings from './components/TriviaSettings';
import TriviaGrid from './components/TriviaGrid';
import TriviaSearch from './components/TriviaSearch';
import GameStatusBar from '@/components/GameStatusBar';
import UserDataManager from '@/lib/userDataManager';
import { getActivityById } from '@/lib/activities';

const ACTIVITY = getActivityById('trivias');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Trivias';
const ACCENT = ACTIVITY?.color ?? '#1976D2';

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
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  const classroomId = profile?.profile?.classroomId ?? null;

  useEffect(() => {
    const data = UserDataManager.loadUserData();
    setScore(data.game.totalScore);
    setLives(data.game.totalLives);
  }, []);

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

  const indexesByLevel = organizeIndexesByLevel(indexes);

  return (
    <div className="min-h-screen bg-cream dark:bg-gray-900">
      <GameStatusBar title="Trivias" score={score} lives={lives} level={1} activityName={ACTIVITY_TITLE} />

      <section className="w-full max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Header — mismo patrón que /infografias: banner con degradé de
            marca + eyebrow + título, en vez del título suelto de antes. */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm overflow-hidden mb-6">
          <div className="h-20 md:h-28 relative" style={{ background: `linear-gradient(to right, ${ACCENT}, ${ACCENT}CC)` }}>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-20" />
          </div>
          <div className="px-6 py-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${ACCENT}15` }}>
                  <IconCards size={18} style={{ color: ACCENT }} />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
                  Poné a prueba lo que sabés
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-ink dark:text-gray-100 mb-1">
                {classroomId ? 'Trivias de tu clase' : 'Trivias'}
              </h1>
              <p className="text-sm text-ink/60 dark:text-gray-400 max-w-2xl">
                {classroomId
                  ? 'Las trivias que tu docente habilitó para esta clase.'
                  : 'Elegí un nivel y jugá — cada trivia suma puntos a tu perfil.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Búsqueda — solo tiene sentido sobre el catálogo público
                  completo; si hay clase, el listado ya viene acotado por el
                  docente y suele ser chico. */}
              {!classroomId && (
                <button
                  onClick={() => setShowSearch((prev) => !prev)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: showSearch ? '#6B7280' : ACCENT }}
                  title={showSearch ? 'Cerrar búsqueda' : 'Buscar trivia'}
                >
                  {showSearch ? <IconX size={18} /> : <IconSearch size={18} />}
                </button>
              )}

              {/* El botón "Crear trivia" (+) se sacó de acá — ahora vive en
                  el panel del docente, donde además se puede elegir qué se
                  ve en cada clase. */}
              <div className="rounded-full shadow-sm hover:opacity-90 transition-opacity" style={{ backgroundColor: ACCENT }}>
                <TriviaSettings />
              </div>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda desplegable (solo sin clase) */}
        {showSearch && !classroomId && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-6 mb-6">
            <TriviaSearch indexes={indexes} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: ACCENT }} />
          </div>
        ) : error ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-pink-light dark:border-gray-700 shadow-sm p-6 text-center">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        ) : classroomId ? (
          classroomTrivias && classroomTrivias.length > 0 ? (
            <TriviaGrid
              indexesByLevel={{ 1: classroomTrivias.map((t) => ({ id: t.id, name: t.name, level: 1 })) }}
            />
          ) : (
            <div className="text-center py-16">
              <p className="text-ink/60 dark:text-gray-400 text-sm font-medium">
                Todavía no hay trivias disponibles para tu clase.
              </p>
            </div>
          )
        ) : (
          <TriviaGrid indexesByLevel={indexesByLevel} />
        )}
      </section>
    </div>
  );
}
