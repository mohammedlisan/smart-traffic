/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: 'rgb(var(--n950) / <alpha-value>)', 900: 'rgb(var(--n900) / <alpha-value>)',
          800: 'rgb(var(--n800) / <alpha-value>)', 700: 'rgb(var(--n700) / <alpha-value>)',
          600: 'rgb(var(--n600) / <alpha-value>)',
        },
        slate: {
          100: 'rgb(var(--s100) / <alpha-value>)', 200: 'rgb(var(--s200) / <alpha-value>)',
          300: 'rgb(var(--s300) / <alpha-value>)', 400: 'rgb(var(--s400) / <alpha-value>)',
          500: 'rgb(var(--s500) / <alpha-value>)', 600: '#475569', 700: '#334155',
        },
        lvl: { low: '#22c55e', moderate: '#eab308', high: '#f97316', severe: '#ef4444' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'] },
    },
  },
  plugins: [],
}
