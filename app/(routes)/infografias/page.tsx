import type { Metadata } from "next";
import InfografiasClient from "./components/InfografiasClient";

export const metadata: Metadata = {
  title: "ESI Argentina | Infografías | CrESI - Educación Sexual Integral",
  description:
    "Infografías educativas gratuitas sobre Educación Sexual Integral. Materiales visuales diseñados para docentes y estudiantes sobre salud, sexualidad y relaciones saludables.",
  keywords: [
    "infografías ESI",
    "infografías educativas",
    "material visual ESI",
    "educación sexual integral",
    "infografías gratis",
    "recursos visuales",
    "material didáctico",
    "educación visual",
  ],
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "https://cresi.com.ar/infografias",
    siteName: "CrESI",
    title: "Infografías | CrESI - Educación Sexual Integral",
    description:
      "Infografías educativas gratuitas sobre Educación Sexual Integral. Materiales visuales para docentes y estudiantes.",
    images: [
      {
        url: "/og-image-infografias.jpg",
        width: 1200,
        height: 630,
        alt: "Infografías CrESI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Infografías | CrESI - Educación Sexual Integral",
    description:
      "Infografías educativas gratuitas sobre ESI, sexualidad y relaciones saludables.",
    images: ["/twitter-image-infografias.jpg"],
    creator: "@cresi",
  },
  alternates: {
    canonical: "https://cresi.com.ar/infografias",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function InfographicsPage() {
  return <InfografiasClient />;
}