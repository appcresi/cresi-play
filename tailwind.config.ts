import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
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
        // Paleta del sistema "moderno" (home, /unirse, /clase, login docente)
        // — antes vivía como hex sueltos repetidos en esos archivos. Se va
        // extendiendo acá a medida que el resto de la app la adopta.
        cream: '#FFFBF8',
        ink: '#241B37',
        coral: {
          DEFAULT: '#FF6B6B',
          dark: '#E8514F'
        },
        pink: {
          DEFAULT: '#FFE5E5',
          light: '#FFD6D6'
        },
        gold: {
          DEFAULT: '#FFF3D6',
          light: '#FFEAB8',
          text: '#B9800A',
          accent: '#E8A400'
        },
        mint: {
          DEFAULT: '#E6F7F5',
          light: '#D3F2EE',
          text: '#238F85',
          accent: '#2FB8AC'
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
				},
				'pop': {
					'0%': { transform: 'scale(1)' },
					'40%': { transform: 'scale(1.35)' },
					'100%': { transform: 'scale(1)' }
				},
				'float-up-fade': {
					'0%': { opacity: '0', transform: 'translate(-50%, 4px) scale(0.8)' },
					'20%': { opacity: '1', transform: 'translate(-50%, -6px) scale(1.15)' },
					'100%': { opacity: '0', transform: 'translate(-50%, -34px) scale(1)' }
				},
				'shake-x': {
					'0%, 100%': { transform: 'translateX(0)' },
					'20%': { transform: 'translateX(-6px)' },
					'40%': { transform: 'translateX(6px)' },
					'60%': { transform: 'translateX(-4px)' },
					'80%': { transform: 'translateX(4px)' }
				}
			  },
			  animation: {
				'slide-in-right': 'slide-in-right 0.5s ease-out',
				'pop': 'pop 0.5s ease-out',
				'float-up-fade': 'float-up-fade 1s ease-out forwards',
				'shake-x': 'shake-x 0.5s ease-in-out'
			  }
    }
  },
  plugins: []
}
export default config
