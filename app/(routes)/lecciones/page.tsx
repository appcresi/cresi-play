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

			{/* Lecciones component */}
			<Lecciones />

			{/* Bottom CTA */}
			<div className="mt-12 bg-blue-50 border border-blue-100 rounded-xl p-6">
				<div className="flex flex-col md:flex-row items-center justify-between gap-4">
					<div>
						<h3 className="font-semibold text-gray-900 mb-1">
							¿Terminaste todas las lecciones?
						</h3>
						<p className="text-sm text-gray-600">
							Seguí practicando con nuestros juegos y trivias interactivas
						</p>
					</div>
					<a
						href="https://jugar.cresi.com.ar"
						target="_blank"
						rel="noopener noreferrer"
						className="whitespace-nowrap"
					>
						<button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-sm transition-colors flex items-center gap-2">
							<IconPlayerPlay className="w-4.5 h-4.5" />
							<span>Ir a jugar</span>
						</button>
					</a>
				</div>
			</div>
		</section>
	);
}