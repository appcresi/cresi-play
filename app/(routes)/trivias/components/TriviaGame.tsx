"use client";

import { Trivia, TriviaAnsweredQuestion, TriviaQuestion } from "@/types/trivia";
import { sortArrayRandomly } from "@/utils/array";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getSettings } from "@/utils/trivia";

const DEFAULT_TIME = 60;

const OPTION_COLORS: Record<number, string> = {
	0: "bg-red-300",
	1: "bg-blue-300",
	2: "bg-yellow-300",
	3: "bg-green-300",
}

function sortQuestionOptions(question: TriviaQuestion): string[] {
	return sortArrayRandomly<string>(
		Object.values(question.options).concat(question.answer),
	);
}

type TriviaGameProps = Pick<Trivia, "id" | "questions" | "name">;

export default function TriviaGame(trivia: TriviaGameProps): JSX.Element {
	const [isFinished, setIsFinished] = useState<boolean>(false);
	const [currentQuestion, setCurrentQuestion] = useState<number>(0);
	const [score, setScore] = useState<number>(0);
	const [timeLeft, setTimeLeft] = useState<number | undefined>(() => getSettings()?.time ?? DEFAULT_TIME)
	const [answeredQuestions, setAnsweredQuestions] = useState<
		TriviaAnsweredQuestion[]
	>([]);

	const settings = getSettings();
	const questions = trivia.questions;

	const options = useMemo(
		() => sortQuestionOptions(questions[currentQuestion]),
		[questions, currentQuestion],
	);

	const handleTimeLeft = useCallback(
		() =>
			setTimeLeft(settings?.time ?? DEFAULT_TIME),
		[settings],
	);

	const handleContinue = useCallback(() => {
		handleTimeLeft();

		if (currentQuestion === questions.length - 1) {
			setIsFinished(true);
		} else {
			setCurrentQuestion(currentQuestion + 1);
		}
	}, [questions, currentQuestion, handleTimeLeft]);

	const handleAnswer = useCallback(
		(answer: string) => {
			setTimeLeft(undefined);

			if (answer === questions[currentQuestion].answer) {
				setScore(score + 1);
				toast.success("¡Respuesta correcta!", { duration: 1000 });
			} else {
				toast.error("¡Respuesta incorrecta!", { duration: 1000 });
			}

			setTimeout(() => handleContinue(), 1000);

			setAnsweredQuestions([
				...answeredQuestions,
				{
					question: questions[currentQuestion].question,
					answer: questions[currentQuestion].answer,
					isCorrect: answer === questions[currentQuestion].answer,
					userAnswer: answer,
				},
			]);
		},
		[questions, currentQuestion, answeredQuestions],
	);

	useEffect(() => {
		if (!isFinished) {
			if (typeof timeLeft === "undefined") return;

			if (timeLeft === 0) {
				toast("¡Se acabó el tiempo!", { duration: 2000, icon: "⏰" });

				setTimeout(() => handleContinue(), 2000);
			} else if (timeLeft > 0) {
				const interval = setInterval(
					() => setTimeLeft((current) => Number(current) - 1),
					1000,
				);

				return () => {
					clearInterval(interval);
				};
			}
		}
	}, [timeLeft, isFinished, handleContinue]);

	if (isFinished) {
		<>
			<Toaster />
			<p>{score}</p>
		</>;
	}

	return (
		<>
			<main className="px-4 min-h-screen flex flex-col justify-evenly bg-primary-light">
				<span className="py-4 flex gap-2 justify-center items-center">
					<h1 className="text-lg font-bold">{trivia.name}</h1>
					<h2 className="text-gray-600">{questions.length} preguntas</h2>
				</span>
				
				<div className="flex flex-col gap-2 items-center">
					<p className="font-medium">Tiempo restante</p>

					<div className="w-full h-2 rounded-full bg-gray-300">
						{(timeLeft !== undefined && timeLeft > 0) && <div style={{ animation: `timeProgress ${settings?.time ?? DEFAULT_TIME}s linear forwards` }} className="w-full bg-primary h-2 rounded-full" />}
					</div>
				</div>
						
				<span>
					<p className="my-2 text-gray-600">Pregunta {currentQuestion + 1}</p>
					<p className="my-4 text-xl font-semibold">{questions[currentQuestion].question}</p>
					<div className="flex flex-col gap-2 justify-center">
						{options.map((option, index) => (
							<button
								type="button"
								key={option}
								aria-details={`Opción ${index}: ${option}`}
								disabled={timeLeft === 0 || timeLeft === undefined}
								onClick={() => handleAnswer(option)}
								className={`w-full py-2 px-4 rounded-md ${OPTION_COLORS[index]}`}
							>
								{option}
							</button>
						))}
					</div>
				</span>
			</main>

			<Toaster />
		</>
	);
}
