import type { Metadata } from "next";
import Lecciones from "./components/Lecciones";

export const metadata: Metadata = {
  title: "ESI | Completapalabras | CrESI",
  description:
    "Aprendé sobre sexualidad completando las palabras de las lecciones.",
};

export default function CompletewordPage(): JSX.Element {
  return <Lecciones />;
}
