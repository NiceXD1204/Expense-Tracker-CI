import { getAccountCategoryMeta } from '../constants/accountCategories'
import { formatCurrency } from '../utils/format'

export default function AccountRow({ account, onEdit, onDelete }) {
  const meta = getAccountCategoryMeta(account.category)

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
          <p className="truncate text-sm font-medium text-ink">{account.name}</p>
          <p className="text-xs text-muted">{meta.label}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-sm font-semibold ${account.type === 'asset' ? 'text-income' : 'text-expense'}`}>
          {formatCurrency(account.balance)}
        </span>
        <button
          onClick={() => onEdit(account)}
          aria-label="Edit account"
          className="rounded-md p-1.5 text-muted transition-colors hover:bg-card-border hover:text-ink"
        >
          <PencilIcon />
        </button>
        <button
          onClick={() => onDelete(account.id)}
          aria-label="Delete account"
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
