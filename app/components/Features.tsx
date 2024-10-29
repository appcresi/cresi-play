import {
	IconAB2,
	IconCards,
	IconPresentation,
	IconSchool,
	IconHeart
} from "@tabler/icons-react";
import Button from "../../components/Button"
import Link from "next/link";

interface Feature {
	title: string;
	description: string;
	icon: JSX.Element;
	route: string;
}

const features: Feature[] = [
	{
		title: "Trivias",
		description:
			"Jugá a nuestras trivias para aprender y poner a prueba tus conocimientos sobre distintas temáticas.",
		icon: <IconCards size={32} />,
		route: "/trivias",
	},
	{
		title: "Pasapalabras",
		description:
			"Descubrí todas las palabra nuevas escondidas detrás de la definición.",
		icon: <IconAB2	size={32} />,
		route: "/pasapalabras",
	},
	{
		title: "Nuevas Trivias",
		description:
			"¡Novedad! Jugá a la nueva trivia incorporada actualmente sobre: ALIMENTACIÓN",
		icon: <IconPresentation size={32} />,
		route: "https://jugar.cresi.com.ar/trivias/pregame/2305b679-1b36-444a-986f-1d4f6a797d51",
	}
];

export default function Features(): JSX.Element {
	return (
		<section className="mt-0 pt-0 w-full">
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                {features.map((feature) => (
                <li
                    className="p-4 flex flex-col rounded-3xl bg-primary-light h-full"
                    key={feature.title}
                >
                    <span className="mb-2 w-fit flex gap-2 items-center">
                    {feature.icon}
                    <p className="text-3xl font-semibold">{feature.title}</p>
                    </span>

                    <p className="text-lg text-gray-700">{feature.description}</p>

                    <div className="mt-auto flex justify-end">
                    <Link
                        className="mt-2 w-fit flex gap-2 items-center"
                        href={feature.route}
                    >
                        <Button variant="primary">Descubrir</Button>
                    </Link>
                    </div>
                </li>
                ))}
            </ul>
            <hr className="mt-2" />
            </section>

	);
}