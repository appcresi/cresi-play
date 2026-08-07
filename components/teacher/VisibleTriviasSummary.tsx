import React, { useEffect, useState } from 'react';
import { IconLoader, IconClipboardList } from '@tabler/icons-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Classroom } from '@/types/classroom';
import { colorForTrivia } from '@/lib/triviaColors';
import type { TeacherTriviaOption } from './types';

export const VisibleTriviasSummary = ({ classroom, teacherId }: { classroom: Classroom; teacherId: string }) => {
  const [trivias, setTrivias] = useState<TeacherTriviaOption[] | null>(null);

  useEffect(() => {
    if (!teacherId) return;
    (async () => {
      try {
        const mapDoc = (isOwn: boolean) => (d: any): TeacherTriviaOption => {
          const data = d.data();
          return {
            id: data.id || d.id,
            name: data.name,
            questionCount: Array.isArray(data.questions) ? data.questions.length : 0,
            isOwn,
          };
        };
        const [ownSnap, cresiSnap] = await Promise.all([
          getDocs(query(collection(db, 'trivia'), where('author', '==', teacherId))),
          getDocs(query(collection(db, 'trivia'), where('author', '==', 'CRESI'))),
        ]);
        const list: TeacherTriviaOption[] = [
          ...ownSnap.docs.map(mapDoc(true)),
          ...cresiSnap.docs.map(mapDoc(false)),
        ];
        const visible = classroom.visibleTrivias
          ? list.filter((t) => classroom.visibleTrivias!.includes(t.id))
          : list;
        setTrivias(visible);
      } catch (err) {
        console.error('Error cargando trivias:', err);
        setTrivias([]);
      }
    })();
  }, [teacherId, classroom.visibleTrivias]);

  if (trivias === null) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
        <IconLoader className="w-4 h-4 animate-spin" /> Cargando...
      </div>
    );
  }

  if (trivias.length === 0) {
    return <p className="text-xs text-gray-400">Todavía no hay trivias seleccionadas.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {trivias.map((t) => {
        const color = colorForTrivia(t.id);
        return (
          <div
            key={t.id}
            className="rounded-xl border-2 border-transparent shadow-sm p-3 min-w-0"
            style={{ borderColor: color, backgroundColor: `${color}0D` }}
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white mb-2"
              style={{ backgroundColor: color }}
            >
              <IconClipboardList className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-gray-800 leading-tight mb-0.5 line-clamp-2 break-words">{t.name}</p>
            <p className="text-[10px] text-gray-500 leading-tight">
              {t.questionCount} preg.{!t.isOwn && ' · CrESI'}
            </p>
          </div>
        );
      })}
    </div>
  );
};