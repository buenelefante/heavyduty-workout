/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gym: {
          bg: '#090a0f',
          card: '#12141c',
          cardHover: '#181b26',
          border: '#232838',
          accent: '#10b981', // emerald energy
          accentHover: '#059669',
          gold: '#f59e0b',
          cyan: '#06b6d4',
          danger: '#ef4444',
          subtext: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'timer-ring': 'dash 1s linear infinite',
      }
    },
  },
  plugins: [],
}
