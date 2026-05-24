// app/page.tsx
import type { Metadata } from 'next';
import Impostor from './components/Impostor';
import React from 'react';

export const metadata: Metadata = {
  title: "ESI | Impostor ESI | CrESI",
  description:
    'Adiviná la palabra oculta escondida detrás de la definición.',
};

export default async function Completeword(): Promise<JSX.Element> {
  
  return (
    <main className="min-h-screen bg-gray-100 font-sans">
                  {/* Contenido principal */}
          <div className="max-w-5xl mx-auto px-4 mt-8">
            <div className="bg-white rounded-lg shadow-md p-6">
                <Impostor />
            </div>
          </div>
    </main>
  );
}