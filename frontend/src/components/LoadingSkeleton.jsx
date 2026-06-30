export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-card-border bg-card p-5">
      <div className="h-3 w-20 rounded bg-card-border" />
      <div className="mt-3 h-6 w-28 rounded bg-card-border" />
      <div className="mt-2 h-2 w-16 rounded bg-card-border" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-3 border-b border-card-border px-4 py-3 last:border-0">
      <div className="h-9 w-9 rounded-full bg-card-border" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 rounded bg-card-border" />
        <div className="h-2 w-1/5 rounded bg-card-border" />
      </div>
      <div className="h-3 w-12 rounded bg-card-border" />
    </div>
  )
}

export function SkeletonChart({ height = 280 }) {
  return (
    <div className="flex animate-pulse items-center justify-center rounded-xl bg-card-border" style={{ height }}>
      <span className="text-sm text-muted">Loading chart…</span>
    </div>
  )
}

export default function LoadingSkeleton({ rows = 5 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-card-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  )
}
