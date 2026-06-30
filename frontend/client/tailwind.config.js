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
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617', // Very dark blue/black
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
        'hero-car': {
          '0%': { transform: 'scale(1) translateX(0) translateY(0)' },
          '100%': { transform: 'scale(1.08) translateX(-2%) translateY(1%)' },
        },
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
        'hero-car': 'hero-car 20s ease-in-out infinite alternate',
        'smoke': 'smoke 20s ease-in-out infinite alternate',
        'light-sweep': 'light-sweep 5s ease-in-out infinite',
        'particle-float': 'particle-float 4s ease-in infinite',
      }
    },
  },
  plugins: [],
}
