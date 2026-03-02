/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      screens: {
        'xs': '375px',
      },
      colors: {
        brand: {
          DEFAULT: '#008080',
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f0e4',
          300: '#5edfcf',
          400: '#2cc9b6',
          500: '#0dae9c',
          600: '#008080',
          700: '#006b6b',
          800: '#005555',
          900: '#004040'
        },
        accent: {
          DEFAULT: '#FFBF00',
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#f5c518',
          500: '#FFBF00',
          600: '#E1AD01',
          700: '#a37800',
          800: '#855f00',
          900: '#6b4b00'
        },
        gold: {
          DEFAULT: '#FFBF00',
          50: '#fffdf0',
          100: '#fff9d6',
          200: '#fff0a3',
          300: '#ffe566',
          400: '#ffd633',
          500: '#FFBF00',
          600: '#E1AD01',
          700: '#B38B00',
          800: '#856800',
          900: '#574500'
        },
        dark: {
          DEFAULT: '#2F353B',
          50: '#f6f7f8',
          100: '#e2e4e7',
          200: '#c5c9cf',
          300: '#a1a8b1',
          400: '#7d8694',
          500: '#5e6772',
          600: '#4a525c',
          700: '#3d444d',
          800: '#2F353B',
          900: '#252a2f'
        },
        body: '#2D2D2D'
      }
    }
  },
  plugins: []
};