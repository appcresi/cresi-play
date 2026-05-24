import type { Metadata } from "next";
import Lecciones from "./components/Lecciones";
import { IconBook, IconSchool } from "@tabler/icons-react";

export const metadata: Metadata = {
	title: "ESI | Lecciones | CrESI",
	description:
		"Aprendé sobre Educación Sexual Integral con nuestras lecciones interactivas. Contenido didáctico sobre sexualidad, relaciones saludables y autocuidado.",
	keywords: [
		"lecciones ESI",
		"educación sexual integral",
		"aprender sexualidad",
		"contenido educativo",
		"recursos didácticos ESI",
		"lecciones interactivas",
		"material educativo",
		"autocuidado",
	],
	alternates: {
		canonical: "https://cresi.com.ar/lecciones",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function LeccionesPage(): JSX.Element {
	return (
		<section className="w-full max-w-7xl mx-auto px-4 py-12">
			{/* Header container - Classroom style */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
				{/* Color header bar */}
				<div className="h-32 md:h-40 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 relative">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-20"></div>
					
					{/* Floating decorative elements */}
					<div className="absolute top-6 right-8 w-16 h-16 bg-white/10 rounded-full backdrop-blur-sm"></div>
					<div className="absolute bottom-6 left-12 w-12 h-12 bg-white/10 rounded-lg backdrop-blur-sm rotate-12"></div>
				</div>

				{/* Content section */}
				<div className="px-6 md:px-12 pb-12 -mt-16 relative">
					{/* Icon badge */}
					<div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-100 mb-4">
						<div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
							<IconBook className="w-5 h-5 text-white" />
						</div>
						<span className="font-semibold text-gray-700">
							Aprender más, para cuidarse mejor
						</span>
					</div>

					{/* Main heading */}
					<h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 leading-tight mb-4">
						Lecciones de{" "}
						<span className="text-emerald-600">Educación Sexual Integral</span>
					</h1>

					{/* Description */}
					<p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-4xl mb-6">
						Es hora de aprender más sobre el amor, la sexualidad y el autocuidado. 
						Lee cada lección, reflexioná sobre el contenido y evaluá tus conocimientos 
						con las actividades interactivas.
					</p>

					{/* Info cards */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-2">
								<IconBook className="w-5 h-5 text-emerald-600" />
								<p className="font-semibold text-emerald-900">
									Contenido de calidad
								</p>
							</div>
							<p className="text-sm text-emerald-700">
								Información confiable y actualizada sobre ESI
							</p>
						</div>

						<div className="bg-green-50 border border-green-100 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-2">
								<IconSchool className="w-5 h-5 text-green-600" />
								<p className="font-semibold text-green-900">
									Aprendizaje interactivo
								</p>
							</div>
							<p className="text-sm text-green-700">
								Actividades y evaluaciones para reforzar conceptos
							</p>
						</div>

						<div className="bg-teal-50 border border-teal-100 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-2">
								<svg
									className="w-5 h-5 text-teal-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p className="font-semibold text-teal-900">
									A tu ritmo
								</p>
							</div>
							<p className="text-sm text-teal-700">
								Aprendé cuando quieras, sin presiones
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Lecciones component */}
			<Lecciones />

			{/* Bottom CTA (opcional) */}
			<div className="mt-12 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg p-6">
				<div className="flex flex-col md:flex-row items-center justify-between gap-4">
					<div>
						<h3 className="font-semibold text-gray-900 mb-1">
							¿Terminaste todas las lecciones?
						</h3>
						<p className="text-sm text-gray-700">
							Seguí practicando con nuestros juegos y trivias interactivas
						</p>
					</div>
					<a
						href="https://jugar.cresi.com.ar"
						target="_blank"
						rel="noopener noreferrer"
						className="whitespace-nowrap"
					>
						<button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2">
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
									d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
							<span>Ir a jugar</span>
						</button>
					</a>
				</div>
			</div>
		</section>
	);
}