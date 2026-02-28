/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', '-apple-system', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        ink:     'rgb(var(--ink)     / <alpha-value>)',
        paper:   'rgb(var(--paper)   / <alpha-value>)',
        muted:   'rgb(var(--muted)   / <alpha-value>)',
        border:  'rgb(var(--border)  / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        accent:  'rgb(var(--accent)  / <alpha-value>)',
        breaking: '#e63232',
        admin: '#0A0A0A',
        'admin-hover': '#1e1e1e',
        g100: 'rgb(var(--g100) / <alpha-value>)',
        g200: 'rgb(var(--g200) / <alpha-value>)',
        g300: 'rgb(var(--g300) / <alpha-value>)',
        g400: 'rgb(var(--g400) / <alpha-value>)',
        g500: 'rgb(var(--g500) / <alpha-value>)',
        g600: 'rgb(var(--g600) / <alpha-value>)',
      },
      maxWidth: {
        article: '720px',
      },
      animation: {
        ticker: 'ticker 55s linear infinite',
        blink: 'blink 1.4s ease-in-out infinite',
      },
      keyframes: {
        ticker: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        blink: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.3', transform: 'scale(0.8)' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
      })
    },
  ],
}
