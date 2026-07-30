import type { Metadata } from "next";
import Biopuzzle from "./components/Biopuzzle";

export const metadata: Metadata = {
  title: "ESI | Biopuzzle | CrESI",
  description:
    "Aprendé sobre las partes del cuerpo humano.",
};

export default function BiopuzzlePage(): JSX.Element {
  return <Biopuzzle />;
}
