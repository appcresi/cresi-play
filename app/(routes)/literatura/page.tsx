import type { Metadata } from "next";
import Story from "./components/Story";

export const metadata: Metadata = {
  title: "CrESI | Literatura",
  description:
    "Aprendé sobre distintos temas con las lecciones preparadas para que sepás todo sobre sexualidad.",
};

export default function StoriesPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-[#FFE5E5] font-bold relative overflow-hidden">
      <div className="mx-auto px-4 max-w-5xl relative">
      <Story />
      </div>
    </main>
  );
}