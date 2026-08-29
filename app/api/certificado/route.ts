import { decodeJwt, signJwt } from '@/utils/jwt'
import { getAdminApp } from '@/lib/firebaseAdmin'
import { getFirestore } from 'firebase-admin/firestore'
import { type NextRequest, NextResponse } from 'next/server'

interface AnsweredQuestionInput {
  question: string
  userAnswer: string
}

export async function GET (request: NextRequest): Promise<NextResponse<unknown>> {
  const token = request.headers.get('Authorization')

  if (token === null) {
    return NextResponse.json({ error: 'MISSING_TOKEN' }, { status: 401 })
  }

  const decoded = decodeJwt(token)

  return NextResponse.json(decoded)
}

// El % del certificado NUNCA se toma de lo que manda el cliente (sería
// trivial de falsificar con una llamada directa a este endpoint). En vez de
// eso, recibimos qué respondió en cada pregunta y lo recalculamos acá contra
// las respuestas correctas reales guardadas en `trivia/{id}` — así funciona
// tanto para alumnos logueados como para visitantes anónimos jugando la
// trivia pública, sin depender de que exista una sesión de Firebase Auth.
export async function POST (request: NextRequest): Promise<NextResponse<unknown>> {
  const requestBody = await request.json()
  const { name, triviaId, answeredQuestions } = requestBody as {
    name?: unknown
    triviaId?: unknown
    answeredQuestions?: unknown
  }

  if (
    typeof name !== 'string' || name.trim().length === 0 ||
    typeof triviaId !== 'string' || triviaId.trim().length === 0 ||
    !Array.isArray(answeredQuestions)
  ) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const app = getAdminApp()
  const db = getFirestore(app)
  const triviaSnap = await db.collection('trivia').doc(triviaId).get()

  if (!triviaSnap.exists) {
    return NextResponse.json({ error: 'TRIVIA_NOT_FOUND' }, { status: 404 })
  }

  const trivia = triviaSnap.data() as { name: string, questions: Array<{ question: string, answer: string }>, endorsedBy?: string }
  const totalQuestions = trivia.questions.length

  const correctAnswerByQuestion = new Map(trivia.questions.map((q) => [q.question, q.answer]))
  const alreadyCounted = new Set<string>()
  let correctCount = 0

  for (const item of answeredQuestions as AnsweredQuestionInput[]) {
    const question = item?.question
    const userAnswer = item?.userAnswer
    if (typeof question !== 'string' || typeof userAnswer !== 'string') continue
    if (alreadyCounted.has(question)) continue
    if (!correctAnswerByQuestion.has(question)) continue

    alreadyCounted.add(question)
    if (correctAnswerByQuestion.get(question) === userAnswer) {
      correctCount += 1
    }
  }

  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  const jwt = signJwt({
    name: name.trim().slice(0, 100),
    trivia: trivia.name,
    percentage,
    ...(trivia.endorsedBy ? { endorsedBy: trivia.endorsedBy } : {})
  })

  return NextResponse.json({
    token: jwt
  })
}
