/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        theme: {
          page: '#FFFBFC',
          section: '#FFF5F7',
          surface: '#FFFFFF',
          border: '#F3E3E8',
          heading: '#1F1720',
          body: '#4B4350',
          muted: '#8A8190',
          rose: {
            DEFAULT: '#E11D48',
            hover: '#BE123C',
            soft: '#FFE4EA',
            subtle: '#FFF1F4',
          },
          success: {
            text: '#1F8A5B',
            bg: '#E8F6EF',
            border: '#CBEBDC',
          },
          warning: {
            text: '#B7791F',
            bg: '#FDF4E3',
            border: '#F5E3BD',
          },
          danger: {
            text: '#B42318',
            bg: '#FDECEA',
            border: '#F8CCC7',
          },
          info: {
            text: '#5B5BD6',
            bg: '#EEEEFE',
            border: '#D8D8FC',
          }
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(31,23,32,.04), 0 8px 24px rgba(225,29,72,.04)',
        hover: '0 2px 4px rgba(31,23,32,.06), 0 12px 28px rgba(225,29,72,.07)',
        subtle: '0 1px 2px rgba(31,23,32,.04)',
      },
      borderRadius: {
        card: '16px',
      }
    },
  },
  plugins: [],
}
