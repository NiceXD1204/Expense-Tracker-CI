import { useState } from 'react'
import { getCategoryMeta } from '../constants/categories'
import { formatCurrency } from '../utils/format'
import Modal from './Modal'

function LegendRow({ category, total }) {
  const meta = getCategoryMeta(category)
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="flex min-w-0 items-center gap-2 truncate text-ink">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: meta.color }} />
        <span className="truncate">
          {meta.icon} {meta.label}
        </span>
      </span>
      <span className="shrink-0 font-medium text-ink">{formatCurrency(total)}</span>
    </div>
  )
}

export default function CategoryLegendList({ data, limit = 5, modalTitle = 'All categories' }) {
  const [showAll, setShowAll] = useState(false)

  if (!data || data.length === 0) return null

  const sorted = [...data].sort((a, b) => b.total - a.total)
  const top = sorted.slice(0, limit)

  return (
    <div className="mt-3">
      <div className="divide-y divide-card-border">
        {top.map((entry) => (
          <LegendRow key={entry.category} {...entry} />
        ))}
      </div>

      {sorted.length > top.length && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full rounded-lg border border-card-border py-2 text-xs font-medium text-muted hover:bg-card-border/50"
        >
          Show all ({sorted.length})
        </button>
      )}

      {showAll && (
        <Modal title={modalTitle} onClose={() => setShowAll(false)}>
          <div className="divide-y divide-card-border">
            {sorted.map((entry) => (
              <LegendRow key={entry.category} {...entry} />
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}
