import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ACCOUNT_CATEGORIES } from '../constants/accountCategories'

export default function AccountModal({ open, entry, onClose, onSubmit }) {
  const { t } = useTranslation()
  const isEdit = Boolean(entry)
  const [name, setName] = useState('')
  const [type, setType] = useState('asset')
  const [category, setCategory] = useState(ACCOUNT_CATEGORIES[0].value)
  const [balance, setBalance] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    if (entry) {
      setName(entry.name)
      setType(entry.type)
      setCategory(entry.category || ACCOUNT_CATEGORIES[0].value)
      setBalance(String(entry.balance))
    } else {
      setName('')
      setType('asset')
      setCategory(ACCOUNT_CATEGORIES[0].value)
      setBalance('')
    }
    setError(null)
  }, [open, entry])

  if (!open) return null

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const parsedBalance = parseFloat(balance)
    if (!name.trim()) {
      setError('Please enter a name.')
      return
    }
    if (Number.isNaN(parsedBalance) || parsedBalance < 0) {
      setError('Please enter a balance of 0 or more.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), type, category, balance: parsedBalance })
      handleClose()
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Failed to save account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            {isEdit ? t('networth.editAccount') : t('networth.addAccount')}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted hover:bg-card-border hover:text-ink"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{t('networth.accountName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Checking, Mortgage, Car"
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">{t('common.type')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('asset')}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  type === 'asset' ? 'border-income bg-income/10 text-income' : 'border-card-border text-muted hover:border-income/40'
                }`}
              >
                {t('networth.asset')}
              </button>
              <button
                type="button"
                onClick={() => setType('liability')}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  type === 'liability' ? 'border-expense bg-expense/10 text-expense' : 'border-card-border text-muted hover:border-expense/40'
                }`}
              >
                {t('networth.liability')}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{t('common.category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {ACCOUNT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{t('networth.balance')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <p className="mt-1 text-xs text-muted">{t('networth.balanceHint')}</p>
          </div>

          {error && <p className="text-sm text-expense">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:bg-card-border"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
            >
              {submitting ? t('common.saving') : isEdit ? t('common.saveChanges') : t('networth.addAccount')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
