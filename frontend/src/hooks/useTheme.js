import { useCallback, useEffect, useState } from 'react'
import { THEMES } from '../constants/themes'
import { applyColorTheme, getResolvedHexTokens, loadColorTheme, onColorThemeChange, saveColorTheme } from '../utils/colorTheme'
import { loadTheme, onThemeChange, saveTheme } from '../utils/theme'

// Drives BOTH light/dark mode and the color palette (theme), since the two
// are independent axes that combine to resolve the actual colors in use.
// Every component that calls this hook gets its own state, but they all
// stay in sync via the localStorage + CustomEvent bus in utils/theme.js and
// utils/colorTheme.js (same pattern as useCurrencyTick) - and because
// ThemeToggle is always mounted (it lives in the always-rendered TopBar),
// there's always at least one instance applying CSS variables, so visiting
// a page that doesn't itself call useTheme() still re-themes correctly.
export default function useTheme() {
  const [theme, setTheme] = useState(loadTheme)
  const [colorThemeId, setColorThemeId] = useState(loadColorTheme)

  useEffect(() => onThemeChange(setTheme), [])
  useEffect(() => onColorThemeChange(setColorThemeId), [])

  useEffect(() => {
    applyColorTheme(colorThemeId, theme)
  }, [colorThemeId, theme])

  const toggle = useCallback(() => {
    saveTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme])

  const setColorTheme = useCallback((id) => {
    saveColorTheme(id)
  }, [])

  return {
    theme,
    isDark: theme === 'dark',
    toggle,
    colorThemeId,
    setColorTheme,
    themes: THEMES,
    resolved: getResolvedHexTokens(colorThemeId, theme),
  }
}
