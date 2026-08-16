import type { Metadata } from "next";
import Lecciones from "./components/Lecciones";

export const metadata: Metadata = {
  title: "ESI | Completapalabras | CrESI",
  description:
    "Aprendé sobre sexualidad completando las palabras de las lecciones.",
  alternates: {
    canonical: "https://jugar.cresi.com.ar/completapalabras",
  },
};

export default function CompletewordPage(): JSX.Element {
  return <Lecciones />;
}
