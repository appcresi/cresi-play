import type { Metadata } from 'next';

// trivias/page.tsx (el catálogo) es "use client", así que no puede exportar
// su propia metadata — antes de esto heredaba el título genérico de la
// home. Este layout cubre solo /trivias; la trivia individual /trivias/[id]
// tiene su propio layout con metadata dinámica por trivia.
export const metadata: Metadata = {
  title: 'Trivias de Educación Sexual Integral | CrESI',
  description:
    'Jugá trivias interactivas sobre Educación Sexual Integral. Elegí entre decenas de trivias por tema y nivel, gratis y sin registrarte.',
  keywords: [
    'trivias ESI',
    'trivia educación sexual',
    'juegos de preguntas',
    'trivia online gratis',
    'educación sexual integral',
    'trivias educativas',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://jugar.cresi.com.ar/trivias',
    siteName: 'CrESI',
    title: 'Trivias de Educación Sexual Integral | CrESI',
    description:
      'Jugá trivias interactivas sobre ESI. Elegí entre decenas de trivias por tema y nivel, gratis y sin registrarte.',
    images: [
      {
        url: '/illustration-1.jpg',
        width: 1200,
        height: 630,
        alt: 'Trivias CrESI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trivias de Educación Sexual Integral | CrESI',
    description: 'Jugá trivias interactivas sobre ESI, gratis y sin registrarte.',
    images: ['/illustration-1.jpg'],
  },
  alternates: {
    canonical: 'https://jugar.cresi.com.ar/trivias',
  },
};

export default function TriviasCatalogLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return children as JSX.Element;
}
