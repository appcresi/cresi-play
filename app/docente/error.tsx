'use client';

import { useEffect } from 'react';

export default function DocenteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error('❌ Error en el panel docente:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-pink-light p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-pink-light rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-ink mb-2">Algo salió mal en el panel</h2>
        <p className="text-ink/70 mb-6">
          Ocurrió un error inesperado. Probá de nuevo — si el problema sigue, volvé más tarde.
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
            href="/docente"
            className="px-5 py-2 rounded-full bg-pink-light text-ink/80 font-medium hover:bg-pink transition-colors"
          >
            Volver al panel
          </a>
        </div>
      </div>
    </div>
  );
}
