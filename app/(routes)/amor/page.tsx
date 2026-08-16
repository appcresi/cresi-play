import type { Metadata } from "next";
import AmorSection from "./components/AmorSection";
import testData from "./data.json";
import { IconHeart, IconArrowRight } from "@tabler/icons-react";

export const metadata: Metadata = {
	title: "ESI | Amor sin violencia | CrESI",
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
		url: "https://jugar.cresi.com.ar/amor",
		siteName: "CrESI",
		title: "Amor sin violencia | CrESI",
		description:
			"Detecta señales de violencias en tus relaciones de pareja o amistades.",
		images: [
			{
				url: "/illustration-1.jpg",
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
		images: ["/illustration-1.jpg"],
		creator: "@cresi",
	},
	alternates: {
		canonical: "https://jugar.cresi.com.ar/amor",
	},
	robots: {
		index: true,
		follow: true,
	},
};

const ACCENT = "#F57C00";

export default function LoveTestPage(): JSX.Element {
	return (
		<section className="w-full max-w-7xl mx-auto px-4 pt-24 pb-12">

			{/* Test component */}
			<AmorSection />
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
								Detectar señales de violencia es fundamental para construir relaciones saludables y seguras basadas en el respeto
							</p>
						</div>
					</div>
				</div>

				<div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
					<div className="flex items-start gap-3">
						<div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center shrink-0">
							<IconHeart className="w-5 h-5 text-white" />
						</div>
						<div>
							<p className="font-semibold text-amber-900 mb-1">
								¿Qué vas a lograr?
							</p>
							<p className="text-sm text-amber-700">
								Identificarás patrones de violencia en tus relaciones y tomarás decisiones informadas sobre tu bienestar
							</p>
						</div>
					</div>
				</div>
			</div>
			{/* Support info */}
			<div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-6">
				<div className="flex items-start gap-3">
					<div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shrink-0">
						<IconHeart className="w-5 h-5 text-white" />
					</div>
					<div>
						<h3 className="font-semibold text-red-900 mb-2">
							¿Estás en una relación violenta?
						</h3>
						<p className="text-sm text-red-700 mb-3">
							{testData.about}
							Si reconocés que estás en una relación violenta, recordá que no estás sola/o. Existen recursos y profesionales dispuestos a ayudarte.
						</p>
						<a
							href="https://www.cresi.com.ar/contacto"
							className="text-sm text-red-600 hover:text-red-700 font-medium inline-flex items-center gap-1"
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