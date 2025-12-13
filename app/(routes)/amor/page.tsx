import type { Metadata } from "next";
import Test from "./components/Test";
import testData from "./data.json";
import { IconHeart } from "@tabler/icons-react";

export const metadata: Metadata = {
	title: "CrESI | Amor sin violencia",
	description:
		"Aprendé a detectar señales de violencias en tus relaciones de pareja o amistades.",
	keywords: [
		"amor sin violencia",
		"relaciones saludables",
		"violencia de pareja",
		"relaciones tóxicas",
		"abuso emocional",
		"señales de violencia",
		"educación sexual integral",
	],
	openGraph: {
		type: "website",
		locale: "es_AR",
		url: "https://cresi.com.ar/amor-sin-violencia",
		siteName: "CrESI",
		title: "Amor sin violencia | CrESI",
		description:
			"Detecta señales de violencias en tus relaciones de pareja o amistades.",
		images: [
			{
				url: "/og-image-amor.jpg",
				width: 1200,
				height: 630,
				alt: "Amor sin violencia CrESI",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Amor sin violencia | CrESI",
		description:
			"Aprendé a detectar señales de violencias en tus relaciones.",
		images: ["/twitter-image-amor.jpg"],
		creator: "@cresi",
	},
	alternates: {
		canonical: "https://cresi.com.ar/amor-sin-violencia",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function LoveTestPage(): JSX.Element {
	return (
		<section className="w-full max-w-7xl mx-auto px-4 py-12">
			{/* Header card */}
			<div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
				{/* Color header bar */}
				<div className="h-24 md:h-32 bg-gradient-to-r from-pink-600 via-rose-600 to-red-600 relative">
					<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiIC8+PC9zdmc+')] opacity-20"></div>
				</div>

				{/* Content */}
				<div className="px-6 md:px-12 py-8 -mt-8 relative">
					{/* Icon badge */}
					<div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md border border-gray-100 mb-4">
						<div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center">
							<IconHeart className="w-5 h-5 text-white" />
						</div>
						<span className="font-semibold text-gray-700">
							Aprender más, para cuidarse mejor
						</span>
					</div>

					{/* Title */}
					<h1 className="text-4xl md:text-5xl lg:text-6xl font-normal text-gray-900 mb-4">
						Amor
						<span className="block text-rose-600">sin violencia</span>
					</h1>

					{/* Description */}
					<p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-3xl">
						{testData.about}
					</p>
				</div>
			</div>

			{/* Info cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
				<div className="bg-rose-50 border border-rose-100 rounded-lg p-5">
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
							<IconHeart className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold text-rose-900 mb-1">
								¿Por qué es importante?
							</p>
							<p className="text-sm text-rose-700">
								Detectar señales de violencia es fundamental para construir relaciones saludables y seguras basadas en el respeto
							</p>
						</div>
					</div>
				</div>

				<div className="bg-pink-50 border border-pink-100 rounded-lg p-5">
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
							<IconHeart className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold text-pink-900 mb-1">
								¿Qué vas a lograr?
							</p>
							<p className="text-sm text-pink-700">
								Identificarás patrones de violencia en tus relaciones y tomarás decisiones informadas sobre tu bienestar
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Test component */}
			<Test />

			{/* Support info */}
			<div className="mt-8 bg-red-50 border border-red-100 rounded-lg p-6">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
						<IconHeart className="w-5 h-5 text-white" />
					</div>
					<div>
						<h3 className="font-semibold text-red-900 mb-2">
							¿Estás en una relación violenta?
						</h3>
						<p className="text-sm text-red-700 mb-3">
							Si reconocés que estás en una relación violenta, recordá que no estás sola/o. Existen recursos y profesionales dispuestos a ayudarte.
						</p>
						<a
							href="https://www.cresi.com.ar/contacto"
							className="text-sm text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1"
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