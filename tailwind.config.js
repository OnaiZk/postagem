/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        eletro: {
          primary: '#FF4F00',
          orangeHover: '#E04500',
          black: '#000000',
          dark: '#121214',
          darkCard: '#18181B',
          darkBorder: '#27272A',
          white: '#FFFFFF',
          purple: '#4E18FF',
          yellow: '#FECC14',
          pink: '#F577ED',
          green: '#3D7700',
          lightGreen: '#4ade80',
          grayBg: '#F8F9FA',
          grayLight: '#F3F4F6',
          grayBorder: '#E4E4E7',
          grayText: '#71717A',
          graySubtext: '#A1A1AA'
        }
      },
      fontFamily: {
        sans: ['"Rethink Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'sm': '4px',
        'md': '12px',
        'lg': '20px',
      },
      boxShadow: {
        'eletro': '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'eletro-lg': '0 10px 30px -4px rgba(0, 0, 0, 0.12)',
        'eletro-glow': '0 0 25px rgba(255, 79, 0, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
