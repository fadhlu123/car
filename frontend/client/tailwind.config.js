/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#121212', // Neutral graphite black, zero color tint
        },
        accent: {
          DEFAULT: '#dc2626', // Red 600
          hover: '#991b1b' // Red 800
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'smoke': {
          '0%': { backgroundPosition: '0% 0%', opacity: 0.3 },
          '50%': { opacity: 0.5 },
          '100%': { backgroundPosition: '100% 100%', opacity: 0.3 },
        },
        'light-sweep': {
          '0%': { transform: 'translateX(-100%) skewX(-15deg)' },
          '100%': { transform: 'translateX(200%) skewX(-15deg)' },
        },
        'particle-float': {
          '0%': { transform: 'translateY(0) scale(1)', opacity: 0 },
          '50%': { opacity: 0.6 },
          '100%': { transform: 'translateY(-100px) scale(0)', opacity: 0 },
        }
      },
      animation: {
        'smoke': 'smoke 20s ease-in-out infinite alternate',
        'light-sweep': 'light-sweep 5s ease-in-out infinite',
        'particle-float': 'particle-float 4s ease-in infinite',
      }
    },
  },
  plugins: [],
}
