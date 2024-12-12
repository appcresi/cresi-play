import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

const config: Config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-mona-sans)']
      },
      colors: {
        primary: {
          DEFAULT: colors.violet[600],
          dark: colors.violet[900],
          light: colors.violet[100]
        }
      },
			keyframes: {
				'slide-in-right': {
				  '0%': { 
					opacity: '0', 
					transform: 'translateX(100%)' 
				  },
				  '100%': { 
					opacity: '1', 
					transform: 'translateX(0)' 
				  }
				}
			  },
			  animation: {
				'slide-in-right': 'slide-in-right 0.5s ease-out'
			  }
    }
  },
  plugins: []
}
export default config
