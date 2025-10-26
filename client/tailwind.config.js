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
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',  // WCAG AA compliant on white
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        'islamic-gold': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',  // WCAG AA compliant on white
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },
      // Ensure focus rings have sufficient contrast
      ringWidth: {
        'DEFAULT': '3px',
      },
      ringColor: {
        'DEFAULT': '#fbbf24', // Gold with 3:1 contrast
      }
    },
  },
  plugins: [],
}