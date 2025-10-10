// app/page.tsx
import type { Metadata } from 'next';
import Wordgame from './components/Wordgame';
import React from 'react';

export const metadata: Metadata = {
  title: "CrESI | Pasapalabras",
  description:
    'Adiviná la palabra oculta escondida detrás de la definición.',
};

export default async function Completeword(): Promise<JSX.Element> {
  
  return (
    <main className="min-h-screen bg-gray-100 font-sans">
                  {/* Contenido principal */}
          <div className="max-w-5xl mx-auto px-4 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <Wordgame />
            </div>
          </div>
    </main>
  );
}