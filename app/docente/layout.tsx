import type { Metadata } from 'next';
import TeacherAreaShell from '@/components/teacher/TeacherAreaShell';

// Server component solo para poder exportar metadata — la lógica de guarda
// de rol y el header docente viven en TeacherAreaShell (cliente), ver ahí.
// Quien visita /docente sin sesión (incluidos los buscadores) ve siempre la
// landing pública de app/docente/page.tsx, nunca el dashboard privado.
export const metadata: Metadata = {
  title: 'Aula Virtual ESI para Docentes | CrESI',
  description:
    'Creá tu aula virtual de Educación Sexual Integral: sumá alumnos con un código de clase, elegí qué actividades y trivias ven, y seguí su progreso en vivo. Gratis, con tu cuenta de Google.',
  keywords: [
    'aula virtual ESI',
    'plataforma ESI para docentes',
    'panel docente ESI',
    'clase virtual educación sexual integral',
    'gestión de clase ESI',
    'personalizar contenido ESI',
    'seguimiento de progreso alumnos',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://jugar.cresi.com.ar/docente',
    siteName: 'CrESI',
    title: 'Aula Virtual ESI para Docentes | CrESI',
    description:
      'Creá tu clase, elegí qué actividades y trivias de ESI ven tus alumnos, y seguí su progreso en vivo. Gratis.',
    images: [
      {
        url: 'https://jugar.cresi.com.ar/illustration-1.jpg',
        width: 1200,
        height: 630,
        alt: 'CrESI - Aula Virtual ESI para Docentes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aula Virtual ESI para Docentes | CrESI',
    description:
      'Creá tu clase, elegí qué actividades de ESI ven tus alumnos, y seguí su progreso en vivo.',
    images: ['https://jugar.cresi.com.ar/illustration-1.jpg'],
  },
  alternates: {
    canonical: 'https://jugar.cresi.com.ar/docente',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TeacherAreaLayout({ children }: { children: React.ReactNode }) {
  return <TeacherAreaShell>{children}</TeacherAreaShell>;
}
