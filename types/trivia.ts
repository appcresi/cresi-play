export interface Trivia {
  id: string
  created_at: string
  updated_at: string
  name: string
  author: string
  level?: number
  questions: TriviaQuestion[]
  user_id: string
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
  percentage: number
  completed: boolean
}

export interface TriviaIndexFields {
  id: string
  name: string
  level?: number
}
