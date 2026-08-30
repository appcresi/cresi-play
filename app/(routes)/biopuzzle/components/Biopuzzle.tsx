"use client";

import { useSearchParams } from 'next/navigation';
import { bodySystems } from '../data/bodySystems';
import { BiopuzzleGame } from './BiopuzzleGame';

export default function AnatomiaApp() {
  // Si una tarea liga a un desafío puntual de BioPuzzle (ver
  // CreateTareaScreen.tsx), llega acá como ?sistema=<id> y arrancamos
  // directo en ese sistema en vez del primero — el alumno sigue pudiendo
  // navegar libremente al resto con las flechas, esto solo fija el punto
  // de entrada.
  const searchParams = useSearchParams();
  const requestedSystemId = searchParams.get('sistema');
  const idx = bodySystems.findIndex((s) => s.id === requestedSystemId);
  const initialSystemIndex = idx >= 0 ? idx : 0;

  return <BiopuzzleGame initialSystemIndex={initialSystemIndex} />;
}
