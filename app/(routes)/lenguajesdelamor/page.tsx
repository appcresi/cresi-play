import type { Metadata } from "next";
import LenguajesDelAmorClient from "./components/lenguajesdelamor-client";

export const metadata: Metadata = {
  title: "ESI | Lenguajes del Amor | CrESI",
  description:
    "Descubrí cuál es tu lenguaje del amor con este test para adolescentes: cómo te gusta dar y recibir cariño de tu familia, amigos o pareja.",
  keywords: [
    "lenguajes del amor",
    "test lenguajes del amor",
    "relaciones saludables",
    "vínculos afectivos",
    "cariño adolescentes",
    "palabras de afirmación",
    "tiempo de calidad",
    "actos de servicio",
    "contacto físico",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://jugar.cresi.com.ar/lenguajesdelamor",
    siteName: "CrESI",
    title: "Lenguajes del Amor | CrESI",
    description:
      "Descubrí cuál es tu lenguaje del amor y cómo te gusta dar y recibir cariño de tu familia, amigos o pareja.",
    images: [
      {
        url: "/illustration-2.jpg",
        width: 1200,
        height: 630,
        alt: "Test de Lenguajes del Amor CrESI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lenguajes del Amor | CrESI",
    description: "Descubrí cuál es tu lenguaje del amor con este test para adolescentes.",
    images: ["/illustration-2.jpg"],
    creator: "@cresi",
  },
  alternates: {
    canonical: "https://jugar.cresi.com.ar/lenguajesdelamor",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LenguajesDelAmorPage(): JSX.Element {
  return <LenguajesDelAmorClient />;
}
