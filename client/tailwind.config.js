/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#07080a',
        'surface-2': '#0d0f12',
        'surface-3': '#141619',
        accent: 'var(--accent, #3b82f6)',
        'accent-soft': 'var(--accent-soft, #3b82f620)',
      }
    }
  },
  plugins: [],
}
