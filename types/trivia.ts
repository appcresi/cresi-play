export interface Trivia {
  id: string
  created_at: string
  updated_at: string
  name: string
  author: string
  level?: number
  questions: TriviaQuestion[]
  user_id: string
  /** Organización externa que avaló/revisó el contenido de la trivia — por
   *  ejemplo, "Asociación Argentina de Alergia al Látex" para las trivias
   *  de látex. Opcional: la mayoría de las trivias no tienen una. */
  endorsedBy?: string
  /** Cuántas veces se mostró/erró cada pregunta, indexado por la posición
   *  de esa pregunta dentro de `questions` al momento de jugarla (como
   *  string porque así lo requiere Firestore para un path de map anidado).
   *  Se incrementa en el cliente al responder — no es un dato sensible ni
   *  explotable (a nadie le sirve falsearlo), así que no hace falta
   *  recalcularlo server-side como sí se hace con el % del certificado. */
  questionStats?: Record<string, { shown: number; wrong: number }>
}

export interface TriviaQuestion {
  question: string
  answer: string
  options: {
    first: string
    second: string
    third: string
  }
  resume: string
}

export interface TriviaAnsweredQuestion {
  question: string
  answer: string
  resume: string
  userAnswer: string
  isCorrect: boolean
}

export interface TriviaStatus {
  id: string
  /** Nombre de la trivia — se agregó para poder mostrarla en el perfil
   *  del alumno sin tener que volver a consultar Firestore. */
  name?: string
  percentage: number
  completed: boolean
}

export interface TriviaIndexFields {
  id: string
  name: string
  level?: number
  endorsedBy?: string
}