import { decodeJwt, signJwt } from '@/utils/jwt'
import { getAdminApp } from '@/lib/firebaseAdmin'
import { getFirestore } from 'firebase-admin/firestore'
import { type NextRequest, NextResponse } from 'next/server'
import { stories } from '@/app/(routes)/literatura/data/stories'

interface AnsweredQuestionInput {
  question: string
  userAnswer: string | boolean
}

export async function GET (request: NextRequest): Promise<NextResponse<unknown>> {
  const token = request.headers.get('Authorization')

  if (token === null) {
    return NextResponse.json({ error: 'MISSING_TOKEN' }, { status: 401 })
  }

  const decoded = decodeJwt(token)

  return NextResponse.json(decoded)
}

function countCorrectAnswers (
  answeredQuestions: unknown,
  correctAnswerByQuestion: Map<string, string | boolean>
): { correctCount: number, totalQuestions: number } {
  const alreadyCounted = new Set<string>()
  let correctCount = 0

  if (Array.isArray(answeredQuestions)) {
    for (const item of answeredQuestions as AnsweredQuestionInput[]) {
      const question = item?.question
      const userAnswer = item?.userAnswer
      if (typeof question !== 'string') continue
      if (typeof userAnswer !== 'string' && typeof userAnswer !== 'boolean') continue
      if (alreadyCounted.has(question)) continue
      if (!correctAnswerByQuestion.has(question)) continue

      alreadyCounted.add(question)
      if (correctAnswerByQuestion.get(question) === userAnswer) {
        correctCount += 1
      }
    }
  }

  return { correctCount, totalQuestions: correctAnswerByQuestion.size }
}

// El % del certificado NUNCA se toma de lo que manda el cliente (sería
// trivial de falsificar con una llamada directa a este endpoint). En vez de
// eso, para trivias y lecciones recibimos qué respondió en cada pregunta y
// lo recalculamos acá contra las respuestas correctas reales guardadas en
// Firestore — así funciona tanto para alumnos logueados como para
// visitantes anónimos, sin depender de que exista una sesión de Firebase
// Auth. Para cuentos no hay nada que "acertar" (es solo lectura), así que
// alcanza con confirmar que el cuento exista.
export async function POST (request: NextRequest): Promise<NextResponse<unknown>> {
  const requestBody = await request.json()
  const { name, kind, triviaId, lessonId, storyTitle, answeredQuestions } = requestBody as {
    name?: unknown
    kind?: unknown
    triviaId?: unknown
    lessonId?: unknown
    storyTitle?: unknown
    answeredQuestions?: unknown
  }

  if (typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }
  const trimmedName = name.trim().slice(0, 100)

  const app = getAdminApp()
  const db = getFirestore(app)

  if (kind === 'leccion') {
    if (typeof lessonId !== 'string' || lessonId.trim().length === 0) {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
    }

    const lessonSnap = await db.collection('lecciones').doc(lessonId).get()
    if (!lessonSnap.exists) {
      return NextResponse.json({ error: 'LESSON_NOT_FOUND' }, { status: 404 })
    }

    const lesson = lessonSnap.data() as { title: string, lecciones: Array<{ questions: Array<{ question: string, correctAnswer: boolean }> }> }
    const allQuestions = lesson.lecciones.flatMap((leccion) => leccion.questions)
    const correctAnswerByQuestion = new Map<string, string | boolean>(allQuestions.map((q) => [q.question, q.correctAnswer]))

    const { correctCount, totalQuestions } = countCorrectAnswers(answeredQuestions, correctAnswerByQuestion)
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

    const jwt = signJwt({ name: trimmedName, kind: 'leccion', title: lesson.title, percentage })
    return NextResponse.json({ token: jwt })
  }

  if (kind === 'cuento') {
    if (typeof storyTitle !== 'string' || storyTitle.trim().length === 0) {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
    }

    const story = stories.find((s) => s.title === storyTitle)
    if (story === undefined) {
      return NextResponse.json({ error: 'STORY_NOT_FOUND' }, { status: 404 })
    }

    const jwt = signJwt({ name: trimmedName, kind: 'cuento', title: story.title })
    return NextResponse.json({ token: jwt })
  }

  // Default / kind === 'trivia': se mantiene sin exigir el campo `kind`
  // para no romper nada si algún cliente viejo todavía no lo manda.
  if (typeof triviaId !== 'string' || triviaId.trim().length === 0 || !Array.isArray(answeredQuestions)) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }

  const triviaSnap = await db.collection('trivia').doc(triviaId).get()
  if (!triviaSnap.exists) {
    return NextResponse.json({ error: 'TRIVIA_NOT_FOUND' }, { status: 404 })
  }

  const trivia = triviaSnap.data() as { name: string, questions: Array<{ question: string, answer: string }>, endorsedBy?: string }
  const correctAnswerByQuestion = new Map<string, string | boolean>(trivia.questions.map((q) => [q.question, q.answer]))
  const { correctCount, totalQuestions } = countCorrectAnswers(answeredQuestions, correctAnswerByQuestion)
  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0

  const jwt = signJwt({
    name: trimmedName,
    kind: 'trivia',
    title: trivia.name,
    percentage,
    ...(trivia.endorsedBy ? { endorsedBy: trivia.endorsedBy } : {})
  })

  return NextResponse.json({ token: jwt })
}
