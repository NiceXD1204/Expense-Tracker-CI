import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import AccountModal from '../components/AccountModal'
import AccountRow from '../components/AccountRow'
import EmptyState from '../components/EmptyState'
import { SkeletonCard, SkeletonChart } from '../components/LoadingSkeleton'
import useAccounts from '../hooks/useAccounts'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useEntryModal from '../hooks/useEntryModal'
import useTheme from '../hooks/useTheme'
import { getChartTheme } from '../utils/chartTheme'
import { formatCurrency } from '../utils/format'

export default function NetWorth() {
  const { t } = useTranslation()
  useCurrencyTick()
  const { accounts, loading, error, create, update, remove } = useAccounts()
  const modal = useEntryModal()
  const { isDark, resolved } = useTheme()
  const chartTheme = getChartTheme(isDark, resolved)

  const assets = useMemo(() => accounts.filter((a) => a.type === 'asset'), [accounts])
  const liabilities = useMemo(() => accounts.filter((a) => a.type === 'liability'), [accounts])

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0)
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0)
  const netWorth = totalAssets - totalLiabilities

  const chartData = useMemo(() => [
    { name: t('networth.assets'), value: Math.round(totalAssets * 100) / 100 },
    { name: t('networth.liabilities'), value: Math.round(totalLiabilities * 100) / 100 },
  ], [t, totalAssets, totalLiabilities])

  const handleSubmit = async (payload) => {
    if (modal.entry) {
      await update(modal.entry.id, payload)
    } else {
      await create(payload)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('networth.title')}</h1>
          <p className="text-sm text-muted">{t('networth.subtitle')}</p>
        </div>
        <button
          onClick={modal.openAdd}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-hover"
        >
          + {t('networth.addAccount')}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
          Couldn't load accounts. Is the backend running?
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <p className="text-sm font-medium text-muted">{t('networth.totalAssets')}</p>
              <p className="mt-2 text-2xl font-bold text-income">{formatCurrency(totalAssets)}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <p className="text-sm font-medium text-muted">{t('networth.totalLiabilities')}</p>
              <p className="mt-2 text-2xl font-bold text-expense">{formatCurrency(totalLiabilities)}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <p className="text-sm font-medium text-muted">{t('networth.netWorth')}</p>
              <p className={`mt-2 text-2xl font-bold ${netWorth >= 0 ? 'text-savings' : 'text-expense'}`}>
                {formatCurrency(netWorth)}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-card-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-ink">{t('networth.assetsVsLiabilities')}</h2>
        {loading ? (
          <SkeletonChart height={200} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartTheme.grid} />
              <XAxis type="number" tick={chartTheme.tick} />
              <YAxis type="category" dataKey="name" tick={chartTheme.tick} width={80} />
              <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={chartTheme.tooltipStyle} labelStyle={chartTheme.labelStyle} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                <Cell fill={chartTheme.income} />
                <Cell fill={chartTheme.expense} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-xl border border-card-border bg-card">
        <div className="border-b border-card-border p-5">
          <h2 className="text-sm font-semibold text-ink">{t('networth.assets')}</h2>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-muted">{t('common.loading')}</div>
        ) : assets.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="💰" title={t('networth.noAssets')} message="e.g. checking, savings, investments, property." />
          </div>
        ) : (
          assets.map((account) => (
            <AccountRow key={account.id} account={account} onEdit={modal.openEdit} onDelete={remove} />
          ))
        )}
      </div>

      <div className="rounded-xl border border-card-border bg-card">
        <div className="border-b border-card-border p-5">
          <h2 className="text-sm font-semibold text-ink">{t('networth.liabilities')}</h2>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-muted">{t('common.loading')}</div>
        ) : liabilities.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="🏦" title={t('networth.noLiabilities')} message="e.g. mortgage, car loan, credit card balance." />
          </div>
        ) : (
          liabilities.map((account) => (
            <AccountRow key={account.id} account={account} onEdit={modal.openEdit} onDelete={remove} />
          ))
        )}
      </div>

      <AccountModal open={modal.open} entry={modal.entry} onClose={modal.close} onSubmit={handleSubmit} />
    </div>
  )
}
