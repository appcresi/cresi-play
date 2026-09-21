// lib/trackClient.ts
//
// Avisa a /api/track de un evento de uso (partida, lección completada,
// descarga, respuesta a una pregunta). "Dispará y olvidá": si falla no se
// avisa a nadie, un contador que no suma no debe romper el juego.
import type { TrackEvent } from './track';

export function track(event: TrackEvent): void {
  try {
    void fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // sin red o sin fetch: se ignora
  }
}
