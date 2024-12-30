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
	"group inline-flex items-end justify-end gap-x-2 rounded-full px-4 py-2 font-semibold transition-all duration-150";

const buttonStyles: Record<ButtonProps["variant"], string> = {
	primary: buttonBaseStyle.concat(" ", "bg-blue-600 text-white hover:bg-blue-700"),
	secondary: buttonBaseStyle.concat(" ", "bg-blue-100 text-blue-600 hover:bg-blue-200"),
	ghost: buttonBaseStyle.concat(" ", "bg-blue-50 text-blue-800 hover:bg-blue-100"),
	outline: buttonBaseStyle.concat(
		" ",
		"bg-red-600 text-white hover:bg-red-700",
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
				<IconArrowRight className="transition-transform duration-150 group-hover:translate-x-1" />
			) : (
				icon
			)}
		</button>
	);
}
