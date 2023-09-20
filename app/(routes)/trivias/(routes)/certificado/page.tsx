import { Metadata } from "next";
import TriviaCertificate from "../../components/TriviaCertificate";

export const metadata: Metadata = {
  title: "Certificado de aprobación | CrESI",
  description: "Descarga aquí tu certificado de aprobación de la trivia de CrESI",
  robots: "noindex",
}

export default function Certificate (): JSX.Element {
  return (
    <TriviaCertificate />
  )
}