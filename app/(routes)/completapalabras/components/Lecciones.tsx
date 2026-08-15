"use client";

import { useState, useEffect } from "react";
import {
  IconAccessible,
  IconTrophyFilled,
  IconTrophyOff,
  IconGenderBigender,
  IconPill,
  IconBabyCarriage
} from "@tabler/icons-react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import WordDragGame, { lessonProgressKey } from "./WordDragGame";
import UserDataManager from '@/lib/userDataManager';
import ClassroomService from '@/lib/classroomService';

interface LessonSummary {
  id: string;
  title: string;
}

// La descripción, ícono y color de cada lección son puro estilo visual —
// no forman parte del contenido en sí (eso vive en Firestore ahora), así
// que se mantienen acá como metadata local. Las 4 lecciones originales de
// CrESI tienen su propia entrada; cualquier lección nueva (por ejemplo,
// creada por un docente) cae en DEFAULT_META.
const LESSON_META: Record<string, { description: string; icon: JSX.Element; color: string; bgColor: string }> = {
  "Pubertad": {
    description: "En esta lección aprenderás sobre los principales cambios que ocurren al inicio de la pubertad.",
    icon: <IconAccessible size={28} />,
    color: "#1967D2",
    bgColor: "#E8F0FE"
  },
  "Sexualidad": {
    description: "¿La sexualidad es solo lo biológico? Aprendé más sobre la diferencia entre sexo, género, orientación sexual.",
    icon: <IconGenderBigender size={28} />,
    color: "#0D652D",
    bgColor: "#E6F4EA"
  },
  "Planificación Familiar": {
    description: "¿Querés formar una familia? ¿Sabés cómo cuidarte y con qué? Aprendé más sobre métodos anticonceptivos.",
    icon: <IconBabyCarriage size={28} />,
    color: "#D93025",
    bgColor: "#FCE8E6"
  },
  "Métodos anticonceptivos": {
    description: "Profundizá tus conocimientos sobre los métodos anticonceptivos y cómo se utilizan.",
    icon: <IconPill size={28} />,
    color: "#E37400",
    bgColor: "#FEF7E0"
  },
};

const DEFAULT_META = {
  description: "Completá la lección arrastrando las palabras correctas.",
  icon: <IconAccessible size={28} />,
  color: "#7B1FA2",
  bgColor: "#F3E5F5"
};

export default function Features(): JSX.Element {
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<LessonSummary | null>(null);
  const [progressPercentages, setProgressPercentages] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      try {
        const userData = UserDataManager.loadUserData();
        const classroomId = userData.profile.classroomId;

        // Siempre las de CrESI.
        const cresiSnap = await getDocs(query(collection(db, 'completapalabras'), where('author', '==', 'CRESI')));
        let all = cresiSnap.docs.map((d) => ({ id: d.id, title: d.data().title as string }));

        if (classroomId) {
          // Si el alumno tiene clase, sumamos también las propias del
          // docente de esa clase, y aplicamos la restricción que haya
          // definido (visibleCompletaPalabras).
          const classroom = await ClassroomService.getClassroomById(classroomId);
          if (classroom?.teacherId) {
            const ownSnap = await getDocs(
              query(collection(db, 'completapalabras'), where('author', '==', classroom.teacherId))
            );
            all = [...all, ...ownSnap.docs.map((d) => ({ id: d.id, title: d.data().title as string }))];
          }
          if (classroom?.visibleCompletaPalabras) {
            const allowed = new Set(classroom.visibleCompletaPalabras);
            all = all.filter((lesson) => allowed.has(lesson.id));
          }
        }

        setLessons(all);
      } catch (err) {
        console.error('❌ Error cargando las lecciones de Completa Palabras:', err);
      } finally {
        setLoadingLessons(false);
      }
    })();
  }, []);

  const handleDiscover = (lesson: LessonSummary) => {
    setSelectedLesson(lesson);
  };

  useEffect(() => {
    if (lessons.length === 0) return;
    const data = UserDataManager.loadUserData();
    const percentages: Record<string, number> = {};
    lessons.forEach((lesson) => {
      percentages[lesson.title] = data.progress.activityScores[lessonProgressKey(lesson.title)] || 0;
    });
    setProgressPercentages(percentages);
  }, [lessons, selectedLesson]);

  if (selectedLesson) {
    return (
      <section className="py-8 px-4 max-w-7xl mx-auto">
        <WordDragGame lessonId={selectedLesson.id} />
      </section>
    );
  }

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Lecciones</h2>
        <p className="text-gray-500">Seleccioná una lección para comenzar</p>
      </div>

      {loadingLessons ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
        </div>
      ) : lessons.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-16">
          Todavía no hay lecciones disponibles.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {lessons.map((lesson) => {
            const meta = LESSON_META[lesson.title] ?? DEFAULT_META;
            const progressPercentage = progressPercentages[lesson.title] ?? 0;
            const isComplete = progressPercentage >= 100;
            const TrophyIcon = isComplete ? IconTrophyFilled : IconTrophyOff;

            return (
              <div
                key={lesson.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col"
                onClick={() => handleDiscover(lesson)}
              >
                {/* Header colorido */}
                <div
                  className="h-24 relative"
                  style={{ backgroundColor: meta.bgColor }}
                >
                  <div className="absolute bottom-4 left-4 w-14 h-14 rounded-full flex items-center justify-center shadow-sm bg-white">
                    <div style={{ color: meta.color }}>
                      {meta.icon}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
                    {lesson.title}
                  </h3>

                  <p className="text-sm text-gray-500 mb-4 flex-1">
                    {meta.description}
                  </p>

                  {/* Trophy and percentage */}
                  <div className="flex items-center gap-2 py-2 border-t border-gray-100">
                    <TrophyIcon
                      size={18}
                      className={isComplete ? "text-yellow-500" : "text-gray-300"}
                    />
                    <span className="text-sm font-medium text-gray-600">
                      {progressPercentage}% completado
                    </span>
                  </div>
                </div>

                {/* Footer hover effect */}
                <div
                  className="h-1 transition-all duration-200 hover:h-2"
                  style={{ backgroundColor: meta.color }}
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}