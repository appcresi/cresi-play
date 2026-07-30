import type { Metadata } from "next";
import SaludMentalSection from "./components/SaludMentalSection";
import { IconHeart, IconArrowRight } from "@tabler/icons-react";

export const metadata: Metadata = {
	title: "ESI | Test de Salud Mental | CrESI",
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

const ACCENT = "#388E3C";

export default function MentalHealthTestPage(): JSX.Element {
	return (
		<section className="w-full max-w-7xl mx-auto px-4 pt-24 pb-12">

			{/* Test component */}
			<SaludMentalSection />

			{/* Info cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
				<div className="rounded-xl p-5 border" style={{ backgroundColor: `${ACCENT}0D`, borderColor: `${ACCENT}30` }}>
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: ACCENT }}>
							<IconHeart className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold mb-1" style={{ color: ACCENT }}>
								¿Por qué es importante?
							</p>
							<p className="text-sm text-gray-600">
								Cuidar de tu salud mental es fundamental para prevenir problemas más graves como depresión o aislamiento social
							</p>
						</div>
					</div>
				</div>

				<div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center shrink-0">
							<IconHeart className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold text-teal-900 mb-1">
								¿Qué vas a lograr?
							</p>
							<p className="text-sm text-teal-700">
								Reflexionarás sobre tu bienestar y tomarás decisiones informadas sobre buscar ayuda si es necesario
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Support info */}
			<div className="mt-8 bg-blue-50 border border-blue-100 rounded-xl p-6">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
						<IconHeart className="w-5 h-5 text-white" />
					</div>
					<div>
						<h3 className="font-semibold text-blue-900 mb-2">
							¿Necesitás apoyo?
						</h3>
						<p className="text-sm text-blue-700 mb-3">
							Este test está dirigido principalmente a adolescentes y jóvenes, y tiene como objetivo evaluar el estado de su salud mental a partir de una serie de preguntas prácticas. Al finalizar, podrás determinar si estás en buen estado emocional o si, por el contrario, podrías estar experimentando niveles de estrés, ansiedad u otros desafíos mentales que podrían requerir apoyo emocional.
							Si después de realizar el test sentís que necesitás hablar con alguien, no dudes en contactar a un profesional de la salud mental o comunicarte con nosotros.
						</p>
						<a
							href="/contacto"
							className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
						>
							Contacta con nosotros
							<IconArrowRight className="w-4 h-4" />
						</a>
					</div>
				</div>
			</div>
		</section>
	);
}