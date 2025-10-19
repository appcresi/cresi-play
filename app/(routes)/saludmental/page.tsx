import type { Metadata } from "next";
import Test from "./components/Test";
import { IconHeart } from "@tabler/icons-react";

export const metadata: Metadata = {
	title: "Test de Salud Mental | CrESI - Educación Sexual Integral",
	description:
		"Test de salud mental para adolescentes y jóvenes. Evalúa tu estado emocional y recibe orientación sobre bienestar mental.",
	keywords: [
		"test salud mental",
		"evaluación emocional",
		"bienestar mental",
		"salud mental adolescentes",
		"test ansiedad",
		"evaluación estrés",
		"salud emocional",
	],
	openGraph: {
		type: "website",
		locale: "es_AR",
		url: "https://cresi.com.ar/test",
		siteName: "CrESI",
		title: "Test de Salud Mental | CrESI",
		description:
			"Evalúa tu salud mental con nuestro test interactivo para adolescentes y jóvenes.",
		images: [
			{
				url: "/og-image-test.jpg",
				width: 1200,
				height: 630,
				alt: "Test de Salud Mental CrESI",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Test de Salud Mental | CrESI",
		description:
			"Evalúa tu estado emocional con nuestro test de salud mental.",
		images: ["/twitter-image-test.jpg"],
		creator: "@cresi",
	},
	alternates: {
		canonical: "https://cresi.com.ar/test",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function MentalHealthTestPage(): JSX.Element {
	return (
		<section className="w-full max-w-7xl mx-auto px-4 py-12">
			{/* Header card */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
				{/* Color header bar */}
				<div className="h-24 md:h-32 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 relative">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-20"></div>
				</div>

				{/* Content */}
				<div className="px-6 md:px-12 py-8 -mt-8 relative">
					{/* Icon badge */}
					<div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-100 mb-4">
						<div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
							<IconHeart className="w-5 h-5 text-white" />
						</div>
						<span className="font-semibold text-gray-700">
							Aprender más, para cuidarse mejor
						</span>
					</div>

					{/* Title */}
					<h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 mb-4">
						Salud
						<span className="block text-purple-600">Mental</span>
					</h1>

					{/* Description */}
					<p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl">
						Este test está dirigido principalmente a adolescentes y jóvenes, y tiene como objetivo evaluar el estado de su salud mental a partir de una serie de preguntas prácticas. Al finalizar, podrás determinar si estás en buen estado emocional o si, por el contrario, podrías estar experimentando niveles de estrés, ansiedad u otros desafíos mentales que podrían requerir apoyo emocional.
					</p>
				</div>
			</div>

			{/* Info cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
				<div className="bg-purple-50 border border-purple-100 rounded-lg p-5">
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
							<IconHeart className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold text-purple-900 mb-1">
								¿Por qué es importante?
							</p>
							<p className="text-sm text-purple-700">
								Cuidar de tu salud mental es fundamental para prevenir problemas más graves como depresión o aislamiento social
							</p>
						</div>
					</div>
				</div>

				<div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5">
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
							<IconHeart className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold text-indigo-900 mb-1">
								¿Qué vas a lograr?
							</p>
							<p className="text-sm text-indigo-700">
								Reflexionarás sobre tu bienestar y tomarás decisiones informadas sobre buscar ayuda si es necesario
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Test component */}
			<Test />

			{/* Support info */}
			<div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-6">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
						<IconHeart className="w-5 h-5 text-white" />
					</div>
					<div>
						<h3 className="font-semibold text-blue-900 mb-2">
							¿Necesitás apoyo?
						</h3>
						<p className="text-sm text-blue-700 mb-3">
							Si después de realizar el test sentís que necesitás hablar con alguien, no dudes en contactar a un profesional de la salud mental o comunicarte con nosotros.
						</p>
						<a
							href="/contacto"
							className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
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