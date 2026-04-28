/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ligma: {
          bg: '#0a0a0f',
          panel: '#1a1a2e',
          accent: '#e94560',
          deepblue: '#0f3460',
          purple: '#533483',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        ui: ['Sora', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
