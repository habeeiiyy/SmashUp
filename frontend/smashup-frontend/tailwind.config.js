/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        github: {
          bg: '#0D1117',
          secondary: '#161B22',
          card: '#21262D',
          border: '#30363D',
          text: '#F0F6FC',
          secondaryText: '#8B949E',
          green: '#238636',
          purple: '#8957E5',
          orange: '#DB6D28',
          blue: '#388BFD',
          red: '#F85149',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        none: 'none',
      },
      animation: {
        none: 'none',
      },
    },
  },
  plugins: [],
}
