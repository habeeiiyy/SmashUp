/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#A855F7',
          pink: '#EC4899',
          orange: '#F97316',
          blue: '#3B82F6',
        },
        dark: {
          900: '#0a0a0c',
          850: '#0f0f13',
          800: '#18181b',
          750: '#27272a',
          700: '#3f3f46',
        },
        glass: {
          bg: 'rgba(24, 24, 27, 0.6)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.45)',
        'glow-purple': '0 0 40px rgba(168, 85, 247, 0.25)',
        'glow-pink': '0 0 40px rgba(236, 72, 153, 0.25)',
        'glow-blue': '0 0 40px rgba(59, 130, 246, 0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.2)' },
          '50%': { boxShadow: '0 0 60px rgba(236, 72, 153, 0.35)' },
        },
      },
    },
  },
  plugins: [],
}
