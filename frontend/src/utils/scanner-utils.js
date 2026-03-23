/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'royal': {
          DEFAULT: '#1E3A8A',
          dark: '#172554',
          light: '#3B82F6',
        },
        'gold': {
          DEFAULT: '#D4AF37',
          light: '#F5D061',
          dark: '#B8860B',
        },
        'night': {
          DEFAULT: '#0F172A',
          light: '#1E293B',
          dark: '#020617',
        }
      },
      fontFamily: {
        'jakarta': ['Plus Jakarta Sans', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
