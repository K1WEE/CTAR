/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        // Sarabun is a looped Thai typeface with clear counters and familiar
        // shapes for older readers; keep Noto Sans Thai and Inter as fallbacks.
        sans: ['Sarabun', 'Noto Sans Thai', 'Inter', 'sans-serif'],
      },
      fontSize: {
        // Semantic typography tokens keep important text readable for older users.
        body: ['1rem', { lineHeight: '1.5' }],
        'body-lg': ['1.125rem', { lineHeight: '1.625' }],
        label: ['1rem', { lineHeight: '1.5' }],
        caption: ['0.875rem', { lineHeight: '1.5' }],
        button: ['1.125rem', { lineHeight: '1.5' }],
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      spacing: {
        // h-18/top-18 are used for the game balloon sizing
        '18': '4.5rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-up': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        // animate-fade-in / animate-scale-up are referenced across components
        'fade-in': 'fade-in 250ms ease-out both',
        'scale-up': 'scale-up 300ms ease-out both',
      },
      colors: {
        // Calm clinical dark surfaces. brand-dark is the dark-mode page body;
        // brand-card sits one step lighter for panels. Both are fully opaque —
        // the product brief calls for solid backgrounds, not frosted glass.
        'brand-dark': '#0f172a',   // slate-900, replaces the cyberpunk navy #0B1120
        'brand-card': '#1e293b',   // slate-800, solid (was rgba 0.7 glass)
        'brand-accent': '#3b82f6', // clinical blue, unchanged for brand continuity
      }
    },
  },
  plugins: [],
}
