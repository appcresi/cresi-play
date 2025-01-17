export type Position = {
    x: number;
    y: number;
  };
  
  export type Question = {
    question: string;
    answer: boolean;
    points: number;
  };
  
  export type Level = {
    id: number;
    background: string;
    boardBackground: string;
    ghostSpeed: number;
    quizRequired: number;
    timeLimit: number;
    questions: Question[];
    walls: number[][];
  };
  
  export type Effect = {
    text: string;
    x: number;
    y: number;
  };

  export type AnswerOption = {
    position: Position;
    value: boolean;
  };