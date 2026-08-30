// types/tarea.ts
//
// Tareas: el docente asigna una consigna, opcionalmente ligada a una
// actividad puntual (una trivia, una infografía, una lección de Completa
// Palabras, o cualquier actividad del catálogo), con fecha de entrega y
// puntos. El alumno responde (texto libre y/o haciendo la actividad
// ligada) y el docente califica.

export type LinkedActivityType =
  | 'trivia'
  | 'buscador'
  | 'infografia'
  | 'completapalabras'
  | 'biopuzzle'
  | 'nube'
  | 'actividad'
  | 'libre'; // sin actividad ligada — solo la consigna de texto

export interface LinkedActivity {
  type: LinkedActivityType;
  /** ID de la trivia/infografía/lección/sistema de BioPuzzle puntual, código
   *  de la sesión de Nube de Palabras, o el id del catálogo
   *  (lib/activities.ts) si type === 'actividad'. Para 'biopuzzle', puede
   *  quedar vacío ("cualquier sistema, elige el alumno"). No aplica para
   *  'buscador' (no hay un ítem puntual) ni 'libre'. */
  id?: string;
  /** Nombre para mostrar, guardado en el momento de crear la tarea para
   *  no tener que volver a consultar la trivia/infografía cada vez que
   *  se muestra la tarea. */
  label?: string;
  /** @deprecated Reemplazado por `id` directamente para type ===
   *  'biopuzzle'. Se mantiene solo para no romper tareas viejas creadas
   *  cuando BioPuzzle vivía anidado dentro de type === 'actividad'. */
  subId?: string;
}

export interface Tarea {
  id: string;
  title: string;
  consigna: string;
  linkedActivity: LinkedActivity;
  points: number;
  dueDate: string; // ISO
  createdAt: string;
  /** Se actualiza en cada edición — para mostrar "última modificación". */
  updatedAt?: string;
  createdBy: string; // uid del docente
}

export type EntregaStatus = 'entregada' | 'calificada';

export interface Entrega {
  /** uid del alumno — es también el ID del documento. */
  studentUid: string;
  status: EntregaStatus;
  submittedAt: string;
  /** true si el alumno tocó "Marcar como hecho" para confirmar que hizo
   *  la actividad ligada (fase A/B: siempre es confirmación manual). */
  manuallyMarkedDone?: boolean;
  /** Respuesta de texto libre, si la tarea la admite/requiere. */
  responseText?: string;
  grade?: number;
  feedback?: string;
  gradedAt?: string;
}