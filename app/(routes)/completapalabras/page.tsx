import type { Metadata } from "next";
import Lecciones from "./components/Lecciones";


export const metadata: Metadata = {
	title: "CrESI | Simulador Grooming",
	description:
		"Aprendé a cuidar tu salud mental y a estar alerta frente a cambios de ánimos.",
};

export default function LoveTestPage(): JSX.Element {
	return (
        <main className='mx-auto px-4 max-w-5xl'>
            <section className='lg:my-20'>
                    <p className="font-medium text-primary">
                        Aprender más, para una salud mejor
                    </p>
                    <h1 className='my-4 text-6xl font-bold'>Completapalabras</h1>
                    <h2 className='text-xl text-gray-700'>
                    Completá el texto con la palabra correcta y aprendé más sobre sexualidad. 
                    </h2>

                <Lecciones />
            </section>
        </main>
	);
}