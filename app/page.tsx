import React from 'react';
import Link from 'next/link';
import {
  IconArrowNarrowRight,
  IconBrain,
  IconBulb,
  IconCheck,
  IconExternalLink,
  IconTrendingUp
} from '@tabler/icons-react';
import Features from "./components/Features";
import type { Metadata } from "next";


export const metadata: Metadata = {
  title: "CrESI | Jugar",
  description:
    "¡Aprendé jugando con CrESI! Pon a prueba tus conocimientos con nuestras trivia y juegos didácticos.",
};


interface ComicBurstProps {
  text: string;
  className: string;
}

const ComicBurst: React.FC<ComicBurstProps> = ({ text, className }) => (
  <div className={`absolute transform rotate-12 ${className}`}>
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        <path d="M50 0 L65 35 L100 50 L65 65 L50 100 L35 65 L0 50 L35 35 Z" 
              fill="#FF6B6B" stroke="black" strokeWidth="2" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold text-white text-sm">
        {text}
      </span>
    </div>
  </div>
);

const ComicHome = () => {
  return (
    <main className="min-h-screen bg-[#FFE5E5] font-bold overflow-hidden">
      {/* Decorative elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 right-10 animate-bounce delay-100">
          <svg width="50" height="50" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#FFD93D" stroke="black" strokeWidth="2"/>
            <text x="50" y="55" textAnchor="middle" className="text-2xl">⭐</text>
          </svg>
        </div>
        <div className="absolute bottom-20 left-10 animate-bounce delay-300">
          <svg width="40" height="40" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="#4ADE80" stroke="black" strokeWidth="2"/>
            <text x="50" y="55" textAnchor="middle" className="text-2xl">✨</text>
          </svg>
        </div>
      </div>

      {/* Comic-style header with enhanced effects */}
      <div className="mx-auto px-4 max-w-5xl relative mb-4">
        <ComicBurst text="¡WOW!" className="absolute top-4 right-4 z-10" />
        <ComicBurst text="¡BAM!" className="absolute bottom-1 left-1 z-10" />
        <div className="absolute inset-0 bg-[#FF6B6B] opacity-10 transform rotate-3"></div>
        <div className="relative mx-auto px-8 max-w-7xl pt-16">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 rounded-lg transform -rotate-2 hover:rotate-0 transition-all duration-300">
            <p className="text-[#FF6B6B] text-xl transform rotate-2 animate-pulse">¡POW! 💥</p>
            <h1 className="text-6xl mb-4 font-black text-[#4ADE80] transform rotate-2 hover:scale-105 transition-transform" style={{ 
              textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'
            }}>
              ¡Aprendé Jugando!
            </h1>
            <h2 className="text-xl text-gray-700 transform rotate-2">
              <span className="text-[#FF6B6B]">¡KAPOW!</span> Nunca aprender fue tan divertido como con CrESI. 
              <span className="text-[#4ADE80]">¡ZAP!</span> Sumérgete en una experiencia interactiva.
              <span className="text-[#FFD93D]">¡BOOM!</span>
            </h2>
          </div>
        </div>
      </div>
      <Features />
      {/* Features section with enhanced comic panels */}
      <div className="mx-auto px-4 max-w-5xl mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          {
            icon: <IconBrain size={32} />,
            title: "¡CRASH! ¡Desafía tu mente!",
            content: "Pon a prueba tus conocimientos con nuestras trivia",
            color: "#FF6B6B"
          },
          {
            icon: <IconCheck size={32} />,
            title: "¡ZING! ¡Aprende de tus errores!",
            content: "Estadísticas detalladas y explicaciones para cada pregunta",
            color: "#4ADE80"
          },
          {
            icon: <IconTrendingUp size={32} />,
            title: "¡WOOSH! ¡Comparte tu éxito!",
            content: "Obtén certificados y presume tus logros",
            color: "#FFD93D"
          },
          {
            icon: <IconBulb size={32} />,
            title: "¡POP! ¡Involúcrate!",
            content: "Recursos gratuitos y juegos didácticos para todos",
            color: "#FF6B6B"
          }
        ].map((feature, index) => (
          <div key={index} 
               className="bg-white border-4 border-black p-6 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform hover:scale-105 hover:rotate-1 transition-all duration-300"
               style={{ backgroundColor: `${feature.color}15` }}>
            <div className="flex items-center gap-3 mb-4" style={{ color: feature.color }}>
              <div className="transform hover:rotate-12 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black">{feature.title}</h3>
            </div>
            <p className="text-gray-700">{feature.content}</p>
          </div>
        ))}
      </div>

      {/* Enhanced call to action */}
      <div className="mx-auto px-4 max-w-5xl my-16">
        <div className="relative bg-[#4ADE80] text-white border-4 border-black p-8 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center overflow-hidden">
          <ComicBurst text="¡YAY!" className="-top-4 -right-4 animate-spin-slow" />
          <h2 className="text-4xl font-black mb-4 animate-pulse" style={{
            textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'
          }}>
            ¡BOOM! ¿Listo para la aventura?
          </h2>
          <Link href="/trivias" 
                className="inline-block bg-[#FFD93D] text-black px-8 py-4 rounded-full font-black border-4 border-black transform hover:scale-110 hover:-rotate-3 transition-all duration-300">
            ¡COMENZÁ AHORA! <IconArrowNarrowRight className="inline ml-2 animate-bounce" />
          </Link>
        </div>
      </div>

      {/* Enhanced footer */}
      <div className="bg-[#FF6B6B] text-white p-4 text-center">
        <a
          href="https://cresi.com.ar"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 font-black hover:scale-110 transition-transform"
        >
          ¡DESCUBRE NUESTRA HISTORIA! <IconExternalLink className="animate-bounce" />
        </a>
      </div>
    </main>
  );
};

export default ComicHome;