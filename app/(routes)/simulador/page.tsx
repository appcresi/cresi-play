import type { Metadata } from "next";
import ChatSimulator from "./components/ChatSimulator";


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
                    <h1 className='my-4 text-6xl font-bold'>Simulador de Grooming</h1>
                    <h2 className='text-xl text-gray-700'>
            Este simulador está destinado a enseñar a niños y adolescentes cómo identificar y evitar situaciones de grooming en línea, practicando respuestas seguras.
            </h2>

                <ChatSimulator />
            </section>
        </main>
	);
}
