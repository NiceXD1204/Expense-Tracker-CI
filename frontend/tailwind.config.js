// Colors backed by CSS custom properties (set at runtime in src/utils/colorTheme.js
// and pre-paint in index.html) instead of fixed hex values, so a `colorTheme`
// choice in Settings can swap every `bg-accent` / `text-income` / etc class
// across the whole app instantly. The withOpacity() wrapper follows Tailwind's
// documented recipe for CSS-variable colors that still support opacity
// modifiers like `bg-accent/10` - the variable must hold "R G B" channels,
// not a hex string, for this to work.
function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `rgb(var(${variableName}) / ${opacityValue})`
    }
    return `rgb(var(${variableName}))`
  }
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: withOpacity('--color-sidebar'),
        accent: withOpacity('--color-accent'),
        'accent-hover': withOpacity('--color-accent-hover'),
        page: withOpacity('--color-page-bg'),
        card: withOpacity('--color-card-bg'),
        'card-border': withOpacity('--color-card-border'),
        ink: withOpacity('--color-text-primary'),
        muted: withOpacity('--color-text-secondary'),
        income: withOpacity('--color-income'),
        expense: withOpacity('--color-expense'),
        savings: withOpacity('--color-savings'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
