const STORAGE_KEY = 'theme'
const CHANGE_EVENT = 'theme-change'

export function loadTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: theme }))
}

export function onThemeChange(handler) {
  const listener = (e) => handler(e.detail)
  window.addEventListener(CHANGE_EVENT, listener)
  return () => window.removeEventListener(CHANGE_EVENT, listener)
}
