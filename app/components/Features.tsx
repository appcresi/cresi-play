"use client"
import React, { useState, useMemo } from 'react';
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
  IconSearch,
  IconX,
} from "@tabler/icons-react";

const features = [
  {
    title: "Trivias",
    description: "Poné a prueba tus conocimientos jugando trivias sobre salud, derechos, diversidad y mucho más.",
    icon: <IconCards size={24} />,
    route: "/trivias",
    color: "#FF6B6B",
    textColor: "#FFFFFF",
    image: "/trivia.svg",
    priority: true // Marcamos como prioritaria la primera imagen
  },
  {
    title: "Pasapalabras",
    description: "Jugá con las letras del abecedario y descubrí palabras claves a partir de sus definiciones.",
    icon: <IconAB2 size={24} />,
    route: "/pasapalabras",
    color: "#4ADE80",
    textColor: "#005C22",
    image: "/pasapalabras.svg",
    priority: true // Segunda imagen también prioritaria
  },
  {
    title: "Simulador Grooming",
    description: "Practicá cómo reaccionar ante mensajes sospechosos y aprendé a cuidarte en las redes sociales.",
    icon: <IconShieldCheck size={24} />,
    route: "/simulador",
    color: "#FFD93D",
    textColor: "#8B5A00",
    image: "/simulador.svg",
    priority: true // Tercera imagen prioritaria
  },
  {
    title: "Completa Palabras",
    description: "Completá frases con las palabras correctas y descubrí conceptos sobre sexualidad, cuidado y derechos.",
    icon: <IconBrandPnpm size={24} />,
    route: "/completapalabras",
    color: "#FF6B6B",
    textColor: "#FFFFFF",
    image: "/completa.svg"
  },
  {
    title: "DataMuncher",
    description: "Recorré el laberinto, respondé preguntas y esquivá bacterias para sumar puntos así ganar el juego.",
    icon: <IconPacman size={24} />,
    route: "/datamuncher",
    color: "#4ADE80",
    textColor: "#005C22",
    image: "/datamuncher.svg"
  },
  {
    title: "MoodTracker",
    description: "Reflexioná sobre cómo te sentís, registrá tus emociones y aprendé a expresar tu estado de ánimo.",
    icon: <IconMoodPuzzled size={24} />,
    route: "/moodtracker",
    color: "#FFD93D",
    textColor: "#8B5A00",
    image: "/moodtracker.svg"
  },
  {
    title: "Meme Generator",
    description: "Creá memes originales con mensajes reflexivos y compartilos con tus amistades.",
    icon: <IconMoodTongueWink2 size={24} />,
    route: "/memegenerador",
    color: "#FF6B6B",
    textColor: "#FFFFFF",
    image: "/meme.svg"
  },
  {
    title: "Literatura",
    description: "Leé cuentos breves y relatos que invitan a reflexionar sobre vínculos, derechos y emociones.",
    icon: <IconMoodTongueWink2 size={24} />,
    route: "/literatura",
    color: "#4ADE80",
    textColor: "#005C22",
    image: "/literatura.svg"
  },
  {
    title: "BioPuzzle",
    description: "Completá el rompecabezas de la biología humana y aprendé sobre el cuerpo humano de forma divertida.",
    icon: <IconMoodPuzzled size={24} />,
    route: "/biopuzzle",
    color: "#FFD93D",
    textColor: "#8B5A00",
    image: "/biopluzzle.svg"
  },
  {
    title: "Prevención",
    description: "Todo sobre el preservativo, el único método que reduce la posibilidad de contraer un ITS.",
    icon: <IconMoodPuzzled size={24} />,
    route: "/condon",
    color: "#FF6B6B",
    textColor: "#FFFFFF",
    image: "/condon.svg"
  }
];

const Features = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar features basado en el término de búsqueda
  const filteredFeatures = useMemo(() => {
    if (!searchTerm.trim()) return features;
    
    return features.filter(feature =>
      feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <section className="w-full py-2 md:py-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[#FFE5E5] opacity-50" />
      
      <div className="relative">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto px-4 mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <IconSearch size={20} className="text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Buscá actividades por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 text-lg border-4 border-black rounded-full 
                       bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                       focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
                       focus:outline-none focus:ring-0 transition-all duration-200
                       placeholder-gray-500"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
              >
                <IconX size={20} />
              </button>
            )}
          </div>
          
          {/* Search results counter */}
          {searchTerm && (
            <div className="mt-3 text-center">
              <span className="inline-block px-4 py-2 bg-white border-3 border-black rounded-full text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {filteredFeatures.length} {filteredFeatures.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
              </span>
            </div>
          )}
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
          {filteredFeatures.length > 0 ? (
            filteredFeatures.map((feature, index) => (
              <div 
                key={feature.title} 
                className="group card-animate bg-white border-4 border-black rounded-xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-105"
              >
                {/* Imagen superior */}
                <div className="relative h-40 overflow-hidden">
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{ backgroundColor: feature.color }}
                  />
                  <Image 
                    src={feature.image} 
                    alt={feature.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    // OPTIMIZACIONES APLICADAS:
                    priority={feature.priority || index < 3} // Prioridad para las primeras 3 imágenes
                    loading={index < 3 ? "eager" : "lazy"} // Carga inmediata solo para las primeras 3
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    quality={85} // Calidad optimizada
                  />
                  
                  {/* Ícono flotante */}
                  <div className="absolute top-3 right-3">
                    <div
                      className="flex justify-center items-center p-2 rounded-full border-3 border-black shadow-lg animate-bounce-slow"
                      style={{ backgroundColor: feature.color }}
                    >
                      <div className="text-white">
                        {feature.icon}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4 flex flex-col h-48">
                  {/* Título */}
                  <h3 
                    className="text-xl font-black mb-3 text-center"
                    style={{ color: feature.textColor === "#FFFFFF" ? "#333" : feature.textColor }}
                  >
                    {feature.title}
                  </h3>

                  {/* Descripción */}
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 flex-grow">
                    {feature.description}
                  </p>

                  {/* Botón */}
                  <Link href={feature.route} className="mt-auto">
                    <button
                      className="w-full py-3 px-4 rounded-full font-bold text-white border-3 border-black 
                               transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                               active:translate-y-[1px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      style={{ backgroundColor: feature.color }}
                    >
                      ¡DESCUBRIR! →
                    </button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            /* No results message */
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center max-w-md">
                <IconSearch size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-500 mb-4">
                  Intentá con otros términos de búsqueda o explorá todas las actividades disponibles.
                </p>
                <button
                  onClick={clearSearch}
                  className="px-6 py-2 bg-[#FF6B6B] text-white font-bold rounded-full border-3 border-black
                           hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-200"
                >
                  Ver todas las actividades
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* CSS para animaciones personalizadas - Optimizado para mejor rendimiento */}
      <style jsx>{`
        .card-animate {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
          transform: translateY(30px);
          will-change: transform, opacity;
        }

        .card-animate:nth-child(1) { animation-delay: 0.1s; }
        .card-animate:nth-child(2) { animation-delay: 0.2s; }
        .card-animate:nth-child(3) { animation-delay: 0.3s; }
        .card-animate:nth-child(4) { animation-delay: 0.4s; }
        .card-animate:nth-child(5) { animation-delay: 0.5s; }
        .card-animate:nth-child(6) { animation-delay: 0.6s; }
        .card-animate:nth-child(7) { animation-delay: 0.7s; }
        .card-animate:nth-child(8) { animation-delay: 0.8s; }
        .card-animate:nth-child(9) { animation-delay: 0.9s; }

        .animate-bounce-slow {
          animation: bounce-slow 3s infinite;
          will-change: transform;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-slow {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-8px);
          }
          60% {
            transform: translateY(-4px);
          }
        }

        /* Efecto hover para el botón - Optimizado */
        button:hover {
          animation: pulse 0.5s ease-in-out;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        /* Optimización para animaciones suaves */
        .group:hover .group-hover\\:scale-110 {
          will-change: transform;
        }
        
        .hover\\:scale-105:hover {
          will-change: transform;
        }
      `}</style>
    </section>
  );
};

export default Features;