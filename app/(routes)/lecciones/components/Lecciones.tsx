"use client";

import { useState, useEffect } from "react";
import LessonPage from "./lesson";
import GameStatusBar from '@/components/GameStatusBar';
import {
	IconBook,
	IconPresentation,
	IconHeart,
	IconTrophy,
	IconCheck,
	IconArrowRight,
} from "@tabler/icons-react";
import UserDataManager from '@/lib/userDataManager';
import { getActivityById } from '@/lib/activities';

interface Feature {
	title: string;
	description: string;
	icon: JSX.Element;
	color: string;
	difficulty: string;
}

const ACTIVITY = getActivityById('lecciones');
const ACTIVITY_TITLE = ACTIVITY?.title ?? 'Lecciones';
const ACCENT = ACTIVITY?.color ?? '#1976D2';

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

const POINTS_PER_CORRECT_ANSWER = 100;
const POINTS_PER_LEVEL_COMPLETION = 100;

export default function Lecciones(): JSX.Element {
	const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
	const [correctPercentages, setCorrectPercentages] = useState<
		Record<string, number | null>
	>({});
	const [userData, setUserData] = useState(UserDataManager.getDefaultUserData());
	const [score, setScore] = useState(0);
	const [lives, setLives] = useState(3);
	const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
	const [totalAnswersCount, setTotalAnswersCount] = useState(0);
	const [currentLessonLevel, setCurrentLessonLevel] = useState(1);

	useEffect(() => {
		loadUserData();
	}, []);

	const loadUserData = () => {
		const data = UserDataManager.loadUserData();
		setUserData(data);
		setScore(data.game.totalScore);
		setLives(data.game.totalLives);
		UserDataManager.visitActivity(ACTIVITY_TITLE);

		// Antes esto leía una clave suelta en localStorage (el nombre de la
		// lección, ej. "Pubertad") que también usa Completapalabras para SUS
		// lecciones — dos actividades distintas leyendo/escribiendo la misma
		// clave global. El progreso de cada lección ya vive, correctamente
		// aislado, en `progress.lessonProgress`; ahora leemos solo de ahí.
		const percentages: Record<string, number | null> = {};
		features.forEach((feature) => {
			const entry = data.progress.lessonProgress?.[feature.title];
			percentages[feature.title] = entry ? entry.percentage : null;
		});
		setCorrectPercentages(percentages);
	};

	const saveUserData = (updatedData: typeof userData) => {
		UserDataManager.saveUserData(updatedData);
		setUserData(updatedData);
		setScore(updatedData.game.totalScore);
	};

	const handleDiscover = (title: string) => {
		setSelectedFeature(title);
	};

	const handleAnswerCorrect = () => {
		const updatedData = {
			...userData,
			game: {
				...userData.game,
				totalScore: userData.game.totalScore + POINTS_PER_CORRECT_ANSWER
			}
		};
		saveUserData(updatedData);
	};

	const handleLevelComplete = () => {
		const updatedData = {
			...userData,
			game: {
				...userData.game,
				totalScore: userData.game.totalScore + POINTS_PER_LEVEL_COMPLETION
			}
		};
		saveUserData(updatedData);
	};

	const handleNoteCreated = () => {
		const POINTS_PER_NOTE = 50;
		const updatedData = {
			...userData,
			game: {
				...userData.game,
				totalScore: userData.game.totalScore + POINTS_PER_NOTE
			}
		};
		saveUserData(updatedData);
	};

	const handleCorrectAnswersUpdate = (correct: number, total: number) => {
		setCorrectAnswersCount(correct);
		setTotalAnswersCount(total);
	};

	const handleLessonLevelUpdate = (level: number) => {
		setCurrentLessonLevel(level);
	};

	/**
	 * Antes esto nunca tocaba `completedActivities` — "Lecciones" jamás
	 * aparecía como completada en el resto de la app, sin importar cuántas
	 * lecciones terminaras. Ahora, apenas se completa UNA lección (>65%),
	 * se marca la actividad general como completada (mismo criterio que
	 * usamos en Completapalabras: no hace falta terminar las 3).
	 */
	const handleLessonComplete = (
		title: string,
		percentage: number,
		correctAnswersCount: number,
		levelsCompleted: number
	) => {
		const isCompleted = percentage > 65;
		const lessonKey = `${ACTIVITY_TITLE}-${title}`;
		const current = UserDataManager.loadUserData();

		const updatedData = {
			...current,
			progress: {
				...current.progress,
				lessonProgress: {
					...current.progress.lessonProgress,
					[title]: {
						percentage,
						completed: isCompleted
					}
				},
				activityScores: {
					...current.progress.activityScores,
					[lessonKey]: (current.progress.activityScores[lessonKey] || 0) + (correctAnswersCount * POINTS_PER_CORRECT_ANSWER) + (levelsCompleted * POINTS_PER_LEVEL_COMPLETION)
				},
				activityTimes: {
					...current.progress.activityTimes,
					[ACTIVITY_TITLE]: new Date().toISOString()
				},
				completedActivities: isCompleted
					? Array.from(new Set([...current.progress.completedActivities, ACTIVITY_TITLE]))
					: current.progress.completedActivities
			}
		};

		setCorrectPercentages(prev => ({
			...prev,
			[title]: percentage
		}));

		saveUserData(updatedData);
	};

	const handleBack = () => {
		setSelectedFeature(null);
		loadUserData();
	};

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
		<section className="min-h-screen bg-gray-50">
			<GameStatusBar
				title="Lecciones"
				score={score}
				lives={lives}
				level={selectedFeature ? currentLessonLevel : 1}
				{...(selectedFeature && {
					currentQuestion: correctAnswersCount,
					totalQuestions: totalAnswersCount || 1
				})}
			/>

			<div className="py-8 px-4 pt-24">
				{!selectedFeature ? (
					<div className="max-w-7xl mx-auto">
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{features.map((feature) => {
								const correctPercentage = correctPercentages[feature.title];
								const isCompleted = correctPercentage && correctPercentage > 65;
								const colors = getColorClasses(feature.color);

								return (
									<div
										key={feature.title}
										className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group relative"
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
											<h3 className="text-lg font-semibold text-gray-900 mb-2">
												{feature.title}
											</h3>

											{/* Description */}
											<p className="text-sm text-gray-500 leading-relaxed mb-4">
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
													<div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
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
												className={`w-full py-2.5 px-4 ${colors.bg} hover:opacity-90 text-white font-medium rounded-full transition-all flex items-center justify-center gap-2 group-hover:gap-3 shadow-sm`}
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
					</div>
				) : (
					<div className="max-w-7xl mx-auto">
						<LessonPage
							title={selectedFeature}
							onBack={handleBack}
							onLessonComplete={handleLessonComplete}
							onAnswerCorrect={handleAnswerCorrect}
							onLevelComplete={handleLevelComplete}
							onCorrectAnswersUpdate={handleCorrectAnswersUpdate}
							onLessonLevelUpdate={handleLessonLevelUpdate}
						/>
					</div>
				)}

				{/* Summary statistics */}
				{!selectedFeature && Object.keys(correctPercentages).length > 0 && (
					<div className="max-w-7xl mx-auto mt-8 rounded-xl border p-6" style={{ backgroundColor: `${ACCENT}0A`, borderColor: `${ACCENT}30` }}>
						<div className="flex flex-col md:flex-row items-center justify-between gap-4">
							<div className="flex items-center gap-3">
								<div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: ACCENT }}>
									<IconTrophy className="w-6 h-6 text-white" />
								</div>
								<div>
									<p className="font-semibold text-gray-900">
										Tu progreso general
									</p>
									<p className="text-sm text-gray-500">
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
			</div>
		</section>
	);
}