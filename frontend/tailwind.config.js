/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // We will use a toggle in Topbar
  theme: {
    extend: {
      colors: {
        royalblue: {
          dark: '#1E3A8A',
          DEFAULT: '#2563EB',
          light: '#60A5FA',
        },
        royal: {
          dark: '#1E3A8A',
          DEFAULT: '#2563EB',
          light: '#60A5FA',
        },
        gold: {
          dark: '#B8860B',
          DEFAULT: '#D4AF37',
          light: '#FDE047',
        }
      },
      fontFamily: {
        jakarta: ['"Plus Jakarta Sans"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
