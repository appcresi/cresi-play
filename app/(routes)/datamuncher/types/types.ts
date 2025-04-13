export type Position = {
    x: number;
    y: number;
  };
  
  export type Question = {
    question: string;
    answer: boolean;
    points: number;
    index?: number;
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
  usedQuestions?: Question[]; // Add this line
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

  export type GameStatusProps = {
    title: string;
    score: number;
    lives: number;
    level: number;
    timeLeft: number;
    questionsToLevelUp: number;
    correctAnswers: number;
  };