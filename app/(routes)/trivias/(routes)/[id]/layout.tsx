import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aprendé jugando con nuestras trivias | CrESI',
  description: 'Jugá a nuestras trivias y aprendé sobre distintos temas con una trivia interactiva y dinámica de preguntas y respuestas.'
}

export default function TriviaLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return children as JSX.Element
}
