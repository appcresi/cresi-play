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
}

const features: Feature[] = [
  {
    title: "Pubertad",
    description: "En esta lección aprenderás sobre los principales cambios que ocurren al inicio de la pubertad.",
    icon: <IconAccessible size={32} />,
  },
  {
    title: "Sexualidad",
    description: "¿La sexualidad es solo lo biológico? Aprendé más sobre la diferencia entre sexo, género, orientación sexual.",
    icon: <IconGenderBigender size={32} />,
  },
  {
    title: "Planificación Familiar",
    description: "¿Querés formar una familia? ¿Sabés cómo cuidarte y con qué? Aprendé más sobre métodos anticonceptivos.",
    icon: <IconBabyCarriage size={32} />,
  },
  {
    title: "Métodos anticonceptivos",
    description: "Profundizá tus conocimientos sobre los métodos anticonceptivos y cómo se utilizan.",
    icon: <IconPill size={32} />,
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
    <section className="lg:my-20 px-4">
      {!selectedFeature ? (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
            {features.map((feature) => {
              const correctPercentage = correctPercentages[feature.title];
              const TrophyIcon = correctPercentage && correctPercentage > 65 ? IconTrophyFilled : IconTrophyOff;

              return (
                <li
                  key={feature.title}
                  className="relative group transform transition-transform hover:scale-105"
                >
                  {/* Comic-style panel with "boom" effect border */}
                  <div className="absolute inset-0 bg-white rounded-lg transform rotate-2 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" />
                  
                  {/* Content container */}
                  <div className="relative p-8 bg-primary-light rounded-lg border-4 border-black transform -rotate-1 hover:rotate-0 transition-transform">
                    {/* Header with icon and title */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-white rounded-full border-2 border-black">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-bold font-comic">{feature.title}</h3>
                    </div>
                    
                    {/* Description in speech bubble style */}
                    <div className="relative bg-white p-4 rounded-lg border-2 border-black mb-6">
                      <div className="absolute w-4 h-4 bg-white border-l-2 border-b-2 border-black transform rotate-45 -top-2 left-8" />
                      <p className="text-lg">{feature.description}</p>
                    </div>

                    {/* Trophy and percentage */}
                    {correctPercentage !== null && (
                      <div className="flex items-center gap-2 mb-4">
                        <TrophyIcon size={24} className="text-yellow-500" />
                        <span className="text-sm font-bold">{correctPercentage}%</span>
                      </div>
                    )}

                    {/* Action button */}
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDiscover(feature.title)}
                        className="px-6 py-3 bg-black text-white font-black rounded-full border-2 border-black transform transition-all duration-300 hover:scale-105 hover:-rotate-3 shadow-[4px_4px_0px_0px_#FF6B6B]"
                      >
                        ¡DESCUBRIR!
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <WordDragGame lessonTitle={selectedFeature} />
      )}
    </section>
  );
}