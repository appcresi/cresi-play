'use client';

// Avisa a Analytics cuando alguien se va de una actividad SIN terminarla, y
// en qué punto. Junto con `activity_finished` (lib/activityFinished.ts) permite
// ver en qué pregunta se pierde la gente.
//
// `getParams` devuelve los datos si la persona dejó algo a medias, o null si
// no hay nada que avisar (todavía no empezó, o ya terminó). Se llama al
// desmontar la pantalla (cambio de página) y al cerrar o esconder la pestaña.
// A lo sumo avisa una vez por montaje.
import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

export function useAbandonTracking(eventName: string, getParams: () => Record<string, unknown> | null): void {
  const latest = useRef(getParams);
  // Siempre la versión más nueva de `getParams`, sin volver a suscribir los eventos.
  useEffect(() => {
    latest.current = getParams;
  });

  useEffect(() => {
    let sent = false;
    const send = () => {
      if (sent) return;
      const params = latest.current();
      if (!params) return;
      sent = true;
      // `beacon`: el navegador manda el evento aunque la página se esté cerrando.
      trackEvent(eventName, { ...params, transport_type: 'beacon' });
    };

    // `pagehide` cubre cerrar la pestaña y salir en el celular (donde
    // `beforeunload` no es confiable).
    window.addEventListener('pagehide', send);
    return () => {
      window.removeEventListener('pagehide', send);
      send();
    };
  }, [eventName]);
}
