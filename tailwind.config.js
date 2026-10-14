/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      /* desktop layout starts at 1100px, so every portrait iPad (768-1032px) gets the same stacked layout */
      screens: { lg: '1100px' },
      /* The old CSS variables (--p1 … --p9, --accent …) become theme colours.
         Use them as text-p9, bg-p7, border-accent, etc.
         Old token → new class:
           on-light-heading #212529 → p9     on-light-body #495057 → p7
           on-light-muted   #6c757d → p6     on-light-border #ced4da → p4
           on-dark-heading  #f8f9fa → p1     on-dark-body #dee2e6 → p3
           on-dark-muted    #adb5bd → p5     on-dark-border #495057 → p7 */
      colors: {
        p1: '#f8f9fa', p2: '#e9ecef', p3: '#dee2e6', p4: '#ced4da', p5: '#adb5bd',
        p6: '#6c757d', p7: '#495057', p8: '#343a40', p9: '#212529',
        accent: { DEFAULT: '#5a8a6a', light: '#dff0e6' },
        mint: '#8fc4a2',
        paper: '#fbfcfa',
        line: 'rgba(90,138,106,.28)',
        deep: '#14211a',
        'deep-2': '#254033',
        /* pre-mixed colours (these were color-mix() calls in the old CSS) */
        'field-focus': '#4b5659',
        'field-invalid': '#5f5359',
        'slot-active': '#4c5c5b',
        'warn-bg': '#645458',
      },
      fontFamily: {
        display: ["'DM Serif Display'", 'serif'],
        body: ['Inter', 'sans-serif'],
        logo: ['Caveat', 'cursive'],
      },
      keyframes: {
        heroStatsIn: {
          from: { opacity: '0', transform: 'translateY(40px) scale(.97)' },
          to: { opacity: '1', transform: 'none' },
        },
        bentoIn: {
          from: { opacity: '0', transform: 'translateY(18px) scale(.97)' },
          to: { opacity: '1', transform: 'none' },
        },
        dpFloat: { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(30px,24px)' } },
        cnFloat: { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(-28px,26px)' } },
        ftFloat: { '50%': { transform: 'translate(-30px,26px)' } },
        dpSpin: { to: { transform: 'rotate(360deg)' } },
        dpPulse: { '70%': { boxShadow: '0 0 0 9px rgba(90,138,106,0)' }, '100%': { boxShadow: '0 0 0 0 rgba(90,138,106,0)' } },
        bkLivePulse: {
          '0%': { boxShadow: '0 0 0 0 rgba(61,220,118,.55)' },
          '70%': { boxShadow: '0 0 0 7px rgba(61,220,118,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(61,220,118,0)' },
        },
        ftScroll: { to: { transform: 'translateX(-50%)' } },
      },
      animation: {
        'hero-stats-in': 'heroStatsIn 1s cubic-bezier(.16,1,.3,1) .15s both',
        'bento-in': 'bentoIn .55s cubic-bezier(.22,.61,.36,1) both',
        'dp-float': 'dpFloat 14s ease-in-out infinite',
        'dp-float-rev': 'dpFloat 18s ease-in-out infinite reverse',
        'cn-float': 'cnFloat 16s ease-in-out infinite',
        'cn-float-rev': 'cnFloat 20s ease-in-out infinite reverse',
        'ft-float': 'ftFloat 16s ease-in-out infinite',
        'ft-float-rev': 'ftFloat 20s ease-in-out infinite reverse',
        'dp-spin': 'dpSpin 60s linear infinite',
        'dp-pulse': 'dpPulse 2.4s ease-out infinite',
        'bk-live-pulse': 'bkLivePulse 1.8s ease-out infinite',
        'ft-scroll': 'ftScroll 38s linear infinite',
      },
    },
  },
  plugins: [],
};