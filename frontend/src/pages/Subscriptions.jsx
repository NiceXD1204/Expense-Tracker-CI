import AddRecurringModal from '../components/AddRecurringModal'
import EmptyState from '../components/EmptyState'
import { SkeletonCard } from '../components/LoadingSkeleton'
import RecurringRow from '../components/RecurringRow'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useEntryModal from '../hooks/useEntryModal'
import useRecurring from '../hooks/useRecurring'
import useSubscriptions from '../hooks/useSubscriptions'
import { formatCurrency } from '../utils/format'

export default function Subscriptions() {
  useCurrencyTick()
  const { items, summary, loading, error, refresh } = useSubscriptions()
  const { create, update, remove } = useRecurring()
  const modal = useEntryModal()

  const handleSubmit = async (payload) => {
    if (modal.entry) {
      await update(modal.entry.id, payload)
    } else {
      await create(payload)
    }
    await refresh()
  }

  const handleToggleActive = async (entry) => {
    await update(entry.id, {
      type: entry.type,
      description: entry.description,
      amount: entry.amount,
      category: entry.category,
      source: entry.source,
      day_of_month: entry.day_of_month,
      active: !entry.active,
      is_subscription: entry.is_subscription,
    })
    await refresh()
  }

  const handleDelete = async (id) => {
    await remove(id)
    await refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Subscriptions</h1>
          <p className="text-sm text-muted">Recurring expenses you've flagged as subscriptions</p>
        </div>
        <button
          onClick={modal.openAdd}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-hover"
        >
          + Add subscription
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
          Couldn't load subscriptions. Is the backend running?
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <p className="text-sm font-medium text-muted">Monthly subscriptions</p>
              <p className="mt-2 text-2xl font-bold text-expense">{formatCurrency(summary.monthly_total)}</p>
              <p className="mt-1 text-xs text-muted">{summary.count} active</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <p className="text-sm font-medium text-muted">Yearly cost</p>
              <p className="mt-2 text-2xl font-bold text-expense">{formatCurrency(summary.yearly_total)}</p>
              <p className="mt-1 text-xs text-muted">monthly × 12</p>
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-card-border bg-card">
        <div className="border-b border-card-border p-5">
          <h2 className="text-sm font-semibold text-ink">All subscriptions</h2>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-muted">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="📺"
              title="No subscriptions yet"
              message="Add Netflix, a gym membership, insurance, or anything else that bills you monthly."
            />
          </div>
        ) : (
          items.map((entry) => (
            <RecurringRow
              key={entry.id}
              entry={entry}
              onToggleActive={handleToggleActive}
              onEdit={modal.openEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <AddRecurringModal
        open={modal.open}
        entry={modal.entry}
        defaults={{ type: 'expense', is_subscription: true }}
        onClose={modal.close}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
