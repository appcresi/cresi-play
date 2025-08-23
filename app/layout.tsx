import { type Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

import Analytics from '@/components/Analytics'
import Adsense from '@/components/Adsense'
import Header from '@/components/Header'
import Head from 'next/head';

// En tu layout principal:
<Head>
  {/* Preload de la imagen más crítica */}
  <link rel="preload" href="/trivia.svg" as="image" />
  <link rel="preload" href="/pasapalabras.svg" as="image" />
  <link rel="preload" href="/simulador.svg" as="image" />
</Head>

const monaSans = localFont({
  src: './fonts/Mona-Sans.woff2',
  display: 'swap',
  variable: '--font-mona-sans'
})

export const metadata: Metadata = {
  metadataBase: new URL("https://jugar.cresi.com.ar"),
  title: "CrESI | Jugar",
  icons: ['/cresi-logo.ico'],
  description:
    "Jugá a con nuestras trivias, completaspalabras, pasapalabras, y mucho más distribuidas en diferentes temáticas y niveles de dificultad. Aprendé mientras te divertís con CrESI.",
  keywords: [
    "CrESI",
    "trivia",
    "juegos educativos",
    "trivia didácticas",
    "educación sexual integral",
    "trivia ESI",
    "preguntas y respuestas",
    "juegos para jóvenes",
    "aprender jugando",
  ],
  openGraph: {
    title: "CrESI | Jugar",
    description:
      "Jugá a con nuestras trivias, completaspalabras, pasapalabras, y mucho más distribuidas en diferentes temáticas y niveles de dificultad. Aprendé mientras te divertís con CrESI.",
    url: "https://jugar.cresi.com.ar/trivias",
    siteName: "CrESI",
    images: [
      {
        url: "illustration-1.jpg",
        width: 1200,
        height: 630,
        alt: "CrESI Jugar - Recursos didáticos para aprender jugando.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CrESI | Trivia",
    description:
      "Jugá a responder a más de 700 preguntas, distribuidas en diferentes temáticas y niveles de dificultad. Aprendé mientras te divertís con CrESI.",
    images: ["illustration-1.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout ({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang='es' className={monaSans.className}>
      <body className='bg-[#FFE5E5]'>
        <Header />
        <main className="pt-16"> {/* Añadimos padding-top para dejar espacio para el header */}
          {children}
        </main>
        <Analytics />
        <Adsense />
      </body>
    </html>
  )
}