export type Lesson = {
    text: string;
    extraWords: string[];
  };
  
  export type GameLevel = {
    title: string;
    lecciones: Lesson[];
  };
  
  export type Word = {
    id: string;
    text: string;
    isCorrect: boolean;
  };
  
  export type Blank = {
    id: string;
    correctWord: string;
    filledWord?: string;
    filledWordId?: string;
  };


    

  
