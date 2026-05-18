import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cesol: {
          50: '#fff8e6',
          100: '#ffedbd',
          200: '#ffda82',
          300: '#ffc345',
          400: '#f6a90d',
          500: '#d88b00',
          600: '#b86a00',
          700: '#934d07',
          800: '#793f0d',
          900: '#663611',
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
