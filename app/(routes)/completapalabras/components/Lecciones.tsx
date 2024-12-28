"use client";

import { useState, useEffect } from "react";
import {
  IconBookDownload,
  IconCards,
  IconPresentation,
  IconTrophyFilled,
  IconTrophyOff,
} from "@tabler/icons-react";
import Button from "./Button";
import WordDragGame from "./WordDragGame";

interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
}

const features: Feature[] = [
  {
    title: "Pubertad",
    description:
      "En esta lección aprenderás sobre los principales cambios que ocurren al inicio de la pubertad.",
    icon: <IconBookDownload size={32} />,
  },
  {
    title: "Sexualidad",
    description:
      "¿La sexualidad es solo lo biológico? Aprendé más sobre la diferencia entre sexo, género, orientación sexual.",
    icon: <IconPresentation size={32} />,
  },
  {
    title: "Planificación Familiar",
    description:
      "¿Querés formar una familia? ¿Sabés cómo cuidarte y con qué? Aprendé más sobre métodos anticonceptivos.",
    icon: <IconCards size={32} />,
  },
  {
    title: "Métodos anticonceptivos",
    description:
      "Profundizá tus conocimientos sobre los métodos anticonceptivos y cómo se utilizan.",
    icon: <IconCards size={32} />,
  },
];

export default function Features(): JSX.Element {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [correctPercentages, setCorrectPercentages] = useState<Record<string, number | null>>({});

  const handleDiscover = (title: string) => {
    setSelectedFeature(title);
  };

  // Obtener el porcentaje de correctas desde localStorage, pero solo en el cliente
  useEffect(() => {
    const storedPercentages: Record<string, number | null> = {};

    features.forEach((feature) => {
      const percentage = localStorage.getItem(feature.title);
      storedPercentages[feature.title] = percentage ? parseFloat(percentage) : null;
    });

    setCorrectPercentages(storedPercentages);
  }, []); // Solo se ejecuta una vez cuando el componente se monta

  return (
    <section className="lg:my-20">
      {!selectedFeature ? (
        <>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {features.map((feature) => {
              const correctPercentage = correctPercentages[feature.title];

              // Lógica para mostrar la copa o la copa tachada
              const TrophyIcon = correctPercentage && correctPercentage > 65 ? IconTrophyFilled : IconTrophyOff;

              return (
                <li
                  className="p-6 flex flex-col rounded-3xl bg-primary-light h-full"
                  key={feature.title}
                >
                  <span className="my-6 w-fit flex gap-2 items-center">
                    {feature.icon}
                    <p className="text-3xl font-semibold">{feature.title}</p>
                  </span>
                  <p className="text-lg text-gray-700">{feature.description}</p>
                  {/* Mostrar el ícono de la copa o copa tachada */}
                  {correctPercentage !== null && (
                    <div className="mt-2 flex items-center">
                      <TrophyIcon size={24} className="text-yellow-500" />
                      <p className="ml-2 text-sm text-gray-500">
                        {correctPercentage}%
                      </p>
                    </div>
                  )}
                  <div className="mt-auto flex justify-end">
                    <Button
                      variant="primary"
                      onClick={() => handleDiscover(feature.title)}
                    >
                      Descubrir
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <WordDragGame
          lessonTitle={selectedFeature}
        />
      )}
    </section>
  );
}
