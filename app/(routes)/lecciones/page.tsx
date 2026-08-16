import type { Metadata } from "next";
import Lecciones from "./components/Lecciones";
import { IconBook, IconSchool, IconCircleCheck, IconPlayerPlay } from "@tabler/icons-react";

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
	openGraph: {
		type: "website",
		locale: "es_AR",
		url: "https://jugar.cresi.com.ar/lecciones",
		siteName: "CrESI",
		title: "Lecciones | CrESI",
		description:
			"Aprendé sobre Educación Sexual Integral con lecciones interactivas sobre sexualidad, relaciones saludables y autocuidado.",
		images: [
			{
				url: "/illustration-1.jpg",
				width: 1200,
				height: 630,
				alt: "Lecciones CrESI",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Lecciones | CrESI",
		description:
			"Aprendé sobre Educación Sexual Integral con lecciones interactivas.",
		images: ["/illustration-1.jpg"],
		creator: "@cresi",
	},
	alternates: {
		canonical: "https://jugar.cresi.com.ar/lecciones",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function LeccionesPage(): JSX.Element {
	return (
		<div className="w-full min-h-screen bg-cream">
		<section className="max-w-7xl mx-auto px-4 py-12">

			{/* Lecciones component */}
			<Lecciones />

			{/* Bottom CTA */}
			<div className="mt-12 bg-mint border border-mint-light rounded-xl p-6">
				<div className="flex flex-col md:flex-row items-center justify-between gap-4">
					<div>
						<h3 className="font-semibold text-ink mb-1">
							¿Terminaste todas las lecciones?
						</h3>
						<p className="text-sm text-ink/70">
							Seguí practicando con nuestros juegos y trivias interactivas
						</p>
					</div>
					<a
						href="https://jugar.cresi.com.ar"
						target="_blank"
						rel="noopener noreferrer"
						className="whitespace-nowrap"
					>
						<button className="px-6 py-2.5 bg-coral hover:bg-coral-dark text-white font-semibold rounded-full shadow-sm transition-colors flex items-center gap-2">
							<IconPlayerPlay className="w-4.5 h-4.5" />
							<span>Ir a jugar</span>
						</button>
					</a>
				</div>
			</div>
		</section>
		</div>
	);
}