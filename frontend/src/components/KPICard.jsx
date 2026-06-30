export default function KPICard({ label, value, hint, accent = false, trend }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ? 'text-accent' : 'text-ink'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {trend && (
        <p className={`mt-2 text-xs font-medium ${trend.positive ? 'text-income' : 'text-expense'}`}>{trend.label}</p>
      )}
    </div>
  )
}
