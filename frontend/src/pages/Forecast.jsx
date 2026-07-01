import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getForecast } from '../api/forecast'
import { SkeletonChart } from '../components/LoadingSkeleton'
import useAccounts from '../hooks/useAccounts'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useTheme from '../hooks/useTheme'
import { getChartTheme } from '../utils/chartTheme'
import { formatCurrency } from '../utils/format'

const MONTH_OPTIONS = [3, 6, 12]

export default function Forecast() {
  const { t } = useTranslation()
  useCurrencyTick()
  const { isDark, resolved } = useTheme()
  const chartTheme = getChartTheme(isDark, resolved)
  const { accounts, loading: accountsLoading } = useAccounts()

  const [months, setMonths] = useState(6)
  const [startingBalance, setStartingBalance] = useState('0')
  const [balanceTouched, setBalanceTouched] = useState(false)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const totalAssets = useMemo(
    () => accounts.filter((a) => a.type === 'asset').reduce((sum, a) => sum + a.balance, 0),
    [accounts],
  )

  useEffect(() => {
    if (!accountsLoading && !balanceTouched && totalAssets > 0) {
      setStartingBalance(String(totalAssets))
    }
  }, [accountsLoading, totalAssets, balanceTouched])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    const parsedBalance = parseFloat(startingBalance) || 0
    getForecast(months, parsedBalance)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (active) setError(err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [months, startingBalance])

  const totalNet = data.reduce((sum, m) => sum + m.net, 0)
  const finalBalance = data.length > 0 ? data[data.length - 1].cumulative_net : 0
  const trendColor = totalNet >= 0 ? chartTheme.income : chartTheme.expense

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t('forecast.title')}</h1>
        <p className="text-sm text-muted">{t('forecast.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-card-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {MONTH_OPTIONS.map((m) => (
            <button
              key={m}
              onClick={() => setMonths(m)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                months === m ? 'border-accent bg-accent/10 text-accent' : 'border-card-border text-muted hover:border-accent/40'
              }`}
            >
              {t('forecast.monthsBtn', { count: m })}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-ink" htmlFor="starting-balance">
            {t('forecast.startingBalance')}
          </label>
          <input
            id="starting-balance"
            type="number"
            step="0.01"
            value={startingBalance}
            onChange={(e) => {
              setBalanceTouched(true)
              setStartingBalance(e.target.value)
            }}
            className="w-36 rounded-lg border border-card-border bg-card px-3 py-1.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
          Couldn't load the forecast. Is the backend running?
        </div>
      )}

      {!loading && data.length > 0 && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            totalNet >= 0 ? 'border-income/30 bg-income/10 text-income' : 'border-expense/30 bg-expense/10 text-expense'
          }`}
        >
          {totalNet >= 0
            ? t('forecast.projectedPositive', { amount: formatCurrency(Math.abs(totalNet)), months, balance: formatCurrency(finalBalance) })
            : t('forecast.projectedNegative', { amount: formatCurrency(Math.abs(totalNet)), months, balance: formatCurrency(finalBalance) })}
        </div>
      )}

      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">{t('forecast.projectedBalance')}</h2>
        {loading ? (
          <SkeletonChart />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={trendColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={trendColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
              <XAxis dataKey="label" tick={chartTheme.tick} />
              <YAxis tick={chartTheme.tick} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={chartTheme.tooltipStyle}
                labelStyle={chartTheme.labelStyle}
              />
              <Area type="monotone" dataKey="cumulative_net" stroke={trendColor} fill="url(#balanceGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">{t('forecast.incomeVsExpensesPerMonth')}</h2>
        {loading ? (
          <SkeletonChart />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartTheme.grid} />
              <XAxis dataKey="label" tick={chartTheme.tick} />
              <YAxis tick={chartTheme.tick} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={chartTheme.tooltipStyle}
                labelStyle={chartTheme.labelStyle}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: chartTheme.tick.fill }} />
              <Bar dataKey="expected_income" name={t('forecast.incomeCol')} fill={chartTheme.income} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expected_expenses" name={t('forecast.expensesCol')} fill={chartTheme.expense} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="border-b border-card-border p-5">
          <h2 className="text-sm font-semibold text-ink">{t('forecast.monthByMonth')}</h2>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-muted">{t('common.loading')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3">{t('forecast.month')}</th>
                <th className="px-5 py-3">{t('forecast.incomeCol')}</th>
                <th className="px-5 py-3">{t('forecast.expensesCol')}</th>
                <th className="px-5 py-3">{t('forecast.net')}</th>
                <th className="px-5 py-3">{t('forecast.runningBalance')}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={`${m.year}-${m.month}`} className="border-b border-card-border last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">{m.label}</td>
                  <td className="px-5 py-3 text-income">{formatCurrency(m.expected_income)}</td>
                  <td className="px-5 py-3 text-expense">{formatCurrency(m.expected_expenses)}</td>
                  <td className={`px-5 py-3 font-medium ${m.net >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(m.net)}
                  </td>
                  <td className={`px-5 py-3 font-semibold ${m.cumulative_net >= 0 ? 'text-ink' : 'text-expense'}`}>
                    {formatCurrency(m.cumulative_net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
