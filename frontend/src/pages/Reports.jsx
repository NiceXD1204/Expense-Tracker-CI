import { useMemo, useState } from 'react'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/LoadingSkeleton'
import { CATEGORIES, getCategoryMeta } from '../constants/categories'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useExpenses from '../hooks/useExpenses'
import { formatCurrency, isSameMonth, monthLabel } from '../utils/format'

export default function Reports() {
  useCurrencyTick()
  const { expenses, loading } = useExpenses()
  const [month, setMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  const previousMonth = useMemo(() => {
    const d = new Date(month)
    d.setMonth(d.getMonth() - 1)
    return d
  }, [month])

  const monthExpenses = useMemo(() => expenses.filter((e) => isSameMonth(e.date, month)), [expenses, month])
  const previousExpenses = useMemo(() => expenses.filter((e) => isSameMonth(e.date, previousMonth)), [expenses, previousMonth])

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const previousTotal = previousExpenses.reduce((sum, e) => sum + e.amount, 0)
  const delta = previousTotal === 0 ? null : ((totalSpent - previousTotal) / previousTotal) * 100

  const breakdown = useMemo(() => {
    const totals = {}
    monthExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    })
    return CATEGORIES.map((category) => ({
      category,
      total: totals[category] || 0,
      pct: totalSpent > 0 ? ((totals[category] || 0) / totalSpent) * 100 : 0,
    })).sort((a, b) => b.total - a.total)
  }, [monthExpenses, totalSpent])

  const shiftMonth = (delta) => {
    setMonth((prev) => {
      const next = new Date(prev)
      next.setMonth(next.getMonth() + delta)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Reports</h1>
          <p className="text-sm text-muted">Monthly summary</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-card-border bg-card px-2 py-1.5">
          <button onClick={() => shiftMonth(-1)} className="rounded-md p-1 text-muted hover:bg-card-border">
            ‹
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium text-ink">{monthLabel(month)}</span>
          <button onClick={() => shiftMonth(1)} className="rounded-md p-1 text-muted hover:bg-card-border">
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <p className="text-sm font-medium text-muted">Total spent</p>
              <p className="mt-2 text-2xl font-bold text-ink">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <p className="text-sm font-medium text-muted">Transactions</p>
              <p className="mt-2 text-2xl font-bold text-ink">{monthExpenses.length}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <p className="text-sm font-medium text-muted">vs. {monthLabel(previousMonth).split(' ')[0]}</p>
              <p
                className={`mt-2 text-2xl font-bold ${
                  delta === null ? 'text-ink' : delta > 0 ? 'text-expense' : 'text-income'
                }`}
              >
                {delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}%`}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="border-b border-card-border p-5">
          <h2 className="text-sm font-semibold text-ink">Category breakdown</h2>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-muted">Loading…</div>
        ) : totalSpent === 0 ? (
          <div className="p-5">
            <EmptyState icon="📄" title="No expenses this month" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Share</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map(({ category, total, pct }) => {
                const meta = getCategoryMeta(category)
                return (
                  <tr key={category} className="border-b border-card-border last:border-0">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 font-medium text-ink">
                        <span>{meta.icon}</span>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink">{formatCurrency(total)}</td>
                    <td className="px-5 py-3 text-muted">{pct.toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
