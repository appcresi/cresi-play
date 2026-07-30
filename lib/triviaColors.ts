/**
 * Color determinístico por trivia, a partir de su ID. Se usa tanto en el
 * panel del docente (selector de trivias visibles, resumen del Tablón)
 * como en la tarjeta que ve el alumno — así la misma trivia se ve del
 * mismo color en los dos lugares. Antes había dos implementaciones
 * separadas con paletas y algoritmos de hash distintos, así que la misma
 * trivia terminaba con un color para el docente y otro para el alumno.
 */
export const TRIVIA_COLORS = [
  '#1976D2', // Azul
  '#388E3C', // Verde
  '#F57C00', // Naranja
  '#7B1FA2', // Púrpura
  '#D32F2F', // Rojo
  '#0288D1', // Cian
  '#689F38', // Verde lima
  '#E64A19', // Naranja oscuro
  '#5D4037', // Marrón
  '#C2185B', // Rosa
];

export function colorForTrivia(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorIndex = Math.abs(hash) % TRIVIA_COLORS.length;
  return TRIVIA_COLORS[colorIndex];
}