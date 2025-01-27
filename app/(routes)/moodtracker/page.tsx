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
    <main className="min-h-screen bg-[#FFE5E5] font-bold relative overflow-hidden">
      <div className="mx-auto px-4 max-w-5xl relative">
        <div className="my-8 transform -rotate-1">
          <div className="bg-white border-4 border-black rounded-lg p-6 
                         shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mt-8 sm:mt-12">
            <MoodTracker />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}