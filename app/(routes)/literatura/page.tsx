import type { Metadata } from "next";
import Story from "./components/Story";

export const metadata: Metadata = {
  title: "CrESI | Literatura",
  description:
    "Aprendé sobre distintos temas con las lecciones preparadas para que sepás todo sobre sexualidad.",
};

export default function StoriesPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-gray-100 font-sans">
          {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                  <Story />
            </div>
      </div>
    </main>
  );
}