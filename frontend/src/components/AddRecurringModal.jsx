import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES, getCategoriesByGroup, getCategoryMeta } from '../constants/categories'
import { INCOME_SOURCES, getIncomeSourceMeta } from '../constants/incomeSources'

export default function AddRecurringModal({ open, entry, defaults, onClose, onSubmit }) {
  const { t } = useTranslation()
  const isEdit = Boolean(entry)
  const [type, setType] = useState('expense')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [source, setSource] = useState(INCOME_SOURCES[0])
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [active, setActive] = useState(true)
  const [isSubscription, setIsSubscription] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    if (entry) {
      setType(entry.type)
      setDescription(entry.description || '')
      setAmount(String(entry.amount))
      setCategory(entry.category || CATEGORIES[0])
      setSource(entry.source || INCOME_SOURCES[0])
      setDayOfMonth(entry.day_of_month)
      setActive(entry.active)
      setIsSubscription(Boolean(entry.is_subscription))
    } else {
      setType(defaults?.type || 'expense')
      setDescription('')
      setAmount('')
      setCategory(CATEGORIES[0])
      setSource(INCOME_SOURCES[0])
      setDayOfMonth(1)
      setActive(true)
      setIsSubscription(Boolean(defaults?.is_subscription))
    }
    setError(null)
  }, [open, entry, defaults])

  if (!open) return null

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter an amount greater than 0.')
      return
    }
    const day = Math.min(Math.max(parseInt(dayOfMonth, 10) || 1, 1), 28)
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        type,
        description: description.trim(),
        amount: parsedAmount,
        category: type === 'expense' ? category : null,
        source: type === 'income' ? source : null,
        day_of_month: day,
        active,
        is_subscription: type === 'expense' ? isSubscription : false,
      })
      handleClose()
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Failed to save recurring entry. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            {isEdit ? t('recurring.editEntry') : t('recurring.addEntry')}
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
            <label className="mb-2 block text-sm font-medium text-ink">{t('common.type')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  type === 'expense' ? 'border-accent bg-accent/10 text-accent' : 'border-card-border text-muted hover:border-accent/40'
                }`}
              >
                {t('recurring.expense')}
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  type === 'income' ? 'border-accent bg-accent/10 text-accent' : 'border-card-border text-muted hover:border-accent/40'
                }`}
              >
                {t('recurring.incomeType')}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{t('common.descriptionOptional')}</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'expense' ? 'e.g. Rent' : 'e.g. Salary'}
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{t('common.amount')}</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {type === 'expense' ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">{t('common.category')}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {getCategoriesByGroup().map(({ group, categories }) => (
                  <optgroup key={group} label={group}>
                    {categories.map((c) => {
                      const meta = getCategoryMeta(c)
                      return (
                        <option key={c} value={c}>
                          {meta.icon} {meta.label}
                        </option>
                      )
                    })}
                  </optgroup>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">{t('common.source')}</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {INCOME_SOURCES.map((s) => {
                  const meta = getIncomeSourceMeta(s)
                  return (
                    <option key={s} value={s}>
                      {meta.icon} {meta.label}
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{t('recurring.dayOfMonth')}</label>
            <input
              type="number"
              min="1"
              max="28"
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <p className="mt-1 text-xs text-muted">{t('recurring.dayOfMonthHint')}</p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-card-border text-accent focus:ring-accent/20"
            />
            {t('recurring.active')}
          </label>

          {type === 'expense' && (
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input
                type="checkbox"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="h-4 w-4 rounded border-card-border text-accent focus:ring-accent/20"
              />
              {t('recurring.isSubscription')}
            </label>
          )}

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
              {submitting ? t('common.saving') : isEdit ? t('common.saveChanges') : t('recurring.addEntry')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
