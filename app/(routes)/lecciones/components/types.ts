export type Question = {
    question: string;
    correctAnswer: boolean;
    userAnswer?: boolean; // Make userAnswer optional
  };

// `imagen` es opcional a propósito: las lecciones de CrESI originales
// tienen una por cada parte, pero lecciones nuevas (o las que arme un
// docente en el futuro) no están obligadas a tener una.
export interface Leccion {
  text: string;
  questions: Question[];
  imagen?: string;
}

export interface Lesson {
  id: string;
  title: string;
  author: 'CRESI' | string;
  lecciones: Leccion[];
}