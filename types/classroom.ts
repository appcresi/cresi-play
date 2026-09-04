// types/classroom.ts
//
// Tipos relacionados a clases y alumnos-en-una-clase. Antes vivían mezclados
// dentro de lib/classroomService.ts junto con la lógica de Firestore; los
// separamos acá siguiendo la misma convención que types/user.ts, para que
// cualquier componente pueda importar los tipos sin arrastrar el código de
// acceso a datos.
import type { Character } from '@/types/user';

export interface Classroom {
  id: string;
  name: string;
  teacherId: string;
  code: string;
  createdAt: string;
  studentCount?: number;
  pendingCount?: number;
  /** IDs de actividades habilitadas para esta clase. `null` = sin restricción (todas visibles). */
  allowedActivities: string[] | null;
  /** IDs de trivias del docente visibles en esta clase. `null` = sin restricción (todas las del docente). */
  visibleTrivias: string[] | null;
  /** IDs de lecciones de Completa Palabras (CrESI + propias del docente) visibles en esta clase. `null` = sin restricción (todas). */
  visibleCompletaPalabras: string[] | null;
  /** Etiquetas (tag) del banco de preguntas bloqueadas enteras para esta clase. `null` = sin restricción. */
  restrictedTags: string[] | null;
  /** IDs de preguntas puntuales bloqueadas, aunque su etiqueta esté permitida. `null` = ninguna. */
  restrictedQuestionIds: string[] | null;
  /** IDs de infografías bloqueadas para esta clase. `null` = ninguna bloqueada (todas visibles). */
  restrictedInfografias: string[] | null;
  /** Color de banner asignado al crear la clase (estilo Google Classroom). */
  color: string;
  /** Si está en true, además de código+usuario/contraseña, un alumno puede
   *  unirse a esta clase con su propia cuenta de Google. Apagado por
   *  default: entrar con una cuenta de Gmail real (en vez del usuario
   *  pseudónimo que asigna el docente) es una decisión que el docente
   *  tiene que tomar a propósito, sobre todo para primaria. */
  allowGoogleSignIn: boolean;
}

export interface StudentProgress {
  totalScore: number;
  streak: number;
  completedCount: number;
  completedActivities: string[];
  activityScores: Record<string, number>;
  lastActive: string | null;
}

export interface ClassroomStudent {
  uid: string;
  username: string;
  character: Character;
  joinedAt: string;
  addedManually?: boolean;
  /** Referencia al registro en estudiantesPendientes que originó este alumno
   * (si se unió con usuario/contraseña asignados por el docente). Permite
   * encontrar/editar sus credenciales después de que ya inició sesión. */
  pendingId?: string;
  progress?: StudentProgress;
}

export interface PendingStudent {
  id: string;
  username: string;
  password: string;
  claimed: boolean;
  createdAt: string;
}