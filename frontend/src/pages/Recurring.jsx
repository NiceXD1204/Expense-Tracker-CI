import { useMemo, useState } from 'react'
import AddRecurringModal from '../components/AddRecurringModal'
import EmptyState from '../components/EmptyState'
import RecurringRow from '../components/RecurringRow'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useEntryModal from '../hooks/useEntryModal'
import useRecurring from '../hooks/useRecurring'

export default function Recurring() {
  useCurrencyTick()
  const { recurring, loading, error, create, update, remove, run } = useRecurring()
  const modal = useEntryModal()
  const [running, setRunning] = useState(false)
  const [runMessage, setRunMessage] = useState(null)

  const incomeTemplates = useMemo(() => recurring.filter((r) => r.type === 'income'), [recurring])
  const expenseTemplates = useMemo(() => recurring.filter((r) => r.type === 'expense'), [recurring])

  const handleSubmit = async (payload) => {
    if (modal.entry) {
      await update(modal.entry.id, payload)
    } else {
      await create(payload)
    }
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
  }

  const handleRunNow = async () => {
    setRunning(true)
    setRunMessage(null)
    try {
      const result = await run()
      setRunMessage(`Generated ${result.created} new ${result.created === 1 ? 'entry' : 'entries'} for this month.`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Recurring</h1>
          <p className="text-sm text-muted">Templates that auto-generate a transaction every month</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunNow}
            disabled={running}
            className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted hover:bg-card-border/50 disabled:opacity-60"
          >
            {running ? 'Running…' : 'Run now'}
          </button>
          <button
            onClick={modal.openAdd}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-hover"
          >
            + Add recurring
          </button>
        </div>
      </div>

      {runMessage && (
        <div className="rounded-lg border border-income/30 bg-income/10 px-4 py-3 text-sm text-income">
          {runMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
          Couldn't load recurring entries. Is the backend running?
        </div>
      )}

      <div className="rounded-xl border border-card-border bg-card">
        <div className="border-b border-card-border p-5">
          <h2 className="text-sm font-semibold text-ink">Recurring income</h2>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-muted">Loading…</div>
        ) : incomeTemplates.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="💰" title="No recurring income" message="e.g. a monthly salary that repeats automatically." />
          </div>
        ) : (
          incomeTemplates.map((entry) => (
            <RecurringRow
              key={entry.id}
              entry={entry}
              onToggleActive={handleToggleActive}
              onEdit={modal.openEdit}
              onDelete={remove}
            />
          ))
        )}
      </div>

      <div className="rounded-xl border border-card-border bg-card">
        <div className="border-b border-card-border p-5">
          <h2 className="text-sm font-semibold text-ink">Recurring expenses</h2>
        </div>
        {loading ? (
          <div className="p-5 text-sm text-muted">Loading…</div>
        ) : expenseTemplates.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="🧾" title="No recurring expenses" message="e.g. rent or a subscription that repeats automatically." />
          </div>
        ) : (
          expenseTemplates.map((entry) => (
            <RecurringRow
              key={entry.id}
              entry={entry}
              onToggleActive={handleToggleActive}
              onEdit={modal.openEdit}
              onDelete={remove}
            />
          ))
        )}
      </div>

      <AddRecurringModal open={modal.open} entry={modal.entry} onClose={modal.close} onSubmit={handleSubmit} />
    </div>
  )
}
