import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
	content: [
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-mona-sans)"],
			},
			colors: {
				primary: {
					DEFAULT: colors.violet[600],
					dark: colors.violet[900],
					light: colors.violet[100],
				},
			},
		},
	},
	plugins: [],
};
export default config;
