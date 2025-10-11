import React, { Suspense, lazy } from 'react';
import {
  IconExternalLink,
} from '@tabler/icons-react';
import Features from "./components/Features";

// Lazy load heavy components
const CharacterSelectionModal = lazy(() => import('@/components/CharacterSelectionModal'));


const ComicHome = () => {
  
  return (
    <main 
      className="min-h-screen bg-[#FFE5E5] font-bold overflow-hidden"
      aria-label="CrESI Jugar Página Principal"
    >
      <Suspense fallback={<div>Cargando...</div>}>
        <CharacterSelectionModal />
      </Suspense>
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