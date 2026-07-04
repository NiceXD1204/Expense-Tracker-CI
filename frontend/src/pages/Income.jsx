import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import AddIncomeModal from '../components/AddIncomeModal'
import EmptyState from '../components/EmptyState'
import IncomeRow from '../components/IncomeRow'
import KPICard from '../components/KPICard'
import LoadingSkeleton, { SkeletonCard } from '../components/LoadingSkeleton'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useEntryModal from '../hooks/useEntryModal'
import useIncome from '../hooks/useIncome'
import { formatCurrency, parseDateOnly } from '../utils/format'

export default function Income() {
  const { t } = useTranslation()
  useCurrencyTick()
  const { income, loading, error, create, update, remove } = useIncome()
  const incomeModal = useEntryModal()

  const totals = useMemo(() => {
    const bySource = { husband: 0, wife: 0, other: 0 }
    income.forEach((i) => {
      bySource[i.source in bySource ? i.source : 'other'] += i.amount
    })
    const total = bySource.husband + bySource.wife + bySource.other
    return { ...bySource, total }
  }, [income])

  const sorted = useMemo(
    () => [...income].sort((a, b) => parseDateOnly(b.date) - parseDateOnly(a.date)),
    [income],
  )

  const handleSubmit = async (payload) => {
    if (incomeModal.entry) {
      await update(incomeModal.entry.id, payload)
    } else {
      await create(payload)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t('income.title')}</h1>
          <p className="text-sm text-muted">{t('income.subtitle')}</p>
        </div>
        <button
          onClick={incomeModal.openAdd}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-hover"
        >
          + {t('income.add')}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
          Couldn't load income. Is the backend running?
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <KPICard label={t('income.husband')} value={formatCurrency(totals.husband)} hint={t('common.allTime')} />
            <KPICard label={t('income.wife')} value={formatCurrency(totals.wife)} hint={t('common.allTime')} />
            <KPICard label={t('income.other')} value={formatCurrency(totals.other)} hint={t('common.allTime')} />
            <KPICard label={t('income.total')} value={formatCurrency(totals.total)} accent hint={t('common.allTime')} />
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        <div className="border-b border-card-border p-5">
          <h2 className="text-sm font-semibold text-ink">{t('income.allEntries')}</h2>
        </div>
        {loading ? (
          <LoadingSkeleton rows={6} />
        ) : sorted.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="💰" title={t('income.noIncomeYet')} message={t('income.noIncomeHint')} />
          </div>
        ) : (
          sorted.map((entry) => (
            <IncomeRow key={entry.id} income={entry} onEdit={incomeModal.openEdit} onDelete={remove} />
          ))
        )}
      </div>

      <AddIncomeModal
        open={incomeModal.open}
        entry={incomeModal.entry}
        onClose={incomeModal.close}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
