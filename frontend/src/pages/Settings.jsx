import { useState } from 'react'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useTheme from '../hooks/useTheme'
import {
  getCurrencyName,
  getCurrencySymbol,
  getSupportedCurrencies,
  loadCurrency,
  saveCurrency,
} from '../utils/currency'

export default function Settings() {
  useCurrencyTick()
  const { isDark, themes, colorThemeId, setColorTheme } = useTheme()
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api'
  const [currency, setCurrency] = useState(loadCurrency)
  const currencies = getSupportedCurrencies()

  const handleCurrencyChange = (e) => {
    const code = e.target.value
    setCurrency(code)
    saveCurrency(code)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-muted">About this app</p>
      </div>

      <div className="max-w-3xl space-y-4 rounded-xl border border-card-border bg-card p-5">
        <div>
          <h2 className="text-sm font-semibold text-ink">Appearance</h2>
          <p className="text-xs text-muted">
            Pick a color theme - it applies instantly and works in both light and dark mode (use the sun/moon
            button in the top-right to switch modes).
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {themes.map((t) => {
            const tokens = isDark ? t.dark : t.light
            const active = t.id === colorThemeId
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setColorTheme(t.id)}
                aria-pressed={active}
                className={`relative flex flex-col gap-2 rounded-xl border bg-card p-3 text-left transition-colors ${
                  active ? 'border-accent ring-2 ring-accent/20' : 'border-card-border hover:border-accent/40'
                }`}
              >
                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
                    ✓
                  </span>
                )}
                <div className="flex h-10 overflow-hidden rounded-lg border" style={{ borderColor: tokens.cardBorder }}>
                  <span className="h-full w-1/3" style={{ backgroundColor: tokens.sidebar }} title="Sidebar" />
                  <span className="h-full w-1/3" style={{ backgroundColor: tokens.accent }} title="Accent" />
                  <span className="h-full w-1/3" style={{ backgroundColor: tokens.pageBg }} title="Background" />
                </div>
                <span className="text-xs font-medium text-ink">{t.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-lg space-y-4 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold text-ink">Currency</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Display currency</label>
          <select
            value={currency}
            onChange={handleCurrencyChange}
            className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code} — {getCurrencySymbol(code)} — {getCurrencyName(code)}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-muted">
            This only changes how amounts are displayed ({getCurrencySymbol(currency)}). It does not convert any
            values.
          </p>
        </div>
      </div>

      <div className="max-w-lg space-y-4 rounded-xl border border-card-border bg-card p-5 text-sm text-muted">
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">Backend URL</span>
          <code className="rounded bg-card-border px-2 py-1 text-xs text-ink">{backendUrl}</code>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">Categories</span>
          <span>40 categories across 7 groups</span>
        </div>
        <p className="pt-2 text-xs text-muted">
          Budgets, theme, color palette, and your selected currency are stored locally in your browser and aren't
          shared between devices.
        </p>
      </div>
    </div>
  )
}
