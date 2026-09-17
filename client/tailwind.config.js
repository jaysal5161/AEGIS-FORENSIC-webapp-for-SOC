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
        soc: {
          bg: '#0a0d14',
          surface: '#0f1422',
          card: '#141b2d',
          cardHover: '#1c253d',
          border: '#1f293d',
          borderLight: '#2e3d5b',
          accent: '#00f2fe',
          neon: '#10b981',
          danger: '#f43f5e',
          warning: '#f59e0b',
          info: '#38bdf8',
          purple: '#a855f7'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Roboto Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
