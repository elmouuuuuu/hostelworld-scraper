import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#F1F2F3',
          100: '#DEE1E4',
          200: '#C2C7CD',
          300: '#9AA2AB',
          500: '#5B6670',
          700: '#2C3844',
          900: '#12181F',
        },
        paper: {
          50: '#F4F3EE',
          100: '#EBE9E1',
        },
        teal: {
          50: '#E7F2F0',
          100: '#C7E1DC',
          600: '#146B64',
          700: '#0E4F4A',
          800: '#0A3936',
        },
        amber: {
          400: '#E5A54A',
          500: '#D98E2B',
          600: '#B8721E',
        },
        stamp: {
          50: '#FBEAE6',
          600: '#B3402B',
          700: '#8F3222',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui'],
        body: ['var(--font-body)', 'ui-sans-serif', 'system-ui'],
        data: ['var(--font-data)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
