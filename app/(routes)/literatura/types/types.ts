export interface Story {
    title: string;
    author: string;
    content: string[];
    description: string;
  }
  
  export interface ReadingProgress {
    percentage: number;
    lastPage: number;
  }