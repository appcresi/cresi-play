import { type TriviaAnsweredQuestion } from '@/types/trivia'
import { Disclosure, Transition } from '@headlessui/react'
import { IconAlertCircle, IconArrowLeft, IconArrowRight, IconChevronDown, IconExternalLink } from '@tabler/icons-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useState } from 'react'
import { COMPLETION_PERCENTAGE } from '@/utils/constants'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Label renderer for pie chart

interface LabelRenderer {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent
}: LabelRenderer): JSX.Element => {
  const RADIAN = Math.PI / 180

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text
      x={x}
      y={y}
      fill='white'
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline='central'
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

interface TriviaReviewProps {
  score: number
  triviaName: string
  triviaLength: number
  answeredQuestions: TriviaAnsweredQuestion[]
}

export default function TriviaReview ({ score, triviaName, triviaLength, answeredQuestions }: TriviaReviewProps): JSX.Element {
  const COLORS: Record<string, string> = {
    'Respuestas correctas': '#10B981',
    'Respuestas incorrectas': '#EF4444'
  }

  const data = [
    { name: 'Respuestas correctas', value: score },
    { name: 'Respuestas incorrectas', value: triviaLength - score }
  ]

  const completionPercentage = Math.round((score / triviaLength) * 100)

  const isCompleted = isTriviaCompleted(score, triviaLength)

  return (
    <section className="p-8 lg:mx-auto lg:max-w-5xl">
      <div className="flex flex-wrap justify-center items-center gap-8 lg:justify-between">
        {/* Results Header */}
        <div className="flex flex-col gap-6 lg:max-w-[50%]">
          <div className="bg-yellow-200 p-6 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
            <h1 className="text-4xl font-bold mb-4">
              {isCompleted ? '¡COMPLETASTE LA TRIVIA!' : '¡SEGUÍ INTENTANDO!'}
            </h1>
            <p className="text-lg">
              {isCompleted 
                ? '¡Felicitaciones! Esto es fruto de tus ganas por seguir aprendiendo.' 
                : '¡No te rindas! El aprendizaje puede ser un proceso largo y tedioso, pero es igual de útil y gratificante.'}
            </p>
          </div>

          {isCompleted && <CertificatePreparation trivia={triviaName} percentage={completionPercentage} />}

          <Link 
            href="/trivias" 
            className="w-fit px-6 py-3 flex gap-2 items-center rounded-full font-bold bg-primary text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
          >
            <IconArrowLeft />
            Volver al menú
          </Link>
        </div>

        {/* Score Chart */}
        <div className="flex flex-col items-center p-6 bg-white rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
          <ResponsiveContainer width={240} height={240}>
            <PieChart>
              <Pie
                dataKey="value"
                labelLine={false}
                label={renderCustomizedLabel}
                data={data}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <p className="mt-4 font-bold text-lg">
            ¡Contestaste correctamente {score} de {triviaLength}!
          </p>
        </div>
      </div>

      {/* Answers Review */}
      <section className="mt-12">
        <h2 className="text-3xl font-bold mb-8 bg-blue-200 p-4 w-fit rounded-lg border-2 border-black transform -rotate-1">
          Tus respuestas
        </h2>

        <ul className="flex flex-col gap-6">
          {answeredQuestions.map((question, index) => (
            <li key={question.question}>
              <QuestionReview 
                index={index}
                question={question}
              />
            </li>
          ))}
        </ul>
      </section>
    </section>
  )
}

interface QuestionReviewProps {
  index: number
  question: TriviaAnsweredQuestion
}

function QuestionReview ({ index, question }: QuestionReviewProps): JSX.Element {
  return (
    <div className="p-6 flex flex-col gap-4 rounded-xl bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all">
      {/* Question */}
      <div className="bg-yellow-200 -m-2 p-4 rounded-lg border-2 border-black transform -rotate-1">
        <p className="text-xl font-bold comic-font">
          {index + 1}) {question.question}
        </p>
      </div>

      {/* Answer Result */}
      <div className={`p-4 rounded-lg border-2 border-black ${
        question.isCorrect 
          ? 'bg-green-200 transform rotate-1' 
          : 'bg-red-200 transform -rotate-1'
      }`}>
        <p className="font-bold">
          ¡{question.isCorrect ? '¡CORRECTO!' : '¡INCORRECTO!'} 
        </p>
        <p className="mt-2">
          Respondiste: <span className="font-bold">{question.userAnswer}</span>
        </p>
      </div>

      {/* Correct Answer & Contact */}
      <div className="flex flex-wrap gap-4 items-center">
        {!question.isCorrect && (
          <div className="bg-blue-200 p-3 rounded-lg border-2 border-black transform rotate-1">
            <p>
              La respuesta correcta es <span className="font-bold">{question.answer}</span>
            </p>
          </div>
        )}

        <div className="flex gap-2 items-center bg-purple-200 p-3 rounded-lg border-2 border-black transform -rotate-1">
          <p>¿Hubo una equivocación?</p>
          <a
            href={`https://cresi.com.ar/contacto/?question=${question.question}`}
            target="_blank"
            rel="noreferrer"
            className="flex gap-1 items-center text-red-700 hover:underline"
          >
            <p className="font-bold">¡Contactános!</p>
            <IconExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* More Info Section */}
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="w-full p-4 flex items-center justify-between rounded-lg bg-orange-200 border-2 border-black font-bold hover:bg-orange-300 transition-colors">
              <span className="flex gap-2 items-center">
                <IconAlertCircle className="h-5 w-5" />
                <p>¡Para saber más!</p>
              </span>
              <IconChevronDown
                className={`${open ? 'rotate-180 transform' : ''} transition duration-100`}
              />
            </Disclosure.Button>

            <Transition
              enter="transition duration-200 ease-out"
              enterFrom="transform translate-y-2 opacity-0"
              enterTo="transform translate-y-0 opacity-100"
              leave="transition duration-75 ease-out"
              leaveFrom="transform translate-y-0 opacity-100"
              leaveTo="transform translate-y-4 opacity-0"
            >
              <Disclosure.Panel className="p-4 bg-gray-100 rounded-lg border-2 border-black mt-2">
                {question.resume}
              </Disclosure.Panel>
            </Transition>
          </>
        )}
      </Disclosure>
    </div>
  )
}

interface CertificatePreparationProps {
  trivia: string
  percentage: number
}

function CertificatePreparation (props: CertificatePreparationProps): JSX.Element {
  const [name, setName] = useState<string>()
  const router = useRouter()

  const handleName = (e: React.ChangeEvent<HTMLInputElement>): void => { setName(e.target.value.trim()) }

  const handlePrepareCertificate = (): void => {
    fetch('/api/certificado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, trivia: props.trivia, percentage: props.percentage })
    })
      .then(async (response) => {
        await response.json().then((value) => {
          router.push(`/trivias/certificado?token=${String(value.token)}`)
        })
      })
      .catch((error) => { console.error(error) })
  }

  return (
    <div className="my-6 p-6 bg-purple-100 rounded-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
      <label className="flex flex-col gap-3 font-bold">
        ¡Ingresá tu nombre para descargar tu certificado! 🎓

        <input 
          onChange={handleName}
          className="w-fit p-3 bg-white rounded-lg border-2 border-black font-normal transform rotate-1 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          placeholder="Tu nombre aquí..."
        />
      </label>

      {(typeof name !== 'undefined' && name.length > 0) && (
        <button
          type="button"
          onClick={handlePrepareCertificate}
          className="mt-4 px-6 py-3 w-fit flex gap-2 items-center font-bold rounded-full bg-primary text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
        >
          Obtener certificado
          <IconArrowRight />
        </button>
      )}
    </div>
  )
}

const isTriviaCompleted = (score: number, totalQuestions: number): boolean => {
  const completionPercentage = Math.round((score / totalQuestions) * 100)
  return completionPercentage >= COMPLETION_PERCENTAGE
}
