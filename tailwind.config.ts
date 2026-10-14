import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      },
      colors: {
        brand: {
          blue: '#00529E',
          amber: '#F6A800',
          green: '#B3D236',
        },
      },
    },
  },
  plugins: [],
};

export default config;
