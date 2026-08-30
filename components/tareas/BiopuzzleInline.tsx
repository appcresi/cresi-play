'use client';

import { bodySystems } from '@/app/(routes)/biopuzzle/data/bodySystems';
import { BiopuzzleGame } from '@/app/(routes)/biopuzzle/components/BiopuzzleGame';

/**
 * Versión embebida de BioPuzzle, para jugar dentro de una tarea sin
 * mandar al alumno a otra página — mismo juego que /biopuzzle, sin el
 * GameStatusBar fijo ni el layout de página completa. Si la tarea ligó
 * un sistema puntual, el juego queda fijo en ese ("locked"); si no
 * (`systemId` vacío, "Cualquiera" en CreateTareaScreen.tsx), el alumno
 * puede navegar entre todos como en la página completa.
 */
export const BiopuzzleInline = ({
  systemId,
  awardPoints = false,
  onComplete,
}: {
  systemId?: string;
  awardPoints?: boolean;
  onComplete?: () => void;
}) => {
  const idx = systemId ? bodySystems.findIndex((s) => s.id === systemId) : -1;
  const initialSystemIndex = idx >= 0 ? idx : 0;
  const locked = idx >= 0;

  return (
    <BiopuzzleGame
      initialSystemIndex={initialSystemIndex}
      locked={locked}
      showChrome={false}
      awardPoints={awardPoints}
      onComplete={onComplete}
    />
  );
};
