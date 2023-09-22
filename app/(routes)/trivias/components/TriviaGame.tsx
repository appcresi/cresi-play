'use client'

import { type TriviaAnsweredQuestion, type TriviaQuestion, type TriviaStatus } from '@/types/trivia'
import { useCallback, useEffect, useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { getSettings, getTriviaStatus, saveTriviaStatus } from '@/utils/trivia'
import { DEFAULT_TIME_IN_SECONDS } from '@/utils/constants'
import TriviaReview from './TriviaReview'

const OPTION_COLORS: Record<number, string> = {
  0: 'bg-red-300',
  1: 'bg-blue-300',
  2: 'bg-yellow-300',
  3: 'bg-green-300'
}

interface TriviaGameProps {
  id: string
  name: string
  items: Array<{ question: TriviaQuestion, options: string[] }>
}

export default function TriviaGame ({ id, name, items }: TriviaGameProps): JSX.Element {
  const [isFinished, setIsFinished] = useState<boolean>(false)
  const [currentQuestion, setCurrentQuestion] = useState<number>(0)
  const [score, setScore] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<number | undefined>(() => getSettings()?.time ?? DEFAULT_TIME_IN_SECONDS)
  const [answeredQuestions, setAnsweredQuestions] = useState<TriviaAnsweredQuestion[]>([])

  const settings = getSettings()

  const handleTimeLeft = useCallback(
    () => { setTimeLeft(settings?.time ?? DEFAULT_TIME_IN_SECONDS) },
    [settings]
  )

  const handleContinue = useCallback(() => {
    handleTimeLeft()

    if (currentQuestion === items.length - 1) {
      setIsFinished(true)
    } else {
      setCurrentQuestion(currentQuestion + 1)
    }
  }, [currentQuestion])

  const handleAnswer = useCallback(
    (answer: string) => {
      setTimeLeft(undefined)

      if (answer === items[currentQuestion].question.answer) {
        setScore(score + 1)
        toast.success('¡Respuesta correcta!', { duration: 1000 })
      } else {
        toast.error('¡Respuesta incorrecta!', { duration: 1000 })
      }

      setTimeout(() => { handleContinue() }, 1000)

      setAnsweredQuestions([
        ...answeredQuestions,
        {
          question: items[currentQuestion].question.question,
          answer: items[currentQuestion].question.answer,
          resume: items[currentQuestion].question.resume,
          isCorrect: answer === items[currentQuestion].question.answer,
          userAnswer: answer
        }
      ])
    },
    [currentQuestion, answeredQuestions]
  )

  const handleFinish = useCallback(() => {
    const status = getTriviaStatus(id)

    const actualPercentage = Math.round((score / items.length) * 100)

    const higherPercentage = typeof status !== 'undefined' && status.percentage > actualPercentage ? status.percentage : actualPercentage

    const updatedTrivia: TriviaStatus = {
      id: status?.id ?? id,
      percentage: higherPercentage,
      completed: higherPercentage >= 80
    }

    saveTriviaStatus(updatedTrivia)

    toast.success('Se guardó tu progreso.')
  }, [isFinished])

  useEffect(() => {
    if (!isFinished) {
      if (typeof timeLeft === 'undefined') return

      if (timeLeft === 0) {
        toast('¡Se acabó el tiempo!', { duration: 2000, icon: '⏰' })

        setTimeout(() => { handleContinue() }, 2000)
      } else if (timeLeft > 0) {
        const interval = setInterval(
          () => { setTimeLeft((current) => Number(current) - 1) },
          1000
        )

        return () => {
          clearInterval(interval)
        }
      }
    }
  }, [timeLeft, isFinished, handleContinue])

  if (isFinished) {
    handleFinish()

    return (
      <>
        <Toaster />

        <TriviaReview
          score={score}
          triviaName={name}
          triviaLength={items.length}
          answeredQuestions={answeredQuestions}
        />
      </>
    )
  }

  return (
    <>
      <main className='px-4 min-h-screen flex flex-col justify-evenly bg-primary-light lg:gap-12 lg:justify-center'>
        <span className='py-4 flex gap-2 justify-center items-center'>
          <h1 className='text-lg font-bold'>{name}</h1>
          <h2 className='text-gray-600'>{items.length} preguntas</h2>
        </span>

        <div className='flex flex-col gap-2 items-center lg:w-64 lg:mx-auto'>
          <p className='font-medium'>Tiempo restante</p>

          <div className='w-full h-2 rounded-full bg-gray-300'>
            {(timeLeft !== undefined && timeLeft > 0) && <div style={{ animation: `timeProgress ${settings?.time ?? DEFAULT_TIME_IN_SECONDS}s linear forwards` }} className='w-full bg-primary h-2 rounded-full' />}
          </div>
        </div>

        <span className='lg:mx-auto lg:min-w-[16em] lg:max-w-2xl'>
          <p className='my-2 text-gray-600 lg:text-xl'>Pregunta {currentQuestion + 1}</p>
          <p className='my-4 text-xl font-semibold lg:text-2xl'>{items[currentQuestion].question.question}</p>
          <div className='flex flex-col gap-2 justify-center lg:min-w-full lg:grid lg:grid-cols-2'>
            {items[currentQuestion].options.map((option, index) => (
              <button
                type='button'
                key={option}
                aria-details={`Opción ${index}: ${option}`}
                disabled={timeLeft === 0 || timeLeft === undefined}
                onClick={() => { handleAnswer(option) }}
                className={`w-full py-2 px-4 rounded-md ${OPTION_COLORS[index]} lg:min-h-[6em] lg:min-w-[12em] disabled:bg-gray-300 disabled:text-gray-800`}
              >
                {option}
              </button>
            ))}
          </div>
        </span>
      </main>

      <Toaster />
    </>
  )
}
