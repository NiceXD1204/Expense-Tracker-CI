import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import CategoryLegendList from '../components/CategoryLegendList'
import DonutChart from '../components/DonutChart'
import EmptyState from '../components/EmptyState'
import { SkeletonChart } from '../components/LoadingSkeleton'
import TransactionRow from '../components/TransactionRow'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useExpenses from '../hooks/useExpenses'
import useTheme from '../hooks/useTheme'
import { getChartTheme } from '../utils/chartTheme'
import { daysInMonth, formatCurrency, isSameMonth, monthLabel, parseDateOnly } from '../utils/format'

export default function Analytics() {
  const { t } = useTranslation()
  useCurrencyTick()
  const { expenses, loading, remove } = useExpenses()
  const { isDark, resolved } = useTheme()
  const chartTheme = getChartTheme(isDark, resolved)
  const today = useMemo(() => new Date(), [])

  const monthExpenses = useMemo(() => expenses.filter((e) => isSameMonth(e.date, today)), [expenses, today])

  const byDay = useMemo(() => {
    const totalDays = daysInMonth(today)
    const days = Array.from({ length: totalDays }, (_, i) => ({ day: i + 1, total: 0 }))
    monthExpenses.forEach((e) => {
      const day = parseDateOnly(e.date).getDate()
      days[day - 1].total += e.amount
    })
    return days
  }, [monthExpenses, today])

  const trend = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
      months.push({ key: monthLabel(d), date: d, total: 0 })
    }
    expenses.forEach((e) => {
      const txDate = parseDateOnly(e.date)
      const match = months.find((m) => isSameMonth(txDate, m.date))
      if (match) match.total += e.amount
    })
    return months.map((m) => ({ month: m.key.split(' ')[0], total: Math.round(m.total * 100) / 100 }))
  }, [expenses, today])

  const categoryTotals = useMemo(() => {
    const totals = {}
    monthExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount
    })
    return Object.entries(totals).map(([category, total]) => ({ category, total }))
  }, [monthExpenses])

  const topExpenses = useMemo(() => [...monthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5), [monthExpenses])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t('analytics.title')}</h1>
        <p className="text-sm text-muted">{t('analytics.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('analytics.spendingByDay', { month: monthLabel(today) })}</h2>
          {loading ? (
            <SkeletonChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="day" tick={chartTheme.tick} interval={2} />
                <YAxis tick={chartTheme.tick} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  labelFormatter={(d) => `Day ${d}`}
                  contentStyle={chartTheme.tooltipStyle}
                  labelStyle={chartTheme.labelStyle}
                />
                <Bar dataKey="total" fill={chartTheme.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('analytics.sixMonthTrend')}</h2>
          {loading ? (
            <SkeletonChart />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
                <XAxis dataKey="month" tick={chartTheme.tick} />
                <YAxis tick={chartTheme.tick} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={chartTheme.tooltipStyle}
                  labelStyle={chartTheme.labelStyle}
                />
                <Line type="monotone" dataKey="total" stroke={chartTheme.accent} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card p-5">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('analytics.categoryBreakdown', { month: monthLabel(today) })}</h2>
          {loading ? (
            <SkeletonChart />
          ) : categoryTotals.length === 0 ? (
            <EmptyState icon="📊" title={t('analytics.noData')} />
          ) : (
            <>
              <DonutChart data={categoryTotals} donut={false} />
              <CategoryLegendList data={categoryTotals} modalTitle="All categories this month" />
            </>
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card">
          <div className="border-b border-card-border p-5">
            <h2 className="text-sm font-semibold text-ink">{t('analytics.topExpenses', { month: monthLabel(today) })}</h2>
          </div>
          {loading ? (
            <div className="p-5 text-sm text-muted">{t('common.loading')}</div>
          ) : topExpenses.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="🏆" title={t('analytics.noExpenses')} />
            </div>
          ) : (
            topExpenses.map((expense) => <TransactionRow key={expense.id} expense={expense} onDelete={remove} />)
          )}
        </div>
      </div>
    </div>
  )
}
