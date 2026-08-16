'use client';

import { useEffect } from 'react';

// Boundary de error de todo el sitio — sin esto, un error de render en
// cualquier página (cualquiera de los ~20 juegos, el panel docente, etc.)
// tiraba una pantalla en blanco sin forma de recuperarse. Los layouts por
// encima de este archivo (app/layout.tsx) siguen renderizando normalmente;
// solo se reemplaza el contenido de la página que falló.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error('❌ Error no capturado:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-pink-light p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-pink-light rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-ink mb-2">Algo salió mal</h2>
        <p className="text-ink/70 mb-6">
          Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2 rounded-full bg-coral text-white font-medium hover:bg-coral-dark transition-colors"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="px-5 py-2 rounded-full bg-pink-light text-ink/80 font-medium hover:bg-pink transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
