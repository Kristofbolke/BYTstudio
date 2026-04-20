// tailwind.config.js — Tailwind configuratie voor BYT Studio
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0a0a0a',
        accent:  '#78C833',
        surface: '#f4f4f5',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
