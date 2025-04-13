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
      <div className="bg-white border-4 border-black p-8 rounded-lg shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] 
                     transform -rotate-2 hover:rotate-0 transition-all duration-300">
        <p className="text-[#FF6B6B] text-xl font-black mb-2">
          Leer más, para aprender mejor
        </p>
        
        <h1 
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-[#7c3aed] mb-4 transform hover:scale-105 transition-transform"
          style={{ textShadow: '3px 3px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000' }}
        >
          ¡Cuentos!
        </h1>
        
        <h2 className="hidden md:block text-xl text-gray-700 leading-relaxed">
          <span className="text-[#FF6B6B]">¡GENIAL!</span> ¡Es hora de leer un cuento para reflexionar! 
          <span className="text-[#4ADE80]">¡VAMOS!</span> Cada lectura es una nueva aventura para conocer extraordinarios mundos. 
          <span className="text-[#FFD93D]">¡YA!</span> ¡Elegí el tema y leé lo que más te guste!
        </h2>
      </div>
      <Story />
      </div>
    </main>
  );
}