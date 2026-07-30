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
import WordDragGame, { lessonProgressKey } from "./WordDragGame";
import UserDataManager from '@/lib/userDataManager';

interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
  color: string;
  bgColor: string;
}

const features: Feature[] = [
  {
    title: "Pubertad",
    description: "En esta lección aprenderás sobre los principales cambios que ocurren al inicio de la pubertad.",
    icon: <IconAccessible size={28} />,
    color: "#1967D2",
    bgColor: "#E8F0FE"
  },
  {
    title: "Sexualidad",
    description: "¿La sexualidad es solo lo biológico? Aprendé más sobre la diferencia entre sexo, género, orientación sexual.",
    icon: <IconGenderBigender size={28} />,
    color: "#0D652D",
    bgColor: "#E6F4EA"
  },
  {
    title: "Planificación Familiar",
    description: "¿Querés formar una familia? ¿Sabés cómo cuidarte y con qué? Aprendé más sobre métodos anticonceptivos.",
    icon: <IconBabyCarriage size={28} />,
    color: "#D93025",
    bgColor: "#FCE8E6"
  },
  {
    title: "Métodos anticonceptivos",
    description: "Profundizá tus conocimientos sobre los métodos anticonceptivos y cómo se utilizan.",
    icon: <IconPill size={28} />,
    color: "#E37400",
    bgColor: "#FEF7E0"
  },
];

export default function Features(): JSX.Element {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [progressPercentages, setProgressPercentages] = useState<Record<string, number>>({});

  const handleDiscover = (title: string) => {
    setSelectedFeature(title);
  };

  useEffect(() => {
    const data = UserDataManager.loadUserData();
    const percentages: Record<string, number> = {};
    features.forEach((feature) => {
      percentages[feature.title] = data.progress.activityScores[lessonProgressKey(feature.title)] || 0;
    });
    setProgressPercentages(percentages);
  }, [selectedFeature]);

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      {!selectedFeature ? (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">Lecciones</h2>
            <p className="text-gray-500">Seleccioná una lección para comenzar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature) => {
              const progressPercentage = progressPercentages[feature.title] ?? 0;
              const isComplete = progressPercentage >= 100;
              const TrophyIcon = isComplete ? IconTrophyFilled : IconTrophyOff;

              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer flex flex-col"
                  onClick={() => handleDiscover(feature.title)}
                >
                  {/* Header colorido */}
                  <div
                    className="h-24 relative"
                    style={{ backgroundColor: feature.bgColor }}
                  >
                    <div className="absolute bottom-4 left-4 w-14 h-14 rounded-full flex items-center justify-center shadow-sm bg-white">
                      <div style={{ color: feature.color }}>
                        {feature.icon}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1.5">
                      {feature.title}
                    </h3>

                    <p className="text-sm text-gray-500 mb-4 flex-1">
                      {feature.description}
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
                    style={{ backgroundColor: feature.color }}
                  />
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <WordDragGame lessonTitle={selectedFeature} />
      )}
    </section>
  );
}