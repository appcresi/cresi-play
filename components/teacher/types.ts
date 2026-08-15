export type AddStudentTab = 'individual' | 'masiva';
export type DetailTab = 'tablon' | 'trabajo' | 'personas' | 'calificaciones';

export interface TeacherTriviaOption {
  id: string;
  name: string;
  questionCount: number;
  /** true = la creó el docente; false = viene del catálogo de CrESI. */
  isOwn: boolean;
}

export interface TeacherCompletaPalabrasOption {
  id: string;
  title: string;
  leccionesCount: number;
  /** true = la creó el docente; false = viene del catálogo de CrESI. */
  isOwn: boolean;
}