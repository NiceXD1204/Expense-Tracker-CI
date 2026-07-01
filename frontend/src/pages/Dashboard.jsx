import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Link } from 'react-router-dom'
import AddExpenseModal from '../components/AddExpenseModal'
import BudgetBar from '../components/BudgetBar'
import CategoryLegendList from '../components/CategoryLegendList'
import DonutChart from '../components/DonutChart'
import EmptyState from '../components/EmptyState'
import KPICard from '../components/KPICard'
import { SkeletonCard, SkeletonChart, SkeletonRow } from '../components/LoadingSkeleton'
import Modal from '../components/Modal'
import SavingsProgress from '../components/SavingsProgress'
import TransactionRow from '../components/TransactionRow'
import { CATEGORIES } from '../constants/categories'
import useBudgetSettings from '../hooks/useBudgetSettings'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useEntryModal from '../hooks/useEntryModal'
import useExpenses from '../hooks/useExpenses'
import useIncome from '../hooks/useIncome'
import useSubscriptions from '../hooks/useSubscriptions'
import useTheme from '../hooks/useTheme'
import { getChartTheme } from '../utils/chartTheme'
import { loadBudgets } from '../utils/budgets'
import { daysInMonth, formatCurrency, isSameMonth, monthLabel, parseDateOnly } from '../utils/format'

export default function Dashboard() {
  const { t } = useTranslation()
  useCurrencyTick()
  const { expenses, loading, error, create, update, remove } = useExpenses()
  const { income, loading: incomeLoading } = useIncome()
  const { settings: budgetSettings } = useBudgetSettings()
  const { summary: subscriptionsSummary, loading: subscriptionsLoading } = useSubscriptions()
  const { isDark, resolved } = useTheme()
  const chartTheme = getChartTheme(isDark, resolved)
  const [month, setMonth] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const expenseModal = useEntryModal()
  const [showAllBudgets, setShowAllBudgets] = useState(false)
  const budgets = loadBudgets()

  const monthExpenses = useMemo(() => expenses.filter((e) => isSameMonth(e.date, month)), [expenses, month])
  const monthIncome = useMemo(() => income.filter((i) => isSameMonth(i.date, month)), [income, month])

  const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0)
  const totalBudget = Object.values(budgets).reduce((sum, v) => sum + v, 0)
  const budgetLeft = totalBudget - totalSpent

  const today = new Date()
  const isCurrentMonth = isSameMonth(today, month)
  const elapsedDays = isCurrentMonth ? today.getDate() : daysInMonth(month)
  const dailyAverage = totalSpent / Math.max(elapsedDays, 1)

  const incomeBySource = useMemo(() => {
    const totals = { husband: 0, wife: 0, other: 0 }
    monthIncome.forEach((i) => {
      totals[i.source in totals ? i.source : 'other'] += i.amount
    })
    return totals
  }, [monthIncome])

  const totalIncome = incomeBySource.husband + incomeBySource.wife + incomeBySource.other
  const netSavings = totalIncome - totalSpent

  const categoryTotals = useMemo(() => {
    const totals = {}
    monthExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    })
    return Object.entries(totals).map(([category, total]) => ({ category, total }))
  }, [monthExpenses])

  const budgetEntries = useMemo(
    () =>
      CATEGORIES.filter((c) => budgets[c] > 0).map((c) => ({
        category: c,
        spent: categoryTotals.find((t) => t.category === c)?.total || 0,
        budget: budgets[c],
      })),
    [categoryTotals, budgets],
  )

  const topSpentBudgets = useMemo(
    () =>
      budgetEntries
        .filter((e) => e.spent > 0)
        .sort((a, b) => b.spent - a.spent)
        .slice(0, 5),
    [budgetEntries],
  )

  const incomeVsExpenseChart = [
    { name: t('dashboard.totalIncome'), value: Math.round(totalIncome * 100) / 100 },
    { name: t('dashboard.totalExpenses'), value: Math.round(totalSpent * 100) / 100 },
    { name: t('budgets.savingsGoal'), value: budgetSettings.monthly_savings_goal },
  ]

  const incomeSplitChart = [
    { name: t('income.husband'), value: Math.round(incomeBySource.husband * 100) / 100 },
    { name: t('income.wife'), value: Math.round(incomeBySource.wife * 100) / 100 },
  ]

  const recent = useMemo(
    () => [...expenses].sort((a, b) => parseDateOnly(b.date) - parseDateOnly(a.date)).slice(0, 5),
    [expenses],
  )

  const handleExpenseSubmit = async (payload) => {
    if (expenseModal.entry) {
      await update(expenseModal.entry.id, payload)
    } else {
      await create(payload)
    }
  }

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
          <h1 className="text-2xl font-bold text-ink">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted">{t('dashboard.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-card-border bg-card px-2 py-1.5">
            <button
              onClick={() => shiftMonth(-1)}
              aria-label="Previous month"
              className="rounded-md p-1 text-muted hover:bg-card-border"
            >
              ‹
            </button>
            <span className="min-w-[9rem] text-center text-sm font-medium text-ink">{monthLabel(month)}</span>
            <button
              onClick={() => shiftMonth(1)}
              aria-label="Next month"
              className="rounded-md p-1 text-muted hover:bg-card-border"
            >
              ›
            </button>
          </div>

          <button
            onClick={expenseModal.openAdd}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-hover"
          >
            + {t('dashboard.addExpense')}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
          Couldn't load expenses. Is the backend running?
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KPICard label={t('dashboard.totalSpent')} value={formatCurrency(totalSpent)} hint={monthLabel(month)} />
            <KPICard
              label={t('dashboard.budgetLeft')}
              value={formatCurrency(budgetLeft)}
              hint={t('dashboard.ofBudgeted', { amount: formatCurrency(totalBudget) })}
              accent={budgetLeft >= 0}
              trend={{ positive: budgetLeft >= 0, label: budgetLeft >= 0 ? t('dashboard.onTrack') : t('dashboard.overBudget') }}
            />
            <KPICard label={t('reports.transactions')} value={monthExpenses.length} hint={t('common.thisMonth')} />
            <KPICard label={t('dashboard.dailyAverage')} value={formatCurrency(dailyAverage)} hint={t('dashboard.overDays', { days: elapsedDays })} />
          </>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-ink">{t('dashboard.incomeSection', { month: monthLabel(month) })}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {incomeLoading || loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <KPICard label={t('dashboard.totalIncome')} value={formatCurrency(totalIncome)} hint={monthLabel(month)} accent />
              <div className="rounded-xl border border-card-border bg-card p-5">
                <p className="text-sm font-medium text-muted">{t('dashboard.totalExpenses')}</p>
                <p className="mt-2 text-2xl font-bold text-expense">{formatCurrency(totalSpent)}</p>
                <p className="mt-1 text-xs text-muted">{monthLabel(month)}</p>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-5">
                <p className="text-sm font-medium text-muted">{t('dashboard.netSavings')}</p>
                <p className={`mt-2 text-2xl font-bold ${netSavings >= 0 ? 'text-income' : 'text-expense'}`}>
                  {formatCurrency(netSavings)}
                </p>
                <p className="mt-1 text-xs text-muted">{t('dashboard.incomeMinusExpenses')}</p>
              </div>
              <Link
                to="/subscriptions"
                className="rounded-xl border border-card-border bg-card p-5 transition-colors hover:border-accent/40"
              >
                <p className="text-sm font-medium text-muted">{t('nav.subscriptions')}</p>
                <p className="mt-2 text-2xl font-bold text-expense">
                  {subscriptionsLoading ? '…' : formatCurrency(subscriptionsSummary.monthly_total)}
                </p>
                <p className="mt-1 text-xs text-muted">{t('dashboard.perMonthViewAll')}</p>
              </Link>
            </>
          )}
        </div>
      </div>

      {!loading && !incomeLoading && <SavingsProgress goal={budgetSettings.monthly_savings_goal} actual={netSavings} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('dashboard.incomeVsExpensesGoal')}</h2>
          {loading || incomeLoading ? (
            <SkeletonChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incomeVsExpenseChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="name" tick={chartTheme.tick} />
                <YAxis tick={chartTheme.tick} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={chartTheme.tooltipStyle}
                  labelStyle={chartTheme.labelStyle}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {incomeVsExpenseChart.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={idx === 0 ? chartTheme.income : idx === 1 ? chartTheme.expense : chartTheme.savings}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('dashboard.husbandVsWife')}</h2>
          {incomeLoading ? (
            <SkeletonChart />
          ) : incomeBySource.husband === 0 && incomeBySource.wife === 0 ? (
            <EmptyState icon="👫" title={t('dashboard.noIncomeYet')} message={t('dashboard.noIncomeHint')} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={incomeSplitChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="name" tick={chartTheme.tick} />
                <YAxis tick={chartTheme.tick} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={chartTheme.tooltipStyle}
                  labelStyle={chartTheme.labelStyle}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  <Cell fill={chartTheme.accent} />
                  <Cell fill="#ec4899" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('dashboard.spendingByCategory')}</h2>
          {loading ? (
            <SkeletonChart />
          ) : categoryTotals.length === 0 ? (
            <EmptyState icon="🍩" title={t('dashboard.noSpending')} message={t('dashboard.noSpendingHint')} />
          ) : (
            <>
              <DonutChart data={categoryTotals} />
              <CategoryLegendList data={categoryTotals} modalTitle="All categories this month" />
            </>
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('nav.budgets')}</h2>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonChart key={i} height={32} />
              ))}
            </div>
          ) : topSpentBudgets.length === 0 ? (
            <EmptyState
              icon="🧾"
              title={t('dashboard.noBudgetSpending')}
              message={t('dashboard.noBudgetSpendingHint')}
            />
          ) : (
            <div className="space-y-4">
              {topSpentBudgets.map((e) => (
                <BudgetBar key={e.category} category={e.category} spent={e.spent} budget={e.budget} />
              ))}
            </div>
          )}

          {budgetEntries.length > topSpentBudgets.length && (
            <button
              onClick={() => setShowAllBudgets(true)}
              className="mt-4 w-full rounded-lg border border-card-border py-2 text-sm font-medium text-muted hover:bg-card-border/50"
            >
              {t('dashboard.showAll', { count: budgetEntries.length })}
            </button>
          )}
        </div>
      </div>

      {showAllBudgets && (
        <Modal title={t('dashboard.allBudgets')} onClose={() => setShowAllBudgets(false)}>
          <div className="space-y-4">
            {[...budgetEntries]
              .sort((a, b) => b.spent - a.spent)
              .map((e) => (
                <BudgetBar key={e.category} category={e.category} spent={e.spent} budget={e.budget} />
              ))}
          </div>
        </Modal>
      )}

      <div className="rounded-xl border border-card-border bg-card">
        <div className="flex items-center justify-between border-b border-card-border p-5">
          <h2 className="text-sm font-semibold text-ink">{t('dashboard.recentTransactions')}</h2>
        </div>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : recent.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="🧾" title={t('dashboard.noTransactions')} message={t('dashboard.noTransactionsHint')} />
          </div>
        ) : (
          recent.map((expense) => (
            <TransactionRow key={expense.id} expense={expense} onEdit={expenseModal.openEdit} onDelete={remove} />
          ))
        )}
      </div>

      <AddExpenseModal
        open={expenseModal.open}
        entry={expenseModal.entry}
        onClose={expenseModal.close}
        onSubmit={handleExpenseSubmit}
      />
    </div>
  )
}
