/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff9ff', 100: '#def2ff', 200: '#b6e6ff', 300: '#75d3ff',
          400: '#2cbcff', 500: '#0ea5e9', 600: '#0284c7', 700: '#036ba1',
          800: '#075985', 900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}
