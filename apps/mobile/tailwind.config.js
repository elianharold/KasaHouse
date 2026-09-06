/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // KasaHouse brand — a Ghanaian green.
        brand: {
          DEFAULT: '#0B7A4B',
          dark: '#085C39',
          light: '#E6F4EC',
        },
        accent: '#F2A104',
        ink: {
          DEFAULT: '#12211B',
          muted: '#5B6B63',
          faint: '#9AA8A1',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunken: '#F4F6F5',
        },
        danger: '#C0392B',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
