import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CATEGORIES, getCategoriesByGroup, getCategoryMeta } from '../constants/categories'
import { useAuth } from '../context/AuthContext'
import { toDateInputValue } from '../utils/format'

export default function AddExpenseModal({ open, entry, onClose, onSubmit }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const isEdit = Boolean(entry)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [date, setDate] = useState(() => toDateInputValue())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    if (entry) {
      setDescription(entry.description || '')
      setAmount(String(entry.amount))
      setCategory(entry.category)
      setDate(toDateInputValue(entry.date))
    } else {
      setDescription('')
      setAmount('')
      setCategory(CATEGORIES[0])
      setDate(toDateInputValue())
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
    const parsedAmount = parseFloat(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter an amount greater than 0.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ description: description.trim(), amount: parsedAmount, category, date })
      handleClose()
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Failed to save expense. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">
            {isEdit ? t('common.editExpense') : t('common.addExpense')}
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
            <label className="mb-1 block text-sm font-medium text-ink">
              {t('common.descriptionOptional')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Grocery shopping"
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

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{t('common.date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {user?.household_id && (
            <p className="rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
              👥 {t('common.autoSharedNote')}
            </p>
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
              {submitting ? t('common.saving') : isEdit ? t('common.saveChanges') : t('common.addExpense')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
