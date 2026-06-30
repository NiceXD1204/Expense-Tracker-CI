import useTheme from '../hooks/useTheme'
import { getCategoryMeta } from '../constants/categories'
import { formatCurrency } from '../utils/format'

export default function BudgetBar({ category, spent, budget }) {
  const { resolved } = useTheme()
  const meta = getCategoryMeta(category)
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
  const overBudget = spent > budget

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 font-medium text-ink">
          <span>{meta.icon}</span>
          {meta.label}
        </span>
        <span className={overBudget ? 'font-semibold text-expense' : 'text-muted'}>
          {formatCurrency(spent)} / {formatCurrency(budget)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-card-border">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: overBudget ? resolved.expense : meta.color }}
        />
      </div>
      {overBudget && (
        <p className="mt-1 text-xs font-medium text-expense">{formatCurrency(spent - budget)} over budget</p>
      )}
    </div>
  )
}
