"use client";

import { useEffect, useState } from "react";
import Nomegusta from "./profesiones";
import { IconBriefcase, IconArrowRight } from "@tabler/icons-react";
import { getActivityById } from '@/lib/activities';
import GameStatusBar from '@/components/GameStatusBar';
import UserDataManager from '@/lib/userDataManager';

const ACCENT = getActivityById('vocacion')?.color ?? '#388E3C';

export default function VocacionClient() {
	const [score, setScore] = useState(0);
	const [lives, setLives] = useState(3);

	useEffect(() => {
		const data = UserDataManager.loadUserData();
		setScore(data.game.totalScore);
		setLives(data.game.totalLives);
	}, []);

	return (
		<div className="w-full min-h-screen bg-cream dark:bg-gray-900">
		<section className="max-w-7xl mx-auto px-4 pt-24 pb-12">
			<GameStatusBar title="Test Vocacional" score={score} lives={lives} level={1} />

			{/* Test component — embebido directo en la página, sin pantalla aparte */}
			<div className="mb-8">
				<Nomegusta onScoreChange={setScore} />
			</div>

			{/* Info cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
				<div className="rounded-xl p-5 border" style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}30` }}>
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: ACCENT }}>
							<IconBriefcase className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold mb-1" style={{ color: ACCENT }}>
								¿Por qué es importante?
							</p>
							<p className="text-sm text-gray-600 dark:text-gray-400">
								Conocer tu vocación te ayuda a elegir una carrera que sea satisfactoria y acorde a tus capacidades, aumentando tus posibilidades de éxito y realización personal.
							</p>
						</div>
					</div>
				</div>

				<div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 rounded-xl p-5">
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
							<IconBriefcase className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold text-teal-900 dark:text-teal-200 mb-1">
								¿Qué vas a lograr?
							</p>
							<p className="text-sm text-teal-700 dark:text-teal-300">
								Identificarás tus intereses vocacionales, conocerás profesiones que se alinean con tu perfil y tendrás herramientas para planificar tu futuro educativo y laboral.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Support info */}
			<div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900 rounded-xl p-6">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
						<IconBriefcase className="w-5 h-5 text-white" />
					</div>
					<div>
						<h3 className="font-semibold text-teal-900 dark:text-teal-200 mb-2">
							¿Necesitás orientación?
						</h3>
						<p className="text-sm text-teal-700 dark:text-teal-300 mb-3">
							Si después de realizar el test querés explorar más sobre las profesiones recomendadas o necesitás asesoramiento vocacional personalizado, no dudes en contactarnos.
						</p>
						<a
							href="/contacto"
							className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium inline-flex items-center gap-1"
						>
							Contacta con nosotros
							<IconArrowRight className="w-4 h-4" />
						</a>
					</div>
				</div>
			</div>
		</section>
		</div>
	);
}