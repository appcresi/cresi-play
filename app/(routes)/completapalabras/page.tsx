// Página principal: page.tsx
import type { Metadata } from "next";
import Lecciones from "./components/Lecciones";

export const metadata: Metadata = {
  title: "CrESI | Simulador Grooming",
  description:
    "Aprendé a cuidar tu salud mental y a estar alerta frente a cambios de ánimos.",
};

export default function LoveTestPage(): JSX.Element {
  return (
    <main className='mx-auto px-4 sm:px-6 max-w-5xl'>
      <section className='py-8 sm:py-12 lg:py-20'>
        <div className="space-y-4">
          <p className="font-medium text-primary text-sm sm:text-base">
            Aprender más, para una salud mejor
          </p>
          <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight'>
            Completapalabras
          </h1>
          <h2 className='text-lg sm:text-xl text-gray-700 max-w-2xl'>
            Completá el texto con la palabra correcta y aprendé más sobre sexualidad.
          </h2>
        </div>

        <div className="mt-8 sm:mt-12">
          <Lecciones />
        </div>
      </section>
    </main>
  );
}