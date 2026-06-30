import { useMemo, useState } from 'react'
import AddExpenseModal from '../components/AddExpenseModal'
import EmptyState from '../components/EmptyState'
import LoadingSkeleton from '../components/LoadingSkeleton'
import TransactionRow from '../components/TransactionRow'
import { CATEGORIES, getCategoryMeta } from '../constants/categories'
import useCurrencyTick from '../hooks/useCurrencyTick'
import useEntryModal from '../hooks/useEntryModal'
import useExpenses from '../hooks/useExpenses'
import { parseDateOnly } from '../utils/format'

const PAGE_SIZE = 10

export default function Transactions() {
  useCurrencyTick()
  const { expenses, loading, error, update, remove } = useExpenses()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const expenseModal = useEntryModal()

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => e.description.toLowerCase().includes(search.trim().toLowerCase()))
      .filter((e) => category === 'all' || e.category === category)
      .filter((e) => !startDate || parseDateOnly(e.date) >= parseDateOnly(startDate))
      .filter((e) => !endDate || parseDateOnly(e.date) <= parseDateOnly(endDate))
      .sort((a, b) => parseDateOnly(b.date) - parseDateOnly(a.date))
  }, [expenses, search, category, startDate, endDate])

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1)
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const updateFilter = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Transactions</h1>
        <p className="text-sm text-muted">{filtered.length} matching transactions</p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-card-border bg-card p-4 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => updateFilter(setSearch)(e.target.value)}
          placeholder="Search description…"
          className="flex-1 rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />

        <select
          value={category}
          onChange={(e) => updateFilter(setCategory)(e.target.value)}
          className="rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {getCategoryMeta(c).icon} {getCategoryMeta(c).label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={startDate}
          onChange={(e) => updateFilter(setStartDate)(e.target.value)}
          className="rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <span className="text-sm text-muted">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => updateFilter(setEndDate)(e.target.value)}
          className="rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-expense/30 bg-expense/10 px-4 py-3 text-sm text-expense">
          Couldn't load expenses. Is the backend running?
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-card-border bg-card">
        {loading ? (
          <LoadingSkeleton rows={10} />
        ) : paged.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="🔍" title="No transactions found" message="Try adjusting your filters." />
          </div>
        ) : (
          paged.map((expense) => (
            <TransactionRow key={expense.id} expense={expense} onEdit={expenseModal.openEdit} onDelete={remove} />
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-card-border px-3 py-1.5 text-ink disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-card-border px-3 py-1.5 text-ink disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AddExpenseModal
        open={expenseModal.open}
        entry={expenseModal.entry}
        onClose={expenseModal.close}
        onSubmit={(payload) => update(expenseModal.entry.id, payload)}
      />
    </div>
  )
}
