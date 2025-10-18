"use client";

import { useState, useEffect } from "react";
import LessonPage from "./lesson";
import {
	IconBook,
	IconPresentation,
	IconHeart,
	IconTrophy,
	IconLock,
	IconCheck,
	IconArrowRight,
} from "@tabler/icons-react";

interface Feature {
	title: string;
	description: string;
	icon: JSX.Element;
	color: string;
	difficulty: string;
}

const features: Feature[] = [
	{
		title: "Pubertad",
		description:
			"En esta lección aprenderás sobre los principales cambios que ocurren al inicio de la pubertad.",
		icon: <IconBook size={24} />,
		color: "blue",
		difficulty: "Básico",
	},
	{
		title: "Sexualidad",
		description:
			"¿La sexualidad es solo lo biológico? Aprendé más sobre la diferencia entre sexo, género, orientación sexual.",
		icon: <IconPresentation size={24} />,
		color: "purple",
		difficulty: "Intermedio",
	},
	{
		title: "Planificación Familiar",
		description:
			"¿Querés formar una familia? ¿Sabés cómo cuidarte y con qué? Aprendé más sobre métodos anticonceptivos.",
		icon: <IconHeart size={24} />,
		color: "pink",
		difficulty: "Avanzado",
	},
];

export default function Lecciones(): JSX.Element {
	const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
	const [correctPercentages, setCorrectPercentages] = useState<
		Record<string, number | null>
	>({});

	const handleDiscover = (title: string) => {
		setSelectedFeature(title);
	};

	// Obtener el porcentaje de correctas desde localStorage
	useEffect(() => {
		const storedPercentages: Record<string, number | null> = {};

		features.forEach((feature) => {
			const percentage = localStorage.getItem(feature.title);
			storedPercentages[feature.title] = percentage
				? parseFloat(percentage)
				: null;
		});

		setCorrectPercentages(storedPercentages);
	}, []);

	// Función para obtener clases de color según el tema
	const getColorClasses = (color: string) => {
		const colors = {
			blue: {
				bg: "bg-blue-500",
				bgLight: "bg-blue-50",
				border: "border-blue-200",
				text: "text-blue-600",
				textDark: "text-blue-900",
				gradient: "from-blue-500 to-blue-600",
			},
			purple: {
				bg: "bg-purple-500",
				bgLight: "bg-purple-50",
				border: "border-purple-200",
				text: "text-purple-600",
				textDark: "text-purple-900",
				gradient: "from-purple-500 to-purple-600",
			},
			pink: {
				bg: "bg-pink-500",
				bgLight: "bg-pink-50",
				border: "border-pink-200",
				text: "text-pink-600",
				textDark: "text-pink-900",
				gradient: "from-pink-500 to-pink-600",
			},
		};
		return colors[color as keyof typeof colors] || colors.blue;
	};

	return (
		<section>
			{!selectedFeature ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{features.map((feature) => {
						const correctPercentage = correctPercentages[feature.title];
						const isCompleted = correctPercentage && correctPercentage > 65;
						const colors = getColorClasses(feature.color);

						return (
							<div
								key={feature.title}
								className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
							>
								{/* Top color bar */}
								<div className={`h-2 bg-gradient-to-r ${colors.gradient}`}></div>

								{/* Card content */}
								<div className="p-6">
									{/* Header with icon and difficulty */}
									<div className="flex items-start justify-between mb-4">
										<div
											className={`w-12 h-12 ${colors.bgLight} ${colors.text} rounded-full flex items-center justify-center flex-shrink-0`}
										>
											{feature.icon}
										</div>

										{/* Difficulty badge */}
										<span
											className={`text-xs font-medium px-2 py-1 ${colors.bgLight} ${colors.text} rounded-full`}
										>
											{feature.difficulty}
										</span>
									</div>

									{/* Title */}
									<h3 className="text-xl font-semibold text-gray-900 mb-3">
										{feature.title}
									</h3>

									{/* Description */}
									<p className="text-sm text-gray-600 leading-relaxed mb-4">
										{feature.description}
									</p>

									{/* Progress indicator */}
									{correctPercentage !== null && (
										<div className={`${colors.bgLight} ${colors.border} border rounded-lg p-3 mb-4`}>
											<div className="flex items-center justify-between mb-2">
												<div className="flex items-center gap-2">
													{isCompleted ? (
														<IconCheck
															size={18}
															className={colors.text}
														/>
													) : (
														<IconTrophy
															size={18}
															className={colors.text}
														/>
													)}
													<span className={`text-sm font-medium ${colors.textDark}`}>
														{isCompleted ? "Completado" : "En progreso"}
													</span>
												</div>
												<span className={`text-lg font-bold ${colors.text}`}>
													{correctPercentage}%
												</span>
											</div>
											{/* Progress bar */}
											<div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
												<div
													className={`h-full bg-gradient-to-r ${colors.gradient} transition-all duration-500`}
													style={{ width: `${correctPercentage}%` }}
												></div>
											</div>
										</div>
									)}

									{/* CTA Button */}
									<button
										onClick={() => handleDiscover(feature.title)}
										className={`w-full py-3 px-4 ${colors.bg} hover:opacity-90 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 group-hover:gap-3 shadow-sm`}
									>
										<span>
											{correctPercentage !== null
												? "Continuar lección"
												: "Comenzar lección"}
										</span>
										<IconArrowRight
											size={18}
											className="transition-transform"
										/>
									</button>
								</div>

								{/* Achievement badge (only if completed) */}
								{isCompleted && (
									<div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 rounded-full p-2 shadow-lg">
										<IconTrophy size={20} />
									</div>
								)}
							</div>
						);
					})}
				</div>
			) : (
				<LessonPage
					title={selectedFeature}
					onBack={() => setSelectedFeature(null)}
				/>
			)}

			{/* Summary statistics (opcional) */}
			{!selectedFeature && Object.keys(correctPercentages).length > 0 && (
				<div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
								<IconTrophy className="w-6 h-6 text-white" />
							</div>
							<div>
								<p className="font-semibold text-gray-900">
									Tu progreso general
								</p>
								<p className="text-sm text-gray-600">
									{
										features.filter(
											(f) =>
												correctPercentages[f.title] &&
												correctPercentages[f.title]! > 65
										).length
									}{" "}
									de {features.length} lecciones completadas
								</p>
							</div>
						</div>

						<div className="flex gap-2">
							{features.map((feature) => {
								const percentage = correctPercentages[feature.title];
								const isCompleted = percentage && percentage > 65;
								return (
									<div
										key={feature.title}
										className={`w-3 h-3 rounded-full ${
											isCompleted
												? "bg-green-500"
												: percentage !== null
												? "bg-yellow-500"
												: "bg-gray-300"
										}`}
										title={`${feature.title}: ${
											percentage !== null ? `${percentage}%` : "No iniciada"
										}`}
									></div>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</section>
	);
}