// types/liveTrivia.ts
//
// Trivia en vivo (estilo Kahoot): el/la docente elige una de sus trivias y
// arranca una partida con código de sala — los alumnos entran desde el
// celular sin cuenta, todos ven la misma pregunta al mismo tiempo, y quien
// contesta bien y más rápido saca más puntos. Mismo espíritu de "sala con
// código, sin login" que Nube de Palabras (ver lib/wordCloudService.ts),
// pero con fases (lobby → pregunta → revelar → ranking) y puntaje.

export type LiveTriviaPhase = 'lobby' | 'question' | 'reveal' | 'leaderboard' | 'finished';

export interface LiveTriviaQuestion {
  question: string;
  /** Las 4 opciones YA mezcladas para esta partida — todos los jugadores
   *  ven el mismo orden, así el índice elegido es comparable entre todos. */
  options: string[];
  correctIndex: number;
  resume: string;
}

export interface LiveTriviaSession {
  code: string;
  teacherId: string;
  triviaId: string;
  triviaName: string;
  questions: LiveTriviaQuestion[];
  phase: LiveTriviaPhase;
  currentQuestionIndex: number;
  /** ISO — momento en que arrancó la pregunta actual, para el conteo
   *  regresivo y el cálculo de puntos por velocidad. `null` fuera de la
   *  fase 'question'. */
  questionStartedAt: string | null;
  createdAt: string;
}

export interface LiveTriviaPlayer {
  id: string;
  name: string;
  score: number;
  joinedAt: string;
}

export interface LiveTriviaAnswer {
  id: string;
  playerId: string;
  questionIndex: number;
  optionIndex: number;
  correct: boolean;
  pointsEarned: number;
  answeredAt: string;
}
