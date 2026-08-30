import type { Metadata } from "next";
import { Suspense } from "react";
import Biopuzzle from "./components/Biopuzzle";

export const metadata: Metadata = {
  title: "ESI | Biopuzzle | CrESI",
  description:
    "Aprendé sobre las partes del cuerpo humano.",
  alternates: {
    canonical: "https://jugar.cresi.com.ar/biopuzzle",
  },
};

export default function BiopuzzlePage(): JSX.Element {
  return (
    <Suspense>
      <Biopuzzle />
    </Suspense>
  );
}
