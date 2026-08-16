import type { Metadata } from "next";
import Condon from "./components/condon";

export const metadata: Metadata = {
  title: "ESI | Prevención, uso del preservativo | CrESI",
  description:
    "Aprendé sobre el uso correcto del preservativo.",
  alternates: {
    canonical: "https://jugar.cresi.com.ar/condon",
  },
};

export default function CondonPage(): JSX.Element {
  return <Condon />;
}