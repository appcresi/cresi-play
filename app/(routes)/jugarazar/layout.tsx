import type { Metadata } from 'next';

// jugarazar/page.tsx es "use client" y no puede exportar su propia
// metadata — antes heredaba el título genérico de la home.
export const metadata: Metadata = {
  title: 'Jugar al Azar | CrESI',
  description:
    'Girá la ruleta y respondé preguntas al azar sobre Educación Sexual Integral. Un juego rápido y divertido para aprender sin saber qué categoría te va a tocar.',
  keywords: [
    'jugar al azar',
    'ruleta de preguntas',
    'trivia al azar',
    'educación sexual integral',
    'juegos educativos',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://jugar.cresi.com.ar/jugarazar',
    siteName: 'CrESI',
    title: 'Jugar al Azar | CrESI',
    description:
      'Girá la ruleta y respondé preguntas al azar sobre Educación Sexual Integral.',
    images: [
      {
        url: '/ruleta.png',
        width: 858,
        height: 861,
        alt: 'Ruleta de Jugar al Azar - CrESI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jugar al Azar | CrESI',
    description: 'Girá la ruleta y respondé preguntas al azar sobre ESI.',
    images: ['/ruleta.png'],
  },
  alternates: {
    canonical: 'https://jugar.cresi.com.ar/jugarazar',
  },
};

export default function JugarAzarLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return children as JSX.Element;
}
