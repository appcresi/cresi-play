"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  IconAB2,
  IconCards,
  IconMoodPuzzled,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman,
  IconMoodTongueWink2,
  IconArrowBack,
  IconInfoCircle
} from "@tabler/icons-react";

const features = [
  {
    title: "Trivias",
    description: "Poné a prueba tus conocimientos jugando trivias sobre salud, derechos, diversidad y mucho más.",
    icon: <IconCards size={32} />,
    route: "/trivias",
    color: "#FF6B6B",
    textColor: "#FFFFFF",
    image: "/trivia.svg"
  },
  {
    title: "Pasapalabras",
    description: "¿La sabés o pasás? Jugá con las letras del abecedario y descubrí palabras claves a partir de sus definiciones.",
    icon: <IconAB2 size={32} />,
    route: "/pasapalabras",
    color: "#4ADE80",
    textColor: "#005C22",
    image: "/pasapalabras.svg"
  },
  {
    title: "Simulador Grooming",
    description: "Practicá cómo reaccionar ante mensajes sospechosos y aprendé a cuidarte en redes sociales y chats en línea.",
    icon: <IconShieldCheck size={32} />,
    route: "/simulador",
    color: "#FFD93D",
    textColor: "#8B5A00",
    image: "/simulador.svg"
  },
  {
    title: "Completa Palabras",
    description: "Completá frases con las palabras correctas y descubrí conceptos sobre sexualidad, cuidado y derechos.",
    icon: <IconBrandPnpm size={32} />,
    route: "/completapalabras",
    color: "#FF6B6B",
    textColor: "#FFFFFF",
    image: "/completa.svg"
  },
  {
    title: "DataMuncher",
    description: "Recorré el laberinto, respondé preguntas sobre ESI y esquivá bacterias para sumar puntos y ganar el juego.",
    icon: <IconPacman size={32} />,
    route: "/datamuncher",
    color: "#4ADE80",
    textColor: "#005C22",
    image: "/datamuncher.svg"
  },
  {
    title: "MoodTracker",
    description: "Reflexioná sobre cómo te sentís, registrá tus emociones y aprendé a identificar y expresar tu estado de ánimo.",
    icon: <IconMoodPuzzled size={32} />,
    route: "/moodtracker",
    color: "#FFD93D",
    textColor: "#8B5A00",
    image: "/moodtracker.svg"
  },
  {
    title: "Meme Generator",
    description: "Creá memes originales con mensajes reflexivos y compartilos con tus amistades.",
    icon: <IconMoodTongueWink2 size={32} />,
    route: "/memegenerador",
    color: "#FF6B6B",
    textColor: "#FFFFFF",
    image: "/meme.svg"
  },
  {
    title: "Literatura",
    description: "Leé cuentos breves y relatos inspiradores que invitan a reflexionar sobre vínculos, derechos y emociones.",
    icon: <IconMoodTongueWink2 size={32} />,
    route: "/literatura",
    color: "#4ADE80",
    textColor: "#005C22",
    image: "/literatura.svg"
  },
];


const Features = () => {
  // Estado para controlar qué tarjetas están volteadas
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});

  // Función para voltear una tarjeta
  interface FlippedCardsState {
    [key: number]: boolean;
  }

  const toggleCard = (index: number): void => {
    setFlippedCards((prev: FlippedCardsState) => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Función para manejar el clic en el botón "Descubrir" sin voltear la tarjeta
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Esto evita que el clic en el botón se propague al contenedor de la tarjeta
  };

  return (
    <section className="w-full py-8 md:py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[#FFE5E5] opacity-50" />
      <div className="relative">
        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-7xl mx-auto px-4">
          {features.map((feature, index) => (
            <div key={feature.title} className="flip-card h-64 md:h-80 pb-2 pt-10 relative">
              {/* Title banner positioned above card */}
              <div className="absolute -top-2 left-0 right-0 mx-auto w-8/10 z-10">
                <div className="bg-white border-4 border-black py-2 px-4 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                     style={{ backgroundColor: feature.color }}>
                  <h3 className="text-xl md:text-2x3 font-black text-center" style={{ color: feature.textColor, textShadow: '1px 1px 0 rgba(0,0,0,0.2)' }}>
                    {feature.title}
                  </h3>
                </div>
              </div>
              
              <div 
                className={`flip-card-inner ${flippedCards[index] ? 'flipped' : ''}`}
                onClick={() => toggleCard(index)}
              >
                {/* Front of card - Image */}
                <div className="flip-card-front">
                  <div className="w-full h-full border-4 border-black rounded-lg overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
                    <div className="w-full h-full relative">
                      {/* Image placeholder - replace with your actual image component */}
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center overflow-hidden">
                         <Image 
                          src={feature.image} 
                          alt={feature.title}
                          fill
                          className="object-cover"
                        /> 
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Back of card - Content */}
                <div className="flip-card-back">
                  <div
                    className="h-full flex flex-col justify-between bg-white border-4 border-black rounded-lg  shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden"
                    style={{ backgroundColor: `${feature.color}10` }}
                  >
                    <div className="flex flex-col h-full">
                      {/* Ícono centrado */}
                      <div className="flex justify-center items-center mb-2 md:mb-3 mt-6">
                        <div
                          className="flex justify-center items-center p-2 md:p-3 rounded-full border-4 border-black"
                          style={{ backgroundColor: feature.color }}
                        >
                          <div className="text-white">
                            {feature.icon}
                          </div>
                        </div>
                      </div>

                      {/* Descripción */}
                      <p className="text-center mb-auto text-sm md:text-base px-1">
                        {feature.description}
                      </p>

                      {/* Botón Descubrir */}
                      <div className="mt-2 mb-2">
                        <Link href={feature.route} className="w-full block">
                          <button
                            onClick={handleButtonClick}
                            className="w-8/10 bg-black text-white font-black py-2 px-4 rounded-full 
                                    border-4 border-black transition-transform duration-300 
                                    hover:scale-105 text-sm md:text-base"
                            aria-label="Descubrir"
                          >
                            ¡DESCUBRIR! →
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* CSS para el efecto flip */}
      <style jsx>{`
        .flip-card {
          background-color: transparent;
          perspective: 1000px;
          cursor: pointer;
        }

        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.8s;
          transform-style: preserve-3d;
        }

        /* En desktop, activar en hover */
        @media (hover: hover) and (min-width: 768px) {
          .flip-card:hover .flip-card-inner {
            transform: rotateY(180deg);
          }
        }

        /* En mobile y tablets, no activar en hover, solo con la clase flipped */
        .flip-card-inner.flipped {
          transform: rotateY(180deg);
        }

        .flip-card-front, .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }

        .flip-card-front {
          background-color: transparent;
        }

        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </section>
  );
};

export default Features;