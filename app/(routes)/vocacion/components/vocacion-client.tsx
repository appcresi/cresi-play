"use client";

import { useState } from "react";
import Nomegusta from "./profesiones";
import { IconBriefcase } from "@tabler/icons-react";

export default function VocacionClient() {
	const [testStarted, setTestStarted] = useState(false);

	if (testStarted) {
		return (
			<section className="w-full min-h-screen bg-gray-50 py-8">
				<div className="max-w-7xl mx-auto px-2">
					{/* Botón para volver */}
					<button
						onClick={() => setTestStarted(false)}
						className="mb-6 inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Volver
					</button>

					{/* Test component */}
					<Nomegusta />
				</div>
			</section>
		);
	}

	return (
		<section className="w-full max-w-7xl mx-auto px-4 py-12">
			{/* Header card */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
				{/* Color header bar */}
				<div className="h-24 md:h-32 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 relative">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-20"></div>
				</div>

				{/* Content */}
				<div className="px-6 md:px-12 py-8 -mt-8 relative">
					{/* Icon badge */}
					<div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-100 mb-4">
						<div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
							<IconBriefcase className="w-5 h-5 text-white" />
						</div>
						<span className="font-semibold text-gray-700">
							Descubrí tu camino profesional
						</span>
					</div>

					{/* Title */}
					<h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 mb-4">
						Vocación y
						<span className="block text-emerald-600">Profesiones</span>
					</h1>

					{/* Description */}
					<p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl">
						Este test está diseñado para adolescentes y jóvenes que desean explorar sus intereses y aptitudes profesionales. A través de preguntas prácticas, podrás identificar tus fortalezas, descubrir nuevas profesiones alineadas con tus intereses y tomar decisiones informadas sobre tu futuro laboral.
					</p>
				</div>
			</div>

			{/* Info cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
				<div className="bg-emerald-50 border border-emerald-100 rounded-lg p-5">
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
							<IconBriefcase className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold text-emerald-900 mb-1">
								¿Por qué es importante?
							</p>
							<p className="text-sm text-emerald-700">
								Conocer tu vocación te ayuda a elegir una carrera que sea satisfactoria y acorde a tus capacidades, aumentando tus posibilidades de éxito y realización personal.
							</p>
						</div>
					</div>
				</div>

				<div className="bg-teal-50 border border-teal-100 rounded-lg p-5">
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
							<IconBriefcase className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold text-teal-900 mb-1">
								¿Qué vas a lograr?
							</p>
							<p className="text-sm text-teal-700">
								Identificarás tus intereses vocacionales, conocerás profesiones que se alinean con tu perfil y tendrás herramientas para planificar tu futuro educativo y laboral.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* CTA Button */}
			<div className="flex justify-center mb-8">
				<button
					onClick={() => setTestStarted(true)}
					className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition transform hover:scale-105 active:scale-95"
				>
					Hacer el Test
				</button>
			</div>

			{/* Support info */}
			<div className="mt-8 bg-cyan-50 border border-cyan-100 rounded-lg p-6">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 bg-cyan-600 rounded-full flex items-center justify-center flex-shrink-0">
						<IconBriefcase className="w-5 h-5 text-white" />
					</div>
					<div>
						<h3 className="font-semibold text-cyan-900 mb-2">
							¿Necesitás orientación?
						</h3>
						<p className="text-sm text-cyan-700 mb-3">
							Si después de realizar el test querés explorar más sobre las profesiones recomendadas o necesitás asesoramiento vocacional personalizado, no dudes en contactarnos.
						</p>
						<a
							href="/contacto"
							className="text-sm text-cyan-600 hover:text-cyan-700 font-medium inline-flex items-center gap-1"
						>
							Contacta con nosotros
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}