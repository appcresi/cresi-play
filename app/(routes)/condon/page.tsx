import type { Metadata } from "next";
import Condon from "./components/condon";

export const metadata: Metadata = {
  title: "CrESI | Prevención, uso del preservativo",
  description:
    "Aprendé sobre el uso correcto del preservativo.",
};

export default function Completeword(): JSX.Element {
  return (
  <main className="min-h-screen bg-gray-100 font-sans">
        {/* Contenido principal */}
        <div className="max-w-5xl mx-auto px-4 mt-8">
          <div className="bg-white rounded-lg shadow-md p-6">
                <Condon />
          </div>
        </div>
    </main>
  );
}