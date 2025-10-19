"use client";

import { useState, useEffect } from "react";
import LessonPage from "./lesson";
import GameStatusBar from '@/components/GameStatusBar';
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

interface MoodEntry {
	date: string;
	mood: number;
	label: string;
	intensity: number;
	note?: string;
}

interface Achievement {
	id: string;
	name: string;
	description: string;
	iconName: string;
	unlocked: boolean;
	date?: string;
}

interface UserData {
	profile: {
		character: {
			id: number;
			name: string;
			image: string;
		};
		username: string;
		createdAt: string;
		lastLogin: string;
	};
	game: {
		totalScore: number;
		totalLives: number;
		streak: number;
	};
	progress: {
		completedActivities: string[];
		activityScores: { [key: string]: number };
		activityTimes: { [key: string]: string };
		lastVisits: { [key: string]: string };
		storyProgress?: { [key: string]: { lastPage: number; percentage: number; pagesRead: string[] } };
		lessonProgress?: { [key: string]: { percentage: number; completed: boolean } };
	};
	mood: {
		history: MoodEntry[];
		lastEntry: MoodEntry | null;
	};
	achievements: Achievement[];
	settings: {
		notifications: boolean;
		theme: 'light' | 'dark';
		language: 'es' | 'en';
	};
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

const STORAGE_KEY = 'cresi_user_data';
const ACTIVITY_ID = 'Lecciones';
const POINTS_PER_CORRECT_ANSWER = 100;
const POINTS_PER_LEVEL_COMPLETION = 100;

export default function Lecciones(): JSX.Element {
	const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
	const [correctPercentages, setCorrectPercentages] = useState<
		Record<string, number | null>
	>({});
	const [userData, setUserData] = useState<UserData | null>(null);
	const [score, setScore] = useState(0);
	const [lives, setLives] = useState(3);
	const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
	const [totalAnswersCount, setTotalAnswersCount] = useState(0);
	const [currentLessonLevel, setCurrentLessonLevel] = useState(1);

	useEffect(() => {
		loadUserData();
	}, []);

	const loadUserData = () => {
		try {
			const storedData = window.localStorage.getItem(STORAGE_KEY);
			if (storedData) {
				const data: UserData = JSON.parse(storedData);
				setUserData(data);
				setScore(data.game.totalScore);
				setLives(data.game.totalLives);

				// Actualizar última visita
				data.progress.lastVisits[ACTIVITY_ID] = new Date().toISOString();

				// Inicializar lessonProgress si no existe
				if (!data.progress.lessonProgress) {
					data.progress.lessonProgress = {};
				}

				// Cargar porcentajes de correctas desde localStorage y sincronizar con userData
				const storedPercentages: Record<string, number | null> = {};
				features.forEach((feature) => {
					const percentage = localStorage.getItem(feature.title);
					const parsedPercentage = percentage ? parseFloat(percentage) : null;
					storedPercentages[feature.title] = parsedPercentage;

					// Sincronizar con lessonProgress
					if (parsedPercentage !== null) {
						data.progress.lessonProgress![feature.title] = {
							percentage: parsedPercentage,
							completed: parsedPercentage > 65
						};
					}
				});

				setCorrectPercentages(storedPercentages);
				window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
			}
		} catch (error) {
			console.error('Error loading user data:', error);
		}
	};

	const saveUserData = (updatedData: UserData) => {
		try {
			window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
			setUserData(updatedData);
			setScore(updatedData.game.totalScore);
		} catch (error) {
			console.error('Error saving user data:', error);
		}
	};

	const handleDiscover = (title: string) => {
		setSelectedFeature(title);
	};

	const handleAnswerCorrect = () => {
		if (!userData) return;

		const updatedData: UserData = {
			...userData,
			game: {
				...userData.game,
				totalScore: userData.game.totalScore + POINTS_PER_CORRECT_ANSWER
			}
		};

		saveUserData(updatedData);
	};

	const handleLevelComplete = () => {
		if (!userData) return;

		const updatedData: UserData = {
			...userData,
			game: {
				...userData.game,
				totalScore: userData.game.totalScore + POINTS_PER_LEVEL_COMPLETION
			}
		};

		saveUserData(updatedData);
	};

	const handleNoteCreated = () => {
		if (!userData) return;

		const POINTS_PER_NOTE = 50;
		const updatedData: UserData = {
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

	const handleLessonComplete = (
		title: string,
		percentage: number,
		correctAnswersCount: number,
		levelsCompleted: number
	) => {
		if (!userData) return;

		const isCompleted = percentage > 65;
		const lessonKey = `lesson_${title}`;

		const updatedData: UserData = {
			...userData,
			progress: {
				...userData.progress,
				lessonProgress: {
					...userData.progress.lessonProgress,
					[title]: {
						percentage,
						completed: isCompleted
					}
				},
				activityScores: {
					...userData.progress.activityScores,
					[lessonKey]: (userData.progress.activityScores[lessonKey] || 0) + (correctAnswersCount * POINTS_PER_CORRECT_ANSWER) + (levelsCompleted * POINTS_PER_LEVEL_COMPLETION)
				},
				activityTimes: {
					...userData.progress.activityTimes,
					[ACTIVITY_ID]: new Date().toISOString()
				}
			}
		};

		// Actualizar correctPercentages local
		setCorrectPercentages(prev => ({
			...prev,
			[title]: percentage
		}));

		// Guardar en ambos storages
		localStorage.setItem(title, percentage.toString());
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
										className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden group relative"
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
					<div className="max-w-7xl mx-auto mt-8 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg p-6">
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
			</div>
		</section>
	);
}