'use client';

import { useEffect } from 'react';

// Cubre la home ("/") y los ~20 juegos/actividades bajo app/(routes)/ de
// una sola vez (los grupos de rutas con paréntesis no agregan segmento de
// URL, pero sí participan del árbol de layouts/error boundaries).
export default function ActivityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error('❌ Error en una actividad:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-md text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">😢</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No pudimos cargar esta actividad</h2>
        <p className="text-gray-600 mb-6">
          Algo falló al mostrar este juego. Podés intentar de nuevo o volver al inicio.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-5 py-2 rounded-full bg-indigo-600 text-white font-medium hover:opacity-90 transition-colors"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="px-5 py-2 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    </div>
  );
}
