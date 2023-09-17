"use client";

import { Trivia, TriviaAnsweredQuestion, TriviaQuestion } from "@/types/trivia";
import { sortArrayRandomly } from "@/utils/array";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useSettings } from "../hooks/useSettings";

const DEFAULT_TIME = 60;

function sortQuestionOptions(question: TriviaQuestion): string[] {
	return sortArrayRandomly<string>(
		Object.values(question.options).concat(question.answer),
	);
}

function calculateTimeLeft(
	isReaderEnabled: boolean,
	timeSetInSeconds: number,
): number {
	if (isReaderEnabled) {
		return timeSetInSeconds + 60;
	}

	return timeSetInSeconds ?? DEFAULT_TIME;
}

type TriviaGameProps = Pick<Trivia, "id" | "questions" | "name">;

export default function TriviaGame(trivia: TriviaGameProps): JSX.Element {
	const { settings } = useSettings();
	const [isFinished, setIsFinished] = useState<boolean>(false);
	const [currentQuestion, setCurrentQuestion] = useState<number>(0);
	const [answeredQuestions, setAnsweredQuestions] = useState<
		TriviaAnsweredQuestion[]
	>([]);
	const [timeLeft, setTimeLeft] = useState<number | undefined>(
		settings?.time ?? 60,
	);
	const [score, setScore] = useState<number>(0);

	const questions = trivia.questions;

	const options = useMemo(
		() => sortQuestionOptions(questions[currentQuestion]),
		[questions, currentQuestion],
	);

	const handleTimeLeft = useCallback(
		() =>
			setTimeLeft(
				calculateTimeLeft(
					settings?.reader ?? false,
					settings?.time ?? DEFAULT_TIME,
				),
			),
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
			<main className="mx-4">
				<p>
					Pregunta: {currentQuestion + 1} de {questions.length}
				</p>
				<p>Tiempo restante: {timeLeft}</p>
				<p>{questions[currentQuestion].question}</p>
				<div>
					{options.map((option) => (
						<button
							type="button"
							key={option}
							disabled={timeLeft === 0 || timeLeft === undefined}
							onClick={() => handleAnswer(option)}
						>
							{option}
						</button>
					))}
				</div>
			</main>

			<Toaster />
		</>
	);
}
