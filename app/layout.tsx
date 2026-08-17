import React from 'react'
import type { Metadata, Viewport  } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'
import InactivityGuard from '@/components/InactivityGuard';

import CookieConsent from '@/components/CookieConsent'
import { AuthProvider } from '@/context/AuthContext'

const monaSans = localFont({
  src: './fonts/Mona-Sans.woff2',
  display: 'swap',
  variable: '--font-mona-sans'
})

export const metadata: Metadata = {
  metadataBase: new URL("https://jugar.cresi.com.ar"),

  title: "CrESI | Aula Virtual y Juegos de Educación Sexual Integral",

  icons: [
    {
      rel: "icon",
      url: "/cresi-logo.ico",
    },
  ],

  description:
    "Aula virtual gratuita de ESI: docentes crean su clase y eligen qué contenido ven sus alumnos, que aprenden jugando con más de 700 preguntas, trivias y actividades sobre Educación Sexual Integral.",

  keywords: [
    "aula virtual ESI",
    "plataforma ESI para docentes",
    "panel docente ESI",
    "educación sexual integral",
    "juegos ESI",
    "trivia ESI",
    "clase virtual ESI",
    "recursos educativos ESI",
    "juegos educativos",
    "trivias gratis",
    "pasapalabras ESI",
    "completaspalabras",
    "aprender jugando",
    "juegos para adolescentes",
    "CrESI",
    "seguimiento de progreso alumnos",
  ],

  openGraph: {
    title: "CrESI | Aula Virtual ESI para Docentes y Alumnos",
    description:
      "Docentes: creá tu clase y personalizá qué actividades de ESI ve cada alumno. Alumnos: aprendé jugando con trivias y más de 700 preguntas educativas gratis.",
    url: "https://jugar.cresi.com.ar",
    siteName: "CrESI - Jugar",
    locale: "es_AR",
    images: [
      {
        url: "https://jugar.cresi.com.ar/illustration-1.jpg",
        width: 1200,
        height: 630,
        alt: "CrESI - Aula Virtual y Juegos de Educación Sexual Integral",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "CrESI | Aula Virtual ESI para Docentes y Alumnos",
    description:
      "Docentes: creá tu clase y personalizá el contenido de ESI. Alumnos: aprendé jugando con trivias y juegos gratis.",
    images: ["https://jugar.cresi.com.ar/illustration-1.jpg"],
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
        {/* Antes había 3 <link rel="preload"> hardcodeados acá — pero esto
            es el layout raíz, se aplica a TODAS las rutas, no solo a la
            home (la única página que realmente usa esas 3 imágenes). En
            cualquier otra ruta (juegos, panel docente, etc.) el navegador
            gastaba ancho de banda temprano en 3 recursos que nunca se
            usaban ahí, compitiendo con lo que sí importa en esa página —
            grave en conexiones lentas. Ahora WelcomeLanding usa next/image
            con `priority` en esas 3 tarjetas, que genera el preload
            automáticamente y solo en la página que corresponde. */}

        {/* Schema.org - Organization */}
        <Script id="schema-org-organization" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            "name": "CrESI",
            "url": "https://jugar.cresi.com.ar",
            "logo": "https://jugar.cresi.com.ar/cresi-logo.ico",
            "description": "Aula virtual y plataforma de juegos educativos sobre Educación Sexual Integral (ESI), con panel docente para personalizar contenido y seguir el progreso de la clase.",
            "sameAs": [
              "https://www.instagram.com/appcresi",
              "https://www.facebook.com/appcresi"
            ]
          })}
        </Script>

        {/* Schema.org - WebApplication */}
        <Script id="schema-org-webapp" type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "CrESI - Aula Virtual ESI",
            "url": "https://jugar.cresi.com.ar",
            "description": "Plataforma de Educación Sexual Integral con aula virtual: los docentes crean su clase, eligen qué actividades y trivias ven sus alumnos, y siguen su progreso en vivo.",
            "applicationCategory": "EducationalApplication",
            "audience": [
              {
                "@type": "EducationalAudience",
                "educationalRole": "teacher"
              },
              {
                "@type": "EducationalAudience",
                "educationalRole": "student"
              }
            ],
            "featureList": [
              "Creación de clases virtuales con código de acceso",
              "Personalización de qué actividades y trivias ve cada clase",
              "Seguimiento del progreso de cada alumno",
              "Más de 700 preguntas educativas sobre ESI",
              "Trivias, pasapalabras y juegos interactivos"
            ],
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "ARS"
            }
          })}
        </Script>
      </head>
      <body className='bg-[#f3f4f6]'>
        <AuthProvider>
          <main>
            <InactivityGuard />
            {children}
          </main>
        </AuthProvider>
        <CookieConsent />
      </body>
    </html>
  )
}