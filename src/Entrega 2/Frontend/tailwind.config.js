/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        orange: '#F26322',
        'orange-lt': '#F7813F',
        maroon: '#7A1D1D',
        cream: '#F5EFE6',
        'text-dark': '#1A1A1A',
        'text-mid': '#444444',
        'text-soft': '#777777',
        border: '#E0D8CC',
      },
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'dm-sans': ['"DM Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}