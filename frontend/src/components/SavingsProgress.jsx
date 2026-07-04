import { useTranslation } from 'react-i18next'
import useTheme from '../hooks/useTheme'
import { formatCurrency } from '../utils/format'

export default function SavingsProgress({ goal, actual }) {
  const { t } = useTranslation()
  const { resolved } = useTheme()
  const onTrack = actual >= goal
  const overspending = actual < 0
  const pct = goal > 0 ? Math.min(Math.max((actual / goal) * 100, 0), 100) : actual > 0 ? 100 : 0
  const barColor = overspending ? resolved.expense : onTrack ? resolved.income : '#f59e0b'

  let message
  if (overspending) {
    message = t('savings.overspending', { amount: formatCurrency(Math.abs(actual)) })
  } else if (onTrack) {
    message = t('savings.onTrack', { actual: formatCurrency(actual), goal: formatCurrency(goal) })
  } else {
    message = t('savings.short', { actual: formatCurrency(actual), goal: formatCurrency(goal), short: formatCurrency(goal - actual) })
  }

  return (
    <div className="rounded-xl border border-card-border bg-card p-5">
      <h2 className="mb-3 text-sm font-semibold text-ink">{t('savings.progress')}</h2>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-muted">{t('savings.savedThisMonth')}</span>
        <span className={`font-semibold ${overspending ? 'text-expense' : 'text-ink'}`}>
          {formatCurrency(actual)} / {formatCurrency(goal)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-card-border">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      <p
        className={`mt-3 text-sm ${overspending ? 'text-expense' : onTrack ? 'text-income' : 'text-amber-600 dark:text-amber-400'}`}
      >
        {message}
      </p>
    </div>
  )
}
