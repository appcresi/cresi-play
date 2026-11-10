import React, { useState } from 'react';
import { IconPlayerPlayFilled, IconBrandYoutube } from '@tabler/icons-react';

// Video tutorial del aula virtual, en el Tablón de la clase modelo.
// Hasta que el docente toca "play" no se carga nada de YouTube (ni iframe
// ni miniatura): abrir la clase no suma peso ni pedidos a terceros. Al
// tocar, se monta el reproductor de youtube-nocookie.com (no guarda
// cookies hasta que se reproduce). El dominio está permitido en frame-src
// (lib/securityHeaders.js).
export const TUTORIAL_VIDEO_ID = 'Susc345Y_Ak';

export const TutorialVideoCard = () => {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-pink-light dark:border-gray-700 p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-medium text-ink dark:text-gray-100">Video tutorial: cómo usar el aula virtual</h3>
          <p className="text-xs text-ink/60 dark:text-gray-400 mt-0.5">
            En 4 minutos: crear la clase, sumar alumnos, elegir el contenido, asignar tareas y calificar.
          </p>
        </div>
        <a
          href={`https://youtu.be/${TUTORIAL_VIDEO_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-ink/50 dark:text-gray-400 hover:text-coral-dark shrink-0"
        >
          <IconBrandYoutube className="w-4 h-4" />
          Ver en YouTube
        </a>
      </div>

      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-ink">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${TUTORIAL_VIDEO_ID}?autoplay=1&rel=0`}
            title="Video tutorial: cómo usar el aula virtual de CrESI Play"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label="Reproducir el video tutorial"
            className="group absolute inset-0 w-full h-full flex flex-col items-center justify-center gap-4 text-white
                     bg-gradient-to-br from-coral to-coral-dark"
          >
            <span className="w-16 h-16 rounded-full bg-white/95 text-coral-dark flex items-center justify-center shadow-lg
                           transition-transform group-hover:scale-110">
              <IconPlayerPlayFilled className="w-7 h-7 ml-1" />
            </span>
            <span className="text-lg sm:text-xl font-semibold px-4 text-center">Cómo usar el aula virtual</span>
          </button>
        )}
      </div>
    </div>
  );
};
