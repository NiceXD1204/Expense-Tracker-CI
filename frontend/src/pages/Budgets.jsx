import { useEffect, useMemo, useState } from 'react'
import BudgetBar from '../components/BudgetBar'
import { CATEGORIES, getCategoryMeta } from '../constants/categories'
import { getCurrencySymbol, loadCurrency } from '../utils/currency'
import useBudgetSettings from '../hooks/useBudgetSettings'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useExpenses from '../hooks/useExpenses'
import useIncome from '../hooks/useIncome'
import { loadBudgets, saveBudgets } from '../utils/budgets'
import { formatCurrency, isSameMonth, monthLabel } from '../utils/format'

export default function Budgets() {
  useCurrencyTick()
  const { expenses, loading } = useExpenses()
  const { income } = useIncome()
  const { settings, loading: settingsLoading, update } = useBudgetSettings()
  const [budgets, setBudgets] = useState(loadBudgets)
  const [savedAt, setSavedAt] = useState(null)
  const [planForm, setPlanForm] = useState({ monthly_savings_goal: 0, monthly_spending_limit: 0 })
  const [planSaving, setPlanSaving] = useState(false)
  const [planSavedAt, setPlanSavedAt] = useState(null)
  const today = useMemo(() => new Date(), [])

  useEffect(() => {
    if (!settingsLoading) setPlanForm(settings)
  }, [settings, settingsLoading])

  const monthExpenses = useMemo(() => expenses.filter((e) => isSameMonth(e.date, today)), [expenses, today])
  const monthIncome = useMemo(() => income.filter((i) => isSameMonth(i.date, today)), [income, today])
  const totalMonthIncome = monthIncome.reduce((sum, i) => sum + i.amount, 0)

  const spentByCategory = useMemo(() => {
    const totals = {}
    monthExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    })
    return totals
  }, [monthExpenses])

  const handleChange = (category, value) => {
    const numeric = Math.max(parseFloat(value) || 0, 0)
    const next = { ...budgets, [category]: numeric }
    setBudgets(next)
    saveBudgets(next)
    setSavedAt(Date.now())
  }

  const handlePlanSave = async () => {
    setPlanSaving(true)
    try {
      await update({
        monthly_savings_goal: Math.max(parseFloat(planForm.monthly_savings_goal) || 0, 0),
        monthly_spending_limit: Math.max(parseFloat(planForm.monthly_spending_limit) || 0, 0),
      })
      setPlanSavedAt(Date.now())
    } finally {
      setPlanSaving(false)
    }
  }

  const totalBudget = Object.values(budgets).reduce((sum, v) => sum + v, 0)
  const totalSpent = Object.values(spentByCategory).reduce((sum, v) => sum + v, 0)

  const goal = Number(planForm.monthly_savings_goal) || 0
  const limit = Number(planForm.monthly_spending_limit) || 0
  const canSpend = totalMonthIncome - goal
  const remaining = totalMonthIncome - goal - limit
  const overAllocated = remaining < 0
  const pct = (value) => (totalMonthIncome > 0 ? Math.min(Math.max((value / totalMonthIncome) * 100, 0), 100) : 0)

  const currencySymbol = getCurrencySymbol(loadCurrency())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Budgets</h1>
          <p className="text-sm text-muted">Set a monthly limit per category — {monthLabel(today)}</p>
        </div>
        {savedAt && <span className="text-xs font-medium text-income">Saved ✓</span>}
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Monthly plan</h2>
          {planSavedAt && <span className="text-xs font-medium text-income">Saved ✓</span>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Monthly savings goal</label>
            <div className="flex items-center rounded-lg border border-card-border px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <span className="text-sm text-muted">{currencySymbol}</span>
              <input
                type="number"
                min="0"
                step="50"
                value={planForm.monthly_savings_goal}
                onChange={(e) => setPlanForm((p) => ({ ...p, monthly_savings_goal: e.target.value }))}
                className="w-full bg-transparent px-2 py-2 text-sm text-ink focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">Monthly spending limit</label>
            <div className="flex items-center rounded-lg border border-card-border px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
              <span className="text-sm text-muted">{currencySymbol}</span>
              <input
                type="number"
                min="0"
                step="50"
                value={planForm.monthly_spending_limit}
                onChange={(e) => setPlanForm((p) => ({ ...p, monthly_spending_limit: e.target.value }))}
                className="w-full bg-transparent px-2 py-2 text-sm text-ink focus:outline-none"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handlePlanSave}
          disabled={planSaving}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {planSaving ? 'Saving…' : 'Save plan'}
        </button>

        <p className="mt-4 text-sm text-muted">
          If you earn <span className="font-semibold text-ink">{formatCurrency(totalMonthIncome)}</span> and want to
          save <span className="font-semibold text-ink">{formatCurrency(goal)}</span>, you can spend{' '}
          <span className="font-semibold text-ink">{formatCurrency(canSpend)}</span> per month.
        </p>

        <div className="mt-4">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-card-border">
            <div className="h-full bg-savings" style={{ width: `${pct(goal)}%` }} title="Savings" />
            <div className="h-full bg-accent" style={{ width: `${pct(limit)}%` }} title="Spending" />
            <div className="h-full bg-card-border" style={{ width: `${pct(Math.max(remaining, 0))}%` }} title="Remaining" />
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-savings" /> Savings {formatCurrency(goal)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-accent" /> Spending {formatCurrency(limit)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-card-border" /> Remaining {formatCurrency(Math.max(remaining, 0))}
            </span>
          </div>
          {overAllocated && (
            <p className="mt-2 text-xs font-medium text-expense">
              You've allocated {formatCurrency(Math.abs(remaining))} more than your income this month.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="font-medium text-ink">Total budget</span>
          <span className={totalSpent > totalBudget ? 'font-semibold text-expense' : 'text-muted'}>
            {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
          </span>
        </div>
        <div className="space-y-5">
          {CATEGORIES.map((category) => (
            <BudgetBar key={category} category={category} spent={loading ? 0 : spentByCategory[category] || 0} budget={budgets[category]} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">Edit monthly budgets</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => {
            const meta = getCategoryMeta(category)
            return (
              <div key={category}>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-ink">
                  <span>{meta.icon}</span>
                  {meta.label}
                </label>
                <div className="flex items-center rounded-lg border border-card-border px-3 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
                  <span className="text-sm text-muted">{currencySymbol}</span>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={budgets[category]}
                    onChange={(e) => handleChange(category, e.target.value)}
                    className="w-full bg-transparent px-2 py-2 text-sm text-ink focus:outline-none"
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
