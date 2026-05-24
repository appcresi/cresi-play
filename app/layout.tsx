import React from 'react'
import type { Metadata, Viewport  } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'

import Analytics from '@/components/Analytics'
import Adsense from '@/components/Adsense'
import Header from '@/components/Header'
import { AuthProvider } from '@/context/AuthContext'

const monaSans = localFont({
  src: './fonts/Mona-Sans.woff2',
  display: 'swap',
  variable: '--font-mona-sans'
})

export const metadata: Metadata = {
  metadataBase: new URL("https://jugar.cresi.com.ar"),

  title: "ESI | Juegos ESI Trivias, Pasapalabras y Más | CrESI",

  icons: [
    {
      rel: "icon",
      url: "/cresi-logo.ico",
    },
  ],

  description:
    "Juega trivias, pasapalabras y completaspalabras sobre ESI. Más de 700 preguntas educativas gratis. Aprende sobre Educación Sexual Integral mientras te diviertes con CrESI.",

  keywords: [
    "juegos ESI",
    "trivia ESI",
    "educación sexual integral",
    "juegos educativos",
    "trivias gratis",
    "pasapalabras ESI",
    "completaspalabras",
    "aprender jugando",
    "juegos para adolescentes",
    "preguntas y respuestas",
    "CrESI",
    "recursos educativos",
    "trivias didácticas",
  ],

  openGraph: {
    title: "Juegos ESI Gratis | Trivias y Pasapalabras - CrESI",
    description:
      "Juega trivias y pasapalabras sobre ESI. Más de 700 preguntas educativas gratis para aprender Educación Sexual Integral.",
    url: "https://jugar.cresi.com.ar",
    siteName: "CrESI - Jugar",
    locale: "es_AR",
    images: [
      {
        url: "https://jugar.cresi.com.ar/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Juegos ESI Gratis - CrESI Trivias y Pasapalabras",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Juegos ESI | Trivias Gratis - CrESI",
    description:
      "Juega trivias y pasapalabras sobre ESI. Aprende Educación Sexual Integral mientras te diviertes con CrESI.",
    images: ["https://jugar.cresi.com.ar/og-image.jpg"],
    site: "@appcresi",
    creator: "@appcresi",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  alternates: {
    canonical: "https://jugar.cresi.com.ar",
  },

  category: "education",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang='es' className={monaSans.className}>
      <head>
        {/* Preload de imágenes críticas */}
        <link rel="preload" href="/trivia.svg" as="image" />
        <link rel="preload" href="/pasapalabras.svg" as="image" />
        <link rel="preload" href="/simulador.svg" as="image" />
        
        {/* NUEVO: Schema.org - Organization */}
        <Script id="schema-org-organization" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": "CrESI",
            "url": "https://jugar.cresi.com.ar",
            "logo": "https://jugar.cresi.com.ar/cresi-logo.ico",
            "description": "Plataforma de juegos educativos sobre Educación Sexual Integral (ESI)",
            "sameAs": [
              "https://www.instagram.com/appcresi",
              "https://www.facebook.com/appcresi"
            ]
          })}
        </Script>
        
        {/* NUEVO: Schema.org - WebApplication */}
        <Script id="schema-org-webapp" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "CrESI - Juegos ESI",
            "url": "https://jugar.cresi.com.ar",
            "description": "Plataforma de juegos educativos sobre Educación Sexual Integral",
            "applicationCategory": "EducationalApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "ARS"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "1247"
            }
          })}
        </Script>
      </head>
      <body className='bg-[#f3f4f6]'>
        <AuthProvider>
          <Header />
          <main>
            {children}
          </main>
        </AuthProvider>
        <Analytics />
        <Adsense />
      </body>
    </html>
  )
}