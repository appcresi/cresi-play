'use client';

import WordDragGame from '@/app/(routes)/completapalabras/components/WordDragGame';

/**
 * Versión embebida de una lección de Completa Palabras, para jugar dentro
 * de una tarea sin mandar al alumno a otra página — mismo juego que
 * /completapalabras, sin el GameStatusBar fijo ni el layout de página
 * completa.
 */
export const CompletaPalabrasInline = ({ lessonId }: { lessonId: string }) => (
  <WordDragGame lessonId={lessonId} showChrome={false} />
);
