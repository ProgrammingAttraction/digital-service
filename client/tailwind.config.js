/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme_color1: '#0a3d62',
        theme_color2: '#3c6382',
        theme_color3: '#60a3bc',
      },
      fontFamily: {
        anek1: ['"Anek Bangla"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}