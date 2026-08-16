import { type TriviaAnsweredQuestion } from '@/types/trivia'
import { Disclosure, Transition } from '@headlessui/react'
import { IconArrowLeft, IconArrowRight, IconChevronDown, IconExternalLink, IconTrophy, IconCircleCheck, IconCircleX, IconInfoCircle } from '@tabler/icons-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useState } from 'react'
import { COMPLETION_PERCENTAGE } from '@/utils/constants'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getActivityById } from '@/lib/activities'

const ACCENT = getActivityById('trivias')?.color ?? '#1976D2'

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
  triviaId: string
  correctAnswers: number
  triviaName: string
  triviaLength: number
  answeredQuestions: TriviaAnsweredQuestion[]
}


export default function TriviaReview ({ triviaId, correctAnswers, triviaName, triviaLength, answeredQuestions }: TriviaReviewProps): JSX.Element {
  const COLORS: Record<string, string> = {
    'Respuestas correctas': '#10B981',
    'Respuestas incorrectas': '#EF4444'
  }

  const data = [
    { name: 'Respuestas correctas', value: correctAnswers },
    { name: 'Respuestas incorrectas', value: triviaLength - correctAnswers }
  ]

  const completionPercentage = Math.round((correctAnswers / triviaLength) * 100)

  const isCompleted = isTriviaCompleted(correctAnswers, triviaLength)

  return (
    <section className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Results Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-4 ${
              isCompleted 
                ? 'bg-green-100 text-green-700' 
                : 'bg-orange-100 text-orange-700'
            }`}>
              <IconTrophy size={16} />
              <span>{isCompleted ? 'Trivia Completada' : 'Sigue Practicando'}</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {isCompleted ? '¡Excelente Trabajo!' : '¡Buen Intento!'}
            </h1>

            <p className="text-gray-600 mb-6">
              {isCompleted 
                ? 'Has demostrado un gran dominio del tema. ¡Felicitaciones por tu dedicación!' 
                : 'El aprendizaje es un proceso continuo. Sigue practicando y mejorarás.'}
            </p>

            {isCompleted && <CertificatePreparation triviaId={triviaId} answeredQuestions={answeredQuestions} />}

            <Link
              href="/trivias"
              className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-full font-semibold hover:opacity-90 transition-colors"
              style={{ backgroundColor: ACCENT }}
            >
              <IconArrowLeft size={20} />
              Volver al menú
            </Link>
          </div>

          {/* Score Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tu Puntuación</h2>

            <div className="flex flex-col items-center">
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

              <div className="mt-6 text-center">
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {completionPercentage}%
                </p>
                <p className="text-gray-600">
                  {correctAnswers} de {triviaLength} correctas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Answers Review Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Revisión de Respuestas
          </h2>

          <div className="space-y-4">
            {answeredQuestions.map((question, index) => (
              <QuestionReview
                key={question.question}
                index={index}
                question={question}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

interface QuestionReviewProps {
  index: number
  question: TriviaAnsweredQuestion
}

function QuestionReview ({ index, question }: QuestionReviewProps): JSX.Element {
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 transition-colors">
      {/* Question Header */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            question.isCorrect 
              ? 'bg-green-100 text-green-600' 
              : 'bg-red-100 text-red-600'
          }`}>
            {question.isCorrect ? (
              <IconCircleCheck size={20} />
            ) : (
              <IconCircleX size={20} />
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Pregunta {index + 1}</p>
            <p className="text-base font-medium text-gray-900">
              {question.question}
            </p>
          </div>
        </div>
      </div>

      {/* Answer Content */}
      <div className="p-4 space-y-3">
        {/* User Answer */}
        <div className={`p-3 rounded-lg border ${
          question.isCorrect 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <p className="text-xs font-medium text-gray-600 mb-1">Tu respuesta</p>
          <p className={`text-sm font-medium ${
            question.isCorrect ? 'text-green-700' : 'text-red-700'
          }`}>
            {question.userAnswer}
          </p>
        </div>

        {/* Correct Answer (if wrong) */}
        {!question.isCorrect && (
          <div className="p-3 rounded-lg border" style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}30` }}>
            <p className="text-xs font-medium text-gray-600 mb-1">Respuesta correcta</p>
            <p className="text-sm font-medium" style={{ color: ACCENT }}>
              {question.answer}
            </p>
          </div>
        )}

        {/* Contact Link */}
        <div className="flex items-center justify-between pt-2">
          <a
            href={`https://cresi.com.ar/contacto/?question=${question.question}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-gray-600 flex items-center gap-1 transition-colors"
            onMouseEnter={(e) => { e.currentTarget.style.color = ACCENT; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
          >
            ¿Encontraste un error?
            <IconExternalLink size={14} />
          </a>
        </div>

        {/* More Info Disclosure */}
        <Disclosure>
          {({ open }) => (
            <div className="pt-2">
              <Disclosure.Button className="w-full p-3 flex items-center justify-between rounded-lg bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 transition-colors">
                <span className="flex gap-2 items-center text-sm font-medium">
                  <IconInfoCircle size={16} />
                  <p>Más información</p>
                </span>
                <IconChevronDown
                  size={16}
                  className={`${open ? 'rotate-180' : ''} transition-transform duration-200`}
                />
              </Disclosure.Button>

              <Transition
                enter="transition duration-200 ease-out"
                enterFrom="transform -translate-y-2 opacity-0"
                enterTo="transform translate-y-0 opacity-100"
                leave="transition duration-150 ease-out"
                leaveFrom="transform translate-y-0 opacity-100"
                leaveTo="transform -translate-y-2 opacity-0"
              >
                <Disclosure.Panel className="p-4 mt-2 bg-white rounded-lg border border-gray-200 text-sm text-gray-700 leading-relaxed">
                  {question.resume}
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      </div>
    </div>
  )
}

interface CertificatePreparationProps {
  triviaId: string
  answeredQuestions: TriviaAnsweredQuestion[]
}

function CertificatePreparation (props: CertificatePreparationProps): JSX.Element {
  const [name, setName] = useState<string>()
  const router = useRouter()

  const handleName = (e: React.ChangeEvent<HTMLInputElement>): void => { setName(e.target.value.trim()) }

  const handlePrepareCertificate = (): void => {
    fetch('/api/certificado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        triviaId: props.triviaId,
        // El servidor recalcula el % real contra `trivia/{id}` en Firestore
        // a partir de esto — nunca confía en un porcentaje ya calculado.
        answeredQuestions: props.answeredQuestions.map((q) => ({ question: q.question, userAnswer: q.userAnswer }))
      })
    })
      .then(async (response) => {
        await response.json().then((value) => {
          router.push(`/trivias/certificado?token=${String(value.token)}`)
        })
      })
      .catch((error) => { console.error(error) })
  }

  return (
    <div className="mb-6 p-4 rounded-xl border" style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}30` }}>
      <label className="flex flex-col gap-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <IconTrophy size={18} style={{ color: ACCENT }} />
          Obtén tu certificado de finalización
        </span>

        <input
          onChange={handleName}
          className="px-4 py-2 bg-white rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all"
          style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
          placeholder="Ingresa tu nombre completo"
        />
      </label>

      {(typeof name !== 'undefined' && name.length > 0) && (
        <button
          type="button"
          onClick={handlePrepareCertificate}
          className="mt-3 px-5 py-2 flex items-center gap-2 font-semibold text-sm rounded-full text-white hover:opacity-90 transition-colors"
          style={{ backgroundColor: ACCENT }}
        >
          Descargar certificado
          <IconArrowRight size={18} />
        </button>
      )}
    </div>
  )
}

const isTriviaCompleted = (score: number, totalQuestions: number): boolean => {
  const completionPercentage = Math.round((score / totalQuestions) * 100)
  return completionPercentage >= COMPLETION_PERCENTAGE
}