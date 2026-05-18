import type { Metadata } from "next";
import Biopuzzle from "./components/Biopuzzle";

export const metadata: Metadata = {
  title: "ESI | Biopuzzle | CrESI",
  description:
    "Aprendé sobre las partes del cuerpo humano.",
};

export default function Completeword(): JSX.Element {
  return (
    <main className="min-h-screen bg-gray-100 font-sans">
      {/* Contenido principal */}
      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <Biopuzzle />
        </div>
      </div>
    </main>
  );
}
