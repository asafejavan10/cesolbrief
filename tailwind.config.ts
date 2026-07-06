import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cesol: {
          50: '#fff5f5',
          100: '#ffebe9',
          200: '#ffd3cd',
          300: '#ffa293',
          400: '#ff664c',
          500: '#ea3817',
          600: '#d62227',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7b1928',
        },
        ink: '#1f2937',
      },
      boxShadow: {
        soft: '0 18px 50px rgba(31, 41, 55, 0.08)',
        card: '0 8px 24px rgba(31, 41, 55, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
