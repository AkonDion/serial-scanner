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
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },
        background: {
          DEFAULT: '#000000',
          light: '#262626',
        },
        surface: {
          DEFAULT: '#2D2D2D',
          light: '#383838',
        },
      },
      backdropBlur: {
        'xs': '2px',
      },
    },
  },
  plugins: [],
} 