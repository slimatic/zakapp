/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'zakat-green': {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
        },
        'islamic-gold': {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#d97706',
        }
      }
    },
  },
  plugins: [],
}