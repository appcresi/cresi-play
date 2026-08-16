import type { Metadata } from "next";
import VocacionClient from "./components/vocacion-client";

export const metadata: Metadata = {
	title: "ESI | Vocación y Profesiones | CrESI",
	description:
		"Descubrí tus intereses vocacionales y explorá diferentes profesiones para planificar tu futuro con confianza.",
	keywords: [
		"vocación",
		"profesiones",
		"orientación vocacional",
		"prueba vocacional",
		"carrera profesional",
		"intereses profesionales",
		"futuro laboral",
	],
	openGraph: {
		type: "website",
		locale: "es_AR",
		url: "https://jugar.cresi.com.ar/vocacion",
		siteName: "CrESI",
		title: "Vocación y Profesiones | CrESI",
		description:
			"Descubrí tus intereses vocacionales con nuestra prueba interactiva para adolescentes y jóvenes.",
		images: [
			{
				url: "/illustration-2.jpg",
				width: 1200,
				height: 630,
				alt: "Vocación y Profesiones CrESI",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Vocación y Profesiones | CrESI",
		description:
			"Exploá tus intereses vocacionales y descubrí tu carrera ideal.",
		images: ["/illustration-2.jpg"],
		creator: "@cresi",
	},
	alternates: {
		canonical: "https://jugar.cresi.com.ar/vocacion",
	},
	robots: {
		index: true,
		follow: true,
	},
};

export default function VocacionPage(): JSX.Element {
	return <VocacionClient />;
}