import type { Metadata } from "next";
import BuscadorClient from "./components/BuscadorClient";

export const metadata: Metadata = {
  title: "ESI | Buscador de Preguntas | CrESI",
  description:
    "Buscá entre nuestro banco de preguntas sobre educación sexual integral por palabra clave.",
};

export default function BuscadorPage(): JSX.Element {
  return <BuscadorClient />;
}