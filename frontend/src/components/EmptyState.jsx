export default function EmptyState({ icon = '🗒️', title = 'Nothing here yet', message }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-card-border bg-card py-14 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {message && <p className="max-w-xs text-xs text-muted">{message}</p>}
    </div>
  )
}
