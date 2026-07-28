// tailwind.config.js — BYT Studio officiële huisstijl
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:   '#0B0F0E',
        black: '#000000',
        green: {
          DEFAULT: '#22C35D',
          600: '#17A84B',
          300: '#7BDFA3',
          50:  '#E9F9EF',
        },
        paper: '#F4F6F5',
        white: '#FFFFFF',
        g: {
          50:  '#F2F4F3',
          100: '#E7EBE9',
          200: '#D5DAD8',
          300: '#B7BEBB',
          400: '#929996',
          500: '#6B726F',
          600: '#4D534F',
          700: '#373C39',
          800: '#252926',
          900: '#151817',
        },
        amber: {
          DEFAULT: '#FFB020',
          50:  '#FFF3DD',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        sans:    ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        brand: '14px',
      },
    },
  },
  plugins: [],
}
