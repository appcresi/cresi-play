import type { Metadata } from "next";
import Story from "./components/Story";

export const metadata: Metadata = {
  title: "ESI | Literatura | CrESI",
  description:
    "Leé cuentos breves y relatos que invitan a reflexionar sobre vínculos, derechos y emociones.",
};

export default function StoriesPage(): JSX.Element {
  return <Story />;
}