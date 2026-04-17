/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds (replacing "navy")
        navy: {
          DEFAULT: '#FFFFFF',
          light: '#FAF8FF',
          mid: '#F3EEFF',
        },
        // Primary accent (replacing "gold" → now violet/purple)
        gold: {
          DEFAULT: '#9333EA',
          light: '#A855F7',
          dark: '#7C3AED',
        },
        // Brand palette
        brand: {
          purple: '#9333EA',
          violet: '#7C3AED',
          pink: '#EC4899',
          rose: '#F43F5E',
          lavender: '#EDE9F7',
          blush: '#FDF2F8',
        },
        // Ink (text)
        ink: {
          DEFAULT: '#18103A',
          soft: '#5B4B8A',
          muted: '#9D88C2',
          faint: '#C9BBE5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(147, 51, 234, 0.08), 0 1px 2px -1px rgba(147, 51, 234, 0.06)',
        'card-md': '0 4px 12px 0 rgba(147, 51, 234, 0.10)',
        'card-lg': '0 8px 24px 0 rgba(147, 51, 234, 0.12)',
      },
    },
  },
  plugins: [],
}
