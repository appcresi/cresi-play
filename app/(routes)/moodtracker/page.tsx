import type { Metadata } from "next";
import MoodTracker from "./components/MoodTracker";
import React from 'react';

export const metadata: Metadata = {
  title: "CrESI | Diario de Emociones",
  description:
    "Aprendé a reconocer tus emociones y llevar un registros de tus estados de ánimo.",
};

export default async function Completeword(): Promise<JSX.Element> {
  
  return (
        <main className="min-h-screen bg-gray-100 font-sans">
          {/* Contenido principal */}
          <div className="max-w-5xl mx-auto px-4 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <MoodTracker />
            </div>
          </div>
        </main>
  );
}