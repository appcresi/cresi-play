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

        <div className="relative mx-auto px-8 max-w-7xl pt-16 text-center">
          <div className="flex flex-col items-center justify-center text-center bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-4 rounded-lg transform -rotate-2 hover:rotate-0 transition-all duration-300 min-h-[100px]" role="banner">
            <img src="cresi-logo.webp" alt="logo de cresi" className="mx-auto max-w-full h-auto" />
          </div>
        </div>
      </div>
      <Features />
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