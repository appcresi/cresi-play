import React, { Suspense, lazy } from 'react';
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

// Lazy load heavy components
const CharacterSelectionModal = lazy(() => import('@/components/CharacterSelectionModal'));
const ComicBurst = lazy(() => import('@/components/ComicBurst'));

// Metadata remains the same as in the original file

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  content: string;
  color: string;
};

const FeatureCard = React.memo(({ icon, title, content, color }: FeatureCardProps) => (
  <div 
    className="bg-white border-4 border-black p-6 rounded-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform hover:scale-105 hover:rotate-1 transition-all duration-300"
    style={{ backgroundColor: `${color}15` }}
  >
    <div className="flex items-center gap-3 mb-4" style={{ color: color }}>
      <div className="transform hover:rotate-12 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-black">{title}</h3>
    </div>
    <p className="text-gray-700">{content}</p>
  </div>
));

const ComicHome = () => {
  const features = [
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
  ];

  return (
    <main 
      className="min-h-screen bg-[#FFE5E5] font-bold overflow-hidden"
      aria-label="CrESI Jugar Página Principal"
    >
      <Suspense fallback={<div>Cargando...</div>}>
        <CharacterSelectionModal />
      </Suspense>

      {/* Comic-style header */}
      <div className="mx-auto px-4 max-w-5xl relative mb-4">
        <Suspense fallback={<div></div>}>
          <ComicBurst text="¡WOW!" className="absolute top-4 right-4 z-10" />
        </Suspense>

        <div className="relative mx-auto px-8 max-w-7xl pt-16">
          <div 
            className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 rounded-lg transform -rotate-2 hover:rotate-0 transition-all duration-300"
            role="banner"
          >
            <p 
              className="text-[#FF6B6B] text-xl transform rotate-2 animate-pulse" 
              aria-hidden="true"
            >
              ¡POW! 💥
            </p>
            <h1 
              className="text-4xl sm:text-6xl mb-4 font-black text-[#4ADE80] transform rotate-2 hover:scale-105 transition-transform" 
              style={{textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'}}
            >
              ¡Aprendé Jugando!
            </h1>

            <h2 
              className="hidden md:block text-xl text-gray-700 transform rotate-2"
              aria-label="Descripción de CrESI"
            >
              <span className="text-[#FF6B6B]">¡GENIAL!</span> Nunca aprender fue tan divertido como con CrESI. 
              <span className="text-[#4ADE80]">¡VAMOS!</span> Sumérgete en una experiencia interactiva.
              <span className="text-[#FFD93D]">¡JUGUEMOS!</span>
            </h2>
          </div>
        </div>
      </div>
      <Features />
      {/* Features section */}
      <div className="mx-auto px-4 max-w-5xl mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <FeatureCard 
            key={index}
            icon={feature.icon}
            title={feature.title}
            content={feature.content}
            color={feature.color}
          />
        ))}
      </div>

      {/* Call to Action */}
      <div className="mx-auto px-4 max-w-5xl my-16">
        <div 
          className="relative bg-[#4ADE80] text-white border-4 border-black p-8 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center overflow-hidden"
          role="region"
          aria-label="Comenzar Aventura"
        >
          <Suspense fallback={<div></div>}>
            <ComicBurst 
              text="¡YAY!" 
              className="-top-4 -right-4 animate-spin-slow" 
            />
          </Suspense>
          <h2 
            className="text-4xl font-black mb-4 animate-pulse" 
            style={{
              textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'
            }}
          >
            ¡BOOM! ¿Listo para la aventura?
          </h2>
          <Link 
            href="/trivias" 
            className="inline-block bg-[#FFD93D] text-black px-8 py-4 rounded-full font-black border-4 border-black transform hover:scale-110 hover:-rotate-3 transition-all duration-300"
            aria-label="Comenzar Trivias"
          >
            ¡COMENZÁ AHORA! <IconArrowNarrowRight className="inline ml-2 animate-bounce" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer 
        className="bg-[#FF6B6B] text-white p-4 text-center"
        role="contentinfo"
      >
        <a
          href="https://cresi.com.ar"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 font-black hover:scale-110 transition-transform"
          aria-label="Visitar sitio web de CrESI"
        >
          ¡DESCUBRE NUESTRA HISTORIA! <IconExternalLink className="animate-bounce" />
        </a>
      </footer>
    </main>
  );
};

export default ComicHome;