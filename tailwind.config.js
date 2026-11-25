/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: 'var(--color-navy)',
          dark: '#061729',
          light: '#113357'
        },
        ocean: {
          DEFAULT: 'var(--color-ocean)',
          hover: '#0f529f',
          subtle: 'var(--color-ocean-subtle)'
        },
        teal: {
          DEFAULT: 'var(--color-teal)',
          dark: '#008a8a',
          subtle: 'var(--color-teal-subtle)'
        },
        seaGreen: {
          DEFAULT: 'var(--color-sea-green)',
          dark: '#189057',
          subtle: 'var(--color-sea-green-subtle)'
        },
        signalOrange: {
          DEFAULT: 'var(--color-signal-orange)',
          dark: '#e0650d',
          subtle: 'var(--color-signal-orange-subtle)'
        },
        coralRed: {
          DEFAULT: 'var(--color-coral-red)',
          dark: '#c73338',
          subtle: 'var(--color-coral-red-subtle)'
        },
        sunshineYellow: {
          DEFAULT: 'var(--color-sunshine-yellow)',
          dark: '#d69e00',
          subtle: 'var(--color-sunshine-yellow-subtle)'
        },
        violet: {
          DEFAULT: 'var(--color-violet)',
          dark: '#5836d9',
          subtle: 'var(--color-violet-subtle)'
        },
        canvas: {
          DEFAULT: 'var(--color-bg)',
          card: 'var(--color-card-bg)',
          subtle: 'var(--color-bg-subtle)',
          border: 'var(--color-border)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)'
        }
      },
      fontFamily: {
        heading: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'solid-sm': '0 1px 2px rgba(0,0,0,0.06)',
        'solid': '0 2px 4px rgba(0,0,0,0.08)',
        'solid-md': '0 4px 8px rgba(0,0,0,0.12)',
        'solid-lg': '0 8px 16px rgba(0,0,0,0.16)',
      }
    },
  },
  plugins: [],
}
