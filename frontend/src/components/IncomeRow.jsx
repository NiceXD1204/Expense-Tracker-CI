import { getIncomeSourceMeta } from '../constants/incomeSources'
import { formatCurrency, formatNiceDate } from '../utils/format'

export default function IncomeRow({ income, onEdit, onDelete }) {
  const meta = getIncomeSourceMeta(income.source)
  const label = income.description?.trim() || meta.label

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
            {income.recurring_id != null && (
              <span title="Auto-generated from a recurring template" className="text-muted">
                <RepeatIcon />
              </span>
            )}
          </p>
          <p className="text-xs text-muted">{formatNiceDate(income.date)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className="hidden rounded-full px-2.5 py-1 text-xs font-medium sm:inline-block"
          style={{ backgroundColor: `${meta.color}1A`, color: meta.color }}
        >
          {meta.label}
        </span>
        <span className="text-sm font-semibold text-income">+{formatCurrency(income.amount)}</span>
        {onEdit && (
          <button
            onClick={() => onEdit(income)}
            aria-label="Edit income"
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-card-border hover:text-ink"
          >
            <PencilIcon />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(income.id)}
            aria-label="Delete income"
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-expense/10 hover:text-expense"
          >
            <TrashIcon />
          </button>
        )}
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

function RepeatIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 2l4 4-4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 22l-4-4 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}
