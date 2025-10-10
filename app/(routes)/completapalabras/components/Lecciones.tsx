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
import WordDragGame from "./WordDragGame";

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
  const [correctPercentages, setCorrectPercentages] = useState<Record<string, number | null>>({});

  const handleDiscover = (title: string) => {
    setSelectedFeature(title);
  };

  useEffect(() => {
    const storedPercentages: Record<string, number | null> = {};
    features.forEach((feature) => {
      const percentage = localStorage.getItem(feature.title);
      storedPercentages[feature.title] = percentage ? parseFloat(percentage) : null;
    });
    setCorrectPercentages(storedPercentages);
  }, []);

  return (
    <section className="py-8 px-4 max-w-7xl mx-auto">
      {!selectedFeature ? (
        <>
          <div className="mb-8">
            <h2 className="text-3xl font-medium text-gray-800 mb-2">Lecciones</h2>
            <p className="text-gray-600">Seleccioná una lección para comenzar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const correctPercentage = correctPercentages[feature.title];
              const TrophyIcon = correctPercentage && correctPercentage > 65 ? IconTrophyFilled : IconTrophyOff;

              return (
                <div
                  key={feature.title}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col"
                  onClick={() => handleDiscover(feature.title)}
                >
                  {/* Header colorido */}
                  <div 
                    className="h-24 relative"
                    style={{ backgroundColor: feature.bgColor }}
                  >
                    <div 
                      className="absolute bottom-4 left-4 w-14 h-14 rounded-full flex items-center justify-center shadow-md bg-white"
                    >
                      <div style={{ color: feature.color }}>
                        {feature.icon}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="text-xl font-medium text-gray-800 mb-2">
                      {feature.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 flex-1">
                      {feature.description}
                    </p>

                    {/* Trophy and percentage */}
                    {correctPercentage !== null && (
                      <div className="flex items-center gap-2 py-2 border-t border-gray-100">
                        <TrophyIcon 
                          size={20} 
                          className={correctPercentage > 65 ? "text-yellow-500" : "text-gray-300"}
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {correctPercentage}% completado
                        </span>
                      </div>
                    )}
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