import React from 'react';
import Link from 'next/link';
import {
  IconAB2,
  IconCards,
  IconPresentation,
  IconShieldCheck,
  IconBrandPnpm,
  IconPacman
} from "@tabler/icons-react";

const ComicSplash = ({ text, className }: { text: string; className: string }) => (
  <div className={`absolute transform ${className}`}>
    <svg viewBox="0 0 100 100" className="w-20 h-20">
      <path d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" 
            fill="#FF6B6B" stroke="black" strokeWidth="3" />
      <text x="50" y="55" textAnchor="middle" 
            className="text-white font-bold text-xs">
        {text}
      </text>
    </svg>
  </div>
);

const features = [
  {
    title: "Trivias",
    description: "Jugá a nuestras trivias para aprender y poner a prueba tus conocimientos sobre distintas temáticas.",
    icon: <IconCards size={32} />,
    route: "/trivias",
    splashText: "¡POW!",
    color: "#FF6B6B"
  },
  {
    title: "Pasapalabras",
    description: "Descubrí todas las palabra nuevas escondidas detrás de la definición.",
    icon: <IconAB2 size={32} />,
    route: "/pasapalabras",
    splashText: "¡BAM!",
    color: "#4ADE80"
  },
  {
    title: "Simulador de Grooming",
    description: "Identificá y evitá situaciones de grooming en línea, practicando respuestas seguras.",
    icon: <IconShieldCheck size={32} />,
    route: "/simulador",
    splashText: "¡ZAP!",
    color: "#FFD93D"
  },
  {
    title: "Completa Palabras",
    description: "Aprender más sobre sexualidad, completando el texto con la palabra correcta.",
    icon: <IconBrandPnpm size={32} />,
    route: "/completapalabras",
    splashText: "¡BOOM!",
    color: "#FF6B6B"
  },
  {
    title: "DataMuncher",
    description: "¡A comer! Recorré el laberinto y respondé preguntas para ganar puntos y evitar a las bacterias.",
    icon: <IconPacman size={32} />,
    route: "/datamuncher",
    splashText: "¡A jugar!",
    color: "#4ADE80"
  },
  {
    title: "Nuevas Trivias",
    description: "¡Novedad! Jugá a la nueva trivia incorporada actualmente sobre: ALIMENTACIÓN",
    icon: <IconPresentation size={32} />,
    route: "https://jugar.cresi.com.ar/trivias/pregame/2305b679-1b36-444a-986f-1d4f6a797d51",
    splashText: "¡WOW!",
    color: "#FFD93D"
  }
];

const Features = () => {
  return (
    <section className="w-full py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[#FFE5E5] opacity-50" />
      <div className="relative">
        {/* Title with comic style */}
        <div className="text-center mb-12 ">
          <h2 className="inline-block text-4xl font-black text-[#FF6B6B] transform -rotate-2 bg-white border-4 border-black p-4 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]" 
              style={{ textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}>
            ¡SUPER JUEGOS!
          </h2>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 max-w-7xl mx-auto px-4">
          {features.map((feature, index) => (
            <div key={feature.title} className="relative group">
              {/* Comic burst effect */}
              <div className="absolute -top-4 -right-4 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                <ComicSplash text={feature.splashText} className="rotate-12" />
              </div>

              {/* Feature card */}
              <div className="relative bg-white border-4 border-black rounded-lg p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
                          transform transition-all duration-300 hover:rotate-1 hover:scale-105"
                   style={{ backgroundColor: `${feature.color}10` }}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-full border-4 border-black" 
                       style={{ backgroundColor: feature.color }}>
                    <div className="text-white transform group-hover:rotate-12 transition-transform">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black" style={{ color: feature.color }}>
                    {feature.title}
                  </h3>
                </div>

                <p className="mb-6">
                  {feature.description}
                </p>

                <Link href={feature.route} className="block text-center">
                  <button className="w-full bg-black text-white font-black py-3 px-6 rounded-full 
                                   border-4 border-black transform transition-transform duration-300 
                                   hover:scale-105 hover:-rotate-2">
                    ¡DESCUBRIR! →
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;