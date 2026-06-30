import { getCategoryMeta } from '../constants/categories'
import { getIncomeSourceMeta } from '../constants/incomeSources'
import { formatCurrency } from '../utils/format'

export default function RecurringRow({ entry, onToggleActive, onEdit, onDelete }) {
  const meta = entry.type === 'expense' ? getCategoryMeta(entry.category) : getIncomeSourceMeta(entry.source)
  const label = entry.description?.trim() || meta.label

  return (
    <div className="flex items-center justify-between gap-3 border-b border-card-border px-4 py-3 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
          style={{ backgroundColor: `${meta.color}1A` }}
        >
          {meta.icon}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
            {label}
            {entry.is_subscription && (
              <span
                title="Subscription"
                className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"
              >
                SUB
              </span>
            )}
          </p>
          <p className="text-xs text-muted">Day {entry.day_of_month} of every month</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-block"
          style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
        >
          {meta.label}
        </span>
        <span className={`text-sm font-semibold ${entry.type === 'expense' ? 'text-expense' : 'text-income'}`}>
          {entry.type === 'expense' ? '-' : '+'}
          {formatCurrency(entry.amount)}
        </span>

        <button
          type="button"
          onClick={() => onToggleActive(entry)}
          aria-label={entry.active ? 'Pause recurring entry' : 'Resume recurring entry'}
          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${entry.active ? 'bg-accent' : 'bg-card-border'}`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              entry.active ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>

        <button
          onClick={() => onEdit(entry)}
          aria-label="Edit recurring entry"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-card-border hover:text-ink"
        >
          <PencilIcon />
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          aria-label="Delete recurring entry"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-expense/10 hover:text-expense"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}

function PencilIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 0 0 .707-.293l9.96-9.96a1 1 0 0 0 0-1.414l-3.586-3.586a1 1 0 0 0-1.414 0l-9.96 9.96A1 1 0 0 0 4 15.414V20z"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-7 0 1 12a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l1-12"
      />
    </svg>
  )
}
