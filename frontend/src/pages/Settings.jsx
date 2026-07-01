import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../api/expenses'
import { useAuth } from '../context/AuthContext'
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
  const { t } = useTranslation()
  useCurrencyTick()
  const { isDark, themes, colorThemeId, setColorTheme } = useTheme()
  const { user, setUser } = useAuth()
  const backendUrl = import.meta.env.VITE_BACKEND_URL || '/api'
  const [currency, setCurrency] = useState(loadCurrency)
  const currencies = getSupportedCurrencies()

  const [household, setHousehold] = useState(null)
  const [householdLoading, setHouseholdLoading] = useState(false)
  const [newHouseholdName, setNewHouseholdName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [householdError, setHouseholdError] = useState('')

  useEffect(() => {
    if (user?.household_id) {
      setHouseholdLoading(true)
      api
        .get('/household/me')
        .then((r) => setHousehold(r.data))
        .catch(() => {})
        .finally(() => setHouseholdLoading(false))
    }
  }, [user?.household_id])

  const handleCurrencyChange = (e) => {
    const code = e.target.value
    setCurrency(code)
    saveCurrency(code)
  }

  const createHousehold = async () => {
    setHouseholdError('')
    try {
      const { data } = await api.post('/household/create', {
        name: newHouseholdName.trim() || 'My Household',
      })
      setHousehold(data)
      setUser((u) => ({ ...u, household_id: data.id }))
      setNewHouseholdName('')
    } catch (e) {
      setHouseholdError(e.response?.data?.detail || 'Error creating household')
    }
  }

  const joinHousehold = async () => {
    setHouseholdError('')
    try {
      const { data } = await api.post('/household/join', { invite_code: joinCode.trim() })
      setHousehold(data)
      setUser((u) => ({ ...u, household_id: data.id }))
      setJoinCode('')
    } catch (e) {
      setHouseholdError(e.response?.data?.detail || 'Invalid invite code')
    }
  }

  const leaveHousehold = async () => {
    if (!window.confirm(t('settings.leaveConfirm'))) return
    try {
      await api.post('/household/leave')
      setHousehold(null)
      setUser((u) => ({ ...u, household_id: null }))
    } catch (e) {
      setHouseholdError(e.response?.data?.detail || 'Error leaving household')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t('settings.title')}</h1>
        <p className="text-sm text-muted">{t('settings.subtitle')}</p>
      </div>

      {/* Appearance */}
      <div className="max-w-3xl space-y-4 rounded-xl border border-card-border bg-card p-5">
        <div>
          <h2 className="text-sm font-semibold text-ink">{t('settings.appearance')}</h2>
          <p className="text-xs text-muted">{t('settings.appearanceDesc')}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {themes.map((th) => {
            const tokens = isDark ? th.dark : th.light
            const active = th.id === colorThemeId
            return (
              <button
                key={th.id}
                type="button"
                onClick={() => setColorTheme(th.id)}
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
                <span className="text-xs font-medium text-ink">{th.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Currency */}
      <div className="max-w-lg space-y-4 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold text-ink">{t('settings.currency')}</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">{t('settings.displayCurrency')}</label>
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
            {t('settings.currencyNote').replace('(currency)', `(${getCurrencySymbol(currency)})`)}
          </p>
        </div>
      </div>

      {/* Shared Household */}
      <div className="max-w-lg space-y-4 rounded-xl border border-card-border bg-card p-5">
        <div>
          <h2 className="text-sm font-semibold text-ink">{t('settings.household')}</h2>
          <p className="text-xs text-muted">{t('settings.householdDesc')}</p>
        </div>

        {householdError && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{householdError}</p>
        )}

        {householdLoading ? (
          <p className="text-sm text-muted">{t('common.loading')}</p>
        ) : household ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-ink">{household.name}</span>
            </div>

            <div className="rounded-lg bg-card-border/20 p-3">
              <p className="text-xs text-muted">{t('settings.inviteCode')}</p>
              <code className="text-sm font-mono font-bold text-ink">{household.invite_code}</code>
              <p className="mt-1 text-xs text-muted">{t('settings.inviteCodeHint')}</p>
            </div>

            {household.members && household.members.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted">{t('settings.members')}</p>
                {household.members.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 py-1 text-sm text-ink">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                      {(m.display_name || m.email)[0].toUpperCase()}
                    </span>
                    {m.display_name || m.email}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={leaveHousehold}
              className="text-sm text-red-500 hover:underline"
            >
              {t('settings.leaveHousehold')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">{t('settings.notInHousehold')}</p>

            <div className="flex gap-2">
              <input
                value={newHouseholdName}
                onChange={(e) => setNewHouseholdName(e.target.value)}
                placeholder={t('settings.householdName')}
                className="flex-1 rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
              <button
                onClick={createHousehold}
                className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {t('settings.createHousehold')}
              </button>
            </div>

            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder={t('settings.joinCode')}
                className="flex-1 rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
              />
              <button
                onClick={joinHousehold}
                className="rounded-lg border border-accent px-3 py-2 text-sm font-medium text-accent hover:bg-accent/10"
              >
                {t('settings.joinHousehold')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="max-w-lg space-y-4 rounded-xl border border-card-border bg-card p-5 text-sm text-muted">
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">{t('settings.backendUrl')}</span>
          <code className="rounded bg-card-border px-2 py-1 text-xs text-ink">{backendUrl}</code>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-ink">{t('settings.categories')}</span>
          <span>{t('settings.categoriesCount')}</span>
        </div>
        <p className="pt-2 text-xs text-muted">{t('settings.localStorageNote')}</p>
      </div>
    </div>
  )
}
