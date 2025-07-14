/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'shrink-to-cell': {
          '0%': {
            transform: 'scale(1.5) translateY(-20px)',
            opacity: '0.8'
          },
          '50%': {
            transform: 'scale(1.2) translateY(-10px)',
            opacity: '0.9'
          },
          '100%': {
            transform: 'scale(1) translateY(0)',
            opacity: '1'
          }
        },
        'drag-shrink': {
          '0%': {
            transform: 'scale(1)'
          },
          '100%': {
            transform: 'scale(0.8)'
          }
        }
      },
      animation: {
        'shrink-to-cell': 'shrink-to-cell 0.5s ease-out forwards',
        'drag-shrink': 'drag-shrink 0.3s ease-out forwards'
      }
    },
  },
  plugins: [],
}