// lib/track.ts
//
// Contadores públicos (partidas de una trivia, lecciones completadas,
// descargas, "en qué se equivocan más") que se suman por /api/track con el
// Admin SDK. Antes los escribía el navegador directo a Firestore y las reglas
// dejaban a CUALQUIERA (sin login) tocar esos campos: se podían inflar con un
// bucle desde la consola y, en `questionStats`, escribir datos de forma libre
// en documentos de trivias oficiales. Ahora las reglas los cierran y la ruta
// valida qué se suma y limita cuántas veces.
//
// Este módulo es puro (validación + límites) para poder probarlo sin Next.

export type TrackEvent =
  | { kind: 'trivia-play'; id: string }
  | { kind: 'lesson-complete'; id: string }
  | { kind: 'download'; collection: 'resources' | 'infografias'; id: string }
  | { kind: 'question-stat'; id: string; index: number; correct: boolean };

// Los ids de documento del proyecto son uuids o ids automáticos de Firestore.
const ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
/** Ninguna trivia del proyecto tiene tanto (el panel docente tope a 20). */
export const MAX_QUESTION_INDEX = 199;

const isId = (value: unknown): value is string => typeof value === 'string' && ID_PATTERN.test(value);

/** Devuelve el evento validado y "limpio" (solo los campos conocidos), o null si algo no cierra. */
export function parseTrackEvent(body: unknown): TrackEvent | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  switch (b.kind) {
    case 'trivia-play':
    case 'lesson-complete':
      return isId(b.id) ? { kind: b.kind, id: b.id } : null;
    case 'download':
      return (b.collection === 'resources' || b.collection === 'infografias') && isId(b.id)
        ? { kind: 'download', collection: b.collection, id: b.id }
        : null;
    case 'question-stat':
      return isId(b.id) &&
        Number.isInteger(b.index) && (b.index as number) >= 0 && (b.index as number) <= MAX_QUESTION_INDEX &&
        typeof b.correct === 'boolean'
        ? { kind: 'question-stat', id: b.id, index: b.index as number, correct: b.correct }
        : null;
    default:
      return null;
  }
}

/** Colección de Firestore que corresponde al evento. */
export function collectionFor(event: TrackEvent): string {
  switch (event.kind) {
    case 'trivia-play':
    case 'question-stat':
      return 'trivia';
    case 'lesson-complete':
      return 'lecciones';
    case 'download':
      return event.collection;
  }
}

// ── Límites ──────────────────────────────────────────────────────────────
// Por IP y por elemento, por hora. Son ALTOS a propósito: un curso entero
// sale por la misma IP del colegio (40 alumnos jugando la misma trivia =
// 40 partidas y 40 × ~15 preguntas). Frenan el bucle desde la consola, no el
// uso real. Son estimaciones sin datos reales, y como el contador vive en la
// memoria de cada instancia es un freno de MEJOR ESFUERZO (alcanza para
// métricas de uso; no es una defensa fuerte).
const HOUR_MS = 60 * 60 * 1000;

export const TRACK_LIMITS: Record<TrackEvent['kind'], { max: number; windowMs: number }> = {
  'trivia-play': { max: 200, windowMs: HOUR_MS },
  'lesson-complete': { max: 200, windowMs: HOUR_MS },
  download: { max: 100, windowMs: HOUR_MS },
  'question-stat': { max: 3000, windowMs: HOUR_MS },
};

/** Regla del límite de `lib/rateLimit.ts` para este evento desde esta IP. */
export function limitRuleFor(event: TrackEvent, ip: string) {
  const { max, windowMs } = TRACK_LIMITS[event.kind];
  return { name: `track:${event.kind}`, key: `track:${event.kind}:${collectionFor(event)}:${event.id}:${ip}`, max, windowMs };
}
