import { TriviaAnsweredQuestion } from "@/types/trivia"
import { Disclosure, Transition } from "@headlessui/react"
import { IconAlertCircle, IconArrowLeft, IconArrowRight, IconChevronDown } from "@tabler/icons-react"
import Link from "next/link"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

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
  percent,
}: LabelRenderer) => {
  const RADIAN = Math.PI / 180;

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
	const x = cx + radius * Math.cos(-midAngle * RADIAN);
	const y = cy + radius * Math.sin(-midAngle * RADIAN);

	return (
		<text
			x={x}
			y={y}
			fill="white"
			textAnchor={x > cx ? "start" : "end"}
			dominantBaseline="central"
		>
			{`${(percent * 100).toFixed(0)}%`}
		</text>
	);
}

interface TriviaReviewProps {
  score: number,
	triviaLength: number,
  answeredQuestions: TriviaAnsweredQuestion[]
}

export default function TriviaReview({ score, triviaLength, answeredQuestions }: TriviaReviewProps): JSX.Element {
  const COLORS: Record<string, string> = {
    "Respuestas correctas": "#10B981",
		"Respuestas incorrectas": "#EF4444",
  }

  const data = [
    { name: "Respuestas correctas", value: score },
    { name: "Respuestas incorrectas", value: triviaLength - score },
  ]

  const isCompleted = isTriviaCompleted(score, triviaLength)

  return (
    <section className="p-4">
			<div className="flex flex-wrap justify-center items-center lg:justify-between">
				<span className="flex flex-col gap-4 lg:max-w-[50%]">
					<span>
						<h1 className="my-4 text-4xl font-bold">
							{isCompleted ? "¡Completaste la trivia!" : "¡Seguí intentando!"}
            </h1>

						<p className="max-w-[48ch] text-lg text-gray-600">
							{isCompleted
								? "¡Felicitaciones! esto es fruto de tus ganas por seguir aprendiendo."
								: "¡No te rindas! el aprendizaje puede ser un proceso largo y tedioso, pero es igual de útil y gratificante."}
						</p>
					</span>

					<Link href="/trivias" className="w-fit px-4 py-2 flex gap-2 items-center rounded-full font-semibold bg-primary text-white">
						<IconArrowLeft />
						Volver al menú
					</Link>
				</span>

				<div className="flex flex-col items-center text-center">
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

					<p className="my-6 text-gray-600">
						Contestaste correctamente {score} preguntas sobre {triviaLength}{" "}
						en total.
					</p>
				</div>
			</div>

			<section className="my-8">
				<h2 className="my-6 text-2xl font-bold">Tus respuestas</h2>

				<ul className="flex flex-col gap-4">
					{answeredQuestions.map((question, index) => (
						<li key={question.question}>
							<QuestionReview
								key={question.question}
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
	index: number;
	question: TriviaAnsweredQuestion;
}

function QuestionReview({ index, question }: QuestionReviewProps): JSX.Element {
	return (
		<div className="p-4 flex flex-col gap-4 rounded-lg shadow-lg bg-gray-100">
			<p className="text-lg font-semibold">
				{index + 1}) {question.question}
			</p>
			<p
				className={`p-2 rounded-lg text-white ${
					question.isCorrect ? "bg-green-700" : "bg-red-600"
				}`}
			>
				Respondiste: <b>{question.userAnswer}</b>
			</p>

			<span className="flex flex-wrap gap-2 items-center">
				{!question.isCorrect && <p>La respuesta correcta es <b>{question.answer}</b></p> }

				<p className="flex gap-2 items-center">
					¿Hubo una equivocación?
					<Link
						href={`/contacto/?question=${question.question}`}
						className="flex gap-1 items-center text-red-700"
					>
						<p>Contactános</p>
						<IconArrowRight />
					</Link>
				</p>
			</span>

			<Disclosure>
				{({ open }) => (
					<>
						<Disclosure.Button className="w-full p-2 flex items-center justify-between rounded-lg bg-primary-light text-primary-dark">
							<span className="flex gap-2 items-center">
								<IconAlertCircle />
								<p>¡Para saber más!</p>
							</span>

							<IconChevronDown
								className={`${
									open ? "rotate-180 transform" : ""
								} transition duration-100`}
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
							<Disclosure.Panel className="p-2 text-gray-700">
								{question.resume}
							</Disclosure.Panel>
						</Transition>
					</>
				)}
			</Disclosure>
		</div>
	);
}

const isTriviaCompleted = (score: number, totalQuestions: number): boolean => {
  const DEFAULT_COMPLETION_PERCENTAGE = 80
  const completionPercentage = Math.round((score / totalQuestions) * 100)
  return completionPercentage >= DEFAULT_COMPLETION_PERCENTAGE
}