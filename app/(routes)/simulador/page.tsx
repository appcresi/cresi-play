import type { Metadata } from "next";
import ChatSimulator from "./components/ChatSimulator";
import React from 'react';

export const metadata: Metadata = {
  title: "ESI | Completapalabras | CrESI",
  description:
    "Aprendé sobre sexualidad completando las palabras de las lecciones.",
};

export default async function Completeword(): Promise<JSX.Element> {
  
  return (
    <main className="min-h-screen bg-gray-100 font-sans">
                  {/* Contenido principal */}
          <div className="max-w-5xl mx-auto px-4 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <ChatSimulator />
            </div>
          </div>
    </main>
  );
}