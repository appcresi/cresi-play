import { IconArrowRight } from "@tabler/icons-react";
import type { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from "react";

interface ButtonProps
	extends DetailedHTMLProps<
		ButtonHTMLAttributes<HTMLButtonElement>,
		HTMLButtonElement
	> {
	variant: "primary" | "secondary" | "outline" | "ghost" | "danger";
	children: ReactNode;
	icon?: ReactNode;
}

const buttonBaseStyle =
	"group px-4 py-2 flex gap-x-2 justify-center items-center rounded-full font-semibold transition duration-150";

const buttonStyles: Record<ButtonProps["variant"], string> = {
	primary: buttonBaseStyle.concat(" ", "bg-primary text-white"),
	secondary: buttonBaseStyle.concat(" ", "bg-primary-light text-primary"),
	ghost: buttonBaseStyle.concat(" ", "bg-primary-light/60 text-primary-dark"),
	outline: buttonBaseStyle.concat(
		" ",
		"border-2 border-primary text-primary-dark",
	),
	danger: buttonBaseStyle.concat(" ", "bg-red-600 text-white"),
};

export default function Button({
	variant,
	children,
	icon,
	type = "button",
	className,
	...props
}: ButtonProps): JSX.Element {
	return (
		<button
			type={type}
			className={buttonStyles[variant].concat(" ", className ?? "")}
			{...props}
		>
			{children}

			{typeof icon === "undefined" ? (
				<IconArrowRight className="transition duration-150 group-hover:translate-x-1" />
			) : (
				icon
			)}
		</button>
	);
}
