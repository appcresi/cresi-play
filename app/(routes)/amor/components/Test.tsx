"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import testData from "../data.json";

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

export default function Test(): JSX.Element {
	const [actualQuestion, setActualQuestion] = useState<number>(0);
	const [score, setScore] = useState<number>(0);
	const [percentage, setPercentage] = useState<number>(0);
	const [isFinished, setIsFinished] = useState<boolean>(false);

	const { questions, results } = testData;

	// 100: Porcentaje de la barra, questions.length: Cantidad de preguntas.
	const oneQuestion = 100 / questions.length;

	function handleAnswerSubmit(answerScore: 1 | 2 | 3 | 4): void {
		setScore((previous) => previous + answerScore);
		const newPercentage = percentage + oneQuestion;

		/* Actualizar el porcentaje de completado del test. */
		setPercentage(newPercentage);

		if (actualQuestion === questions.length - 1) {
			setIsFinished(true);
		} else {
			setActualQuestion((previous) => previous + 1);
		}
	}

	useEffect(() => {
		if (isFinished) {
			Swal.fire({
				icon: "question",
				title: "Resultado",
				text: results[calculateImportance(score)],
				confirmButtonText: "Volver a empezar",
			})
				.then((value) => {
					if (value.isConfirmed || value.isDismissed) {
						window.location.reload();
					}
				})
				.catch((error) => {
					console.error(error);
				});
		}
	}, [isFinished, results, score]);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header estilo Classroom */}
			<div className="bg-white border-b border-gray-200 sticky top-0 z-40">
				<div className="max-w-4xl mx-auto px-6 py-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h1 className="text-3xl font-semibold text-gray-900">
								Cuestionario
							</h1>
							<p className="text-gray-600 mt-1">
								Completa todas las preguntas
							</p>
						</div>
					</div>

					{/* Barra de progreso */}
					<div>
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-gray-700">
								Progreso
							</span>
							<span className="text-sm font-medium text-gray-600">
								{actualQuestion + 1} de {questions.length}
							</span>
						</div>
						<div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
							<div
								className="h-full bg-blue-500 transition-all duration-500"
								style={{ width: `${percentage}%` }}
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Contenido principal */}
			<div className="max-w-4xl mx-auto px-6 py-12">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
					{/* Número de pregunta */}
					<div className="mb-8">
						<span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded">
							Pregunta {actualQuestion + 1} de {questions.length}
						</span>
					</div>

					{/* Pregunta */}
					<div
						key={`question-${questions[actualQuestion]}`}
						className="mb-10 animate-fade-in"
					>
						<h2 className="text-2xl font-semibold text-gray-900 leading-relaxed">
							{questions[actualQuestion]}
						</h2>
					</div>

					{/* Opciones de respuesta */}
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
								className={`
									p-4 text-center
									border-2 border-gray-300 rounded-lg
									font-medium text-gray-900
									transition-all duration-200
									hover:border-blue-500 hover:bg-blue-50
									hover:shadow-md
									focus:outline-none focus:ring-2 focus:ring-blue-500
									active:bg-blue-100
								`}
							>
								<span>{answer.text}</span>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Estilos globales */}
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