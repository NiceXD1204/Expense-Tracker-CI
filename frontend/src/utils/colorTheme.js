import { DEFAULT_THEME_ID, SEMANTIC_COLORS, THEMES, getTheme } from '../constants/themes'

const STORAGE_KEY = 'colorTheme'
const CHANGE_EVENT = 'colortheme-change'

export function loadColorTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return THEMES.some((t) => t.id === stored) ? stored : DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}

export function saveColorTheme(id) {
  localStorage.setItem(STORAGE_KEY, id)
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: id }))
}

export function onColorThemeChange(handler) {
  const listener = (e) => handler(e.detail)
  window.addEventListener(CHANGE_EVENT, listener)
  return () => window.removeEventListener(CHANGE_EVENT, listener)
}

// "#3b82f6" -> "59 130 246" - Tailwind's documented pattern for CSS-variable
// colors that still support opacity modifiers like bg-accent/10.
export function hexToRgbChannels(hex) {
  const sanitized = hex.replace('#', '')
  const value = parseInt(sanitized, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `${r} ${g} ${b}`
}

const TOKEN_VAR_MAP = {
  sidebar: '--color-sidebar',
  accent: '--color-accent',
  accentHover: '--color-accent-hover',
  pageBg: '--color-page-bg',
  cardBg: '--color-card-bg',
  cardBorder: '--color-card-border',
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
}

const SEMANTIC_VAR_MAP = {
  income: '--color-income',
  expense: '--color-expense',
  savings: '--color-savings',
}

function resolveMode(mode) {
  return mode === 'dark' ? 'dark' : 'light'
}

// Writes every theme + semantic token as CSS custom properties on <html>,
// so every `bg-accent` / `text-income` / etc Tailwind class (configured to
// read from these variables) updates instantly with no re-render needed.
export function applyColorTheme(themeId, mode) {
  const theme = getTheme(themeId)
  const tokens = theme[resolveMode(mode)]
  const semantic = SEMANTIC_COLORS[resolveMode(mode)]
  const root = document.documentElement

  Object.entries(TOKEN_VAR_MAP).forEach(([key, varName]) => {
    root.style.setProperty(varName, hexToRgbChannels(tokens[key]))
  })
  Object.entries(SEMANTIC_VAR_MAP).forEach(([key, varName]) => {
    root.style.setProperty(varName, hexToRgbChannels(semantic[key]))
  })
}

// Plain hex values (not rgb-channel strings) for JS consumers that need an
// actual color string - Recharts fill/stroke props, inline styles, etc.
export function getResolvedHexTokens(themeId, mode) {
  const theme = getTheme(themeId)
  const tokens = theme[resolveMode(mode)]
  const semantic = SEMANTIC_COLORS[resolveMode(mode)]
  return { ...tokens, ...semantic }
}
