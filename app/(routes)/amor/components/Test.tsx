"use client";

import { useState, useEffect } from "react";
import { IconRefresh, IconHeartHandshake } from "@tabler/icons-react";
import testData from "../data.json";
import UserDataManager from '@/lib/userDataManager';
import { trackEvent } from '@/lib/analytics';
import { getActivityById } from '@/lib/activities';

const ACTIVITY = getActivityById('amor');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Amor Sin Violencia';
const ACCENT = ACTIVITY?.color ?? '#F57C00';
const COMPLETION_POINTS = 200;

/** Calcular la gravedad (o importancia) en base a la puntuación. */
function calculateImportance(score: number): number {
	switch (true) {
		case score <= 24:
			return 0;
		case score <= 30:
			return 1;
		case score <= 42:
			return 2;
		default:
			return 3;
	}
}

export default function Test({ onCompleted }: { onCompleted?: (newScore: number) => void }): JSX.Element {
	const [actualQuestion, setActualQuestion] = useState<number>(0);
	const [score, setScore] = useState<number>(0);
	const [percentage, setPercentage] = useState<number>(0);
	const [isFinished, setIsFinished] = useState<boolean>(false);
	const [hasSavedCompletion, setHasSavedCompletion] = useState(false);

	const { questions, results } = testData;
	const oneQuestion = 100 / questions.length;

	// Antes esta actividad no registraba absolutamente nada: ni la visita,
	// ni el puntaje, ni que se hubiera completado. Ahora se anota apenas
	// se abre esta pantalla.
	useEffect(() => {
		UserDataManager.visitActivity(ACTIVITY_TITLE);
	}, []);

	function handleAnswerSubmit(answerScore: 1 | 2 | 3 | 4): void {
		setScore((previous) => previous + answerScore);
		setPercentage((previous) => previous + oneQuestion);

		if (actualQuestion === questions.length - 1) {
			setIsFinished(true);
		} else {
			setActualQuestion((previous) => previous + 1);
		}
	}

	// Marca la actividad como completada y da un puntaje fijo — antes
	// esto no pasaba nunca, ni siquiera al terminar el cuestionario.
	useEffect(() => {
		if (!isFinished || hasSavedCompletion) return;

		const current = UserDataManager.loadUserData();
		const updatedData = {
			...current,
			game: {
				...current.game,
				totalScore: current.game.totalScore + COMPLETION_POINTS
			},
			progress: {
				...current.progress,
				activityScores: {
					...current.progress.activityScores,
					[ACTIVITY_TITLE]: COMPLETION_POINTS
				},
				activityTimes: {
					...current.progress.activityTimes,
					[ACTIVITY_TITLE]: new Date().toISOString()
				},
				completedActivities: !current.progress.completedActivities.includes(ACTIVITY_TITLE)
					? [...current.progress.completedActivities, ACTIVITY_TITLE]
					: current.progress.completedActivities
			}
		};
		UserDataManager.saveUserData(updatedData);
		setHasSavedCompletion(true);
		trackEvent('activity_completed', { activity_title: ACTIVITY_TITLE });
		onCompleted?.(updatedData.game.totalScore);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isFinished]);

	const resetTest = () => {
		setActualQuestion(0);
		setScore(0);
		setPercentage(0);
		setIsFinished(false);
		setHasSavedCompletion(false);
	};

	if (isFinished) {
		const resultText = results[calculateImportance(score)];

		return (
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center mb-8">
				<div
					className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
					style={{ backgroundColor: `${ACCENT}15` }}
				>
					<IconHeartHandshake className="w-8 h-8" style={{ color: ACCENT }} />
				</div>
				<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Resultado</h2>
				<p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8 max-w-xl mx-auto">{resultText}</p>
				<button
					onClick={resetTest}
					className="inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-full font-semibold hover:opacity-90 transition-colors"
					style={{ backgroundColor: ACCENT }}
				>
					<IconRefresh className="w-4.5 h-4.5" />
					Volver a empezar
				</button>
			</div>
		);
	}

	return (
		<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 mb-8">
			{/* Barra de progreso */}
			<div className="mb-8">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progreso</span>
					<span className="text-sm font-medium text-gray-500 dark:text-gray-400">
						{actualQuestion + 1} de {questions.length}
					</span>
				</div>
				<div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
					<div
						className="h-full transition-all duration-500"
						style={{ width: `${percentage}%`, backgroundColor: ACCENT }}
					/>
				</div>
			</div>

			<div key={`question-${questions[actualQuestion]}`} className="mb-10 animate-fade-in">
				<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
					{questions[actualQuestion]}
				</h2>
			</div>

			<div className="grid grid-cols-2 gap-4">
				{[
					{ text: 'Sí', value: 4 as 4 },
					{ text: 'A veces', value: 3 as 3 },
					{ text: 'Rara vez', value: 2 as 2 },
					{ text: 'No', value: 1 as 1 }
				].map((answer) => (
					<button
						key={answer.text}
						type="button"
						onClick={() => handleAnswerSubmit(answer.value)}
						className="p-4 text-center border-2 border-gray-200 dark:border-gray-600 rounded-xl font-medium text-gray-800 dark:text-gray-200
                     transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2"
						style={{ '--tw-ring-color': ACCENT } as React.CSSProperties}
						onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; }}
						onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
					>
						<span>{answer.text}</span>
					</button>
				))}
			</div>

			<style>{`
				@keyframes fade-in {
					from {
						opacity: 0;
						transform: translateY(10px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				.animate-fade-in {
					animation: fade-in 0.3s ease-out;
				}
			`}</style>
		</div>
	);
}