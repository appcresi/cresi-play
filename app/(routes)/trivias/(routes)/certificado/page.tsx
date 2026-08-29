import { type Metadata } from 'next'
import Certificate from '../../components/Certificate'

// Deshabilita el pre-renderamiento estático porque html2pdf solo funciona en el cliente
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Certificado | CrESI',
  description: 'Descarga aquí tu certificado de CrESI (trivia, lección o cuento completado)',
  robots: 'noindex'
}

export default function CertificatePage (): JSX.Element {
  return (
    <Certificate />
  )
}