import type { Metadata } from "next";
import UserProfileProps from "./components/UserProfileProps";
import React from 'react';

export const metadata: Metadata = {
  title: "CrESI | Perfil de Usuario",
  description:
    "Aprendé sobre sexualidad completando las palabras de las lecciones.",
};

export default async function Completeword(): Promise<JSX.Element> {
  
  return (
    <main className="min-h-screen bg-[#FFE5E5] font-bold relative overflow-hidden">
      <div className="mx-auto px-4 max-w-5xl relative">
        <div className="my-8 transform -rotate-1">
          <div className="bg-white border-4 border-black rounded-lg p-6 
                         shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="mt-8 sm:mt-12">
            <UserProfileProps />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}