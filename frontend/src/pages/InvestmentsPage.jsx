import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { createInvestmentFund, deleteInvestmentFund, getInvestmentFunds, updateInvestmentFund } from '../api/investments'
import { useAuth } from '../context/AuthContext'
import useIncome from '../hooks/useIncome'
import useTheme from '../hooks/useTheme'
import { getChartTheme } from '../utils/chartTheme'
import { formatCurrency, isSameMonth } from '../utils/format'
import api from '../api/expenses'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function computeProjection(fund, years) {
  const r = Math.max((fund.annual_return_pct - fund.management_fee_pct) / 100 / 12, 0)
  const pv = fund.current_balance
  const pmt = fund.monthly_contribution
  const points = []
  for (let y = 0; y <= years; y++) {
    const n = y * 12
    const fv = r === 0 ? pv + pmt * n : pv * Math.pow(1 + r, n) + pmt * (Math.pow(1 + r, n) - 1) / r
    const contrib = pv + pmt * n
    points.push({ year: y, value: Math.round(fv), contributions: Math.round(contrib), growth: Math.round(fv - contrib) })
  }
  const last = points[years]
  return { points, finalValue: last.value, finalContributions: last.contributions, finalGrowth: last.growth }
}

function FundModal({ fund, onSave, onCancel, isSaving, salaryBasis }) {
  const { t } = useTranslation()

  const initPct = (fund.salary && fund.salary > 0)
    ? String(Number(((fund.monthly_contribution / fund.salary) * 100).toFixed(2)))
    : '0'

  const [form, setForm] = useState({
    ...fund,
    current_balance: String(fund.current_balance ?? 0),
    annual_return_pct: String(fund.annual_return_pct ?? 7),
    monthly_contribution: String(fund.monthly_contribution ?? 0),
    management_fee_pct: String(fund.management_fee_pct ?? 1),
    contribution_pct: initPct,
  })

  // Store raw strings; parse only on save
  const setNum = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))
  const setStr = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const setPct = (e) => {
    const raw = e.target.value
    const pct = parseFloat(raw) || 0
    const computed = salaryBasis > 0 ? String((pct / 100) * salaryBasis) : '0'
    setForm((p) => ({ ...p, contribution_pct: raw, monthly_contribution: computed }))
  }

  const pctFloat = parseFloat(form.contribution_pct) || 0
  const computedContrib = salaryBasis > 0
    ? (pctFloat / 100) * salaryBasis
    : parseFloat(form.monthly_contribution) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-semibold text-ink">
          {fund.id ? t('investments.editFund') : t('investments.addFund')}
        </h2>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted">{t('investments.fundName')}</label>
          <input type="text" value={form.name} onChange={setStr('name')} maxLength={100}
            className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted">{t('investments.currentBalance')}</label>
          <input type="number" min="0" step="0.01" value={form.current_balance} onChange={setNum('current_balance')}
            className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">{t('investments.annualReturn')}</label>
            <input type="number" min="0" max="100" step="0.1" value={form.annual_return_pct} onChange={setNum('annual_return_pct')}
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">{t('investments.managementFee')}</label>
            <input type="number" min="0" max="10" step="0.01" value={form.management_fee_pct} onChange={setNum('management_fee_pct')}
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
            <p className="mt-0.5 text-xs text-muted">{t('investments.managementFeeHint')}</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-muted">{t('investments.contributionPct')}</label>
          {salaryBasis > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <input type="number" min="0" max="100" step="0.1" value={form.contribution_pct}
                  onChange={setPct}
                  className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                <span className="shrink-0 text-sm font-medium text-muted">%</span>
              </div>
              <p className="mt-1 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
                {t('investments.salaryFormula', {
                  pct: pctFloat,
                  salary: formatCurrency(salaryBasis),
                  amount: formatCurrency(computedContrib),
                })}
              </p>
              <p className="mt-0.5 text-xs text-muted">{t('investments.salaryBasis', { amount: formatCurrency(salaryBasis) })}</p>
            </>
          ) : (
            <>
              <input type="number" min="0" step="0.01" value={form.monthly_contribution} onChange={setNum('monthly_contribution')}
                className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
              <p className="mt-0.5 text-xs text-muted">{t('investments.noSalary')}</p>
            </>
          )}
        </div>

        {!fund.id && (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={!!form.is_shared} onChange={(e) => setForm((p) => ({ ...p, is_shared: e.target.checked }))} className="rounded" />
            {t('common.shared')}
          </label>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-ink hover:bg-card-border">{t('common.cancel')}</button>
          <button onClick={() => form.name.trim() && onSave(form)} disabled={isSaving || !form.name.trim()}
            className="flex-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-60">
            {isSaving ? t('common.saving') : t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function InvestmentsPage({ fundType, titleKey, subtitleKey }) {
  const { t } = useTranslation()
  const { isDark, resolved } = useTheme()
  const chartTheme = getChartTheme(isDark, resolved)
  const { user } = useAuth()

  const [funds, setFunds] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingFund, setEditingFund] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [horizon, setHorizon] = useState(20)

  // Household member selector
  const [members, setMembers] = useState([])
  const [selectedMemberId, setSelectedMemberId] = useState(null) // null = self

  const { income } = useIncome()

  // Use most-recent month with income, not just current month
  const totalMonthlyIncome = useMemo(() => {
    if (!income.length) return 0
    const now = new Date()
    const thisMonth = income.filter((i) => isSameMonth(i.date, now))
    if (thisMonth.length > 0) return thisMonth.reduce((s, i) => s + i.amount, 0)
    // Fall back to most recent month that has any income
    const sorted = [...income].sort((a, b) => new Date(b.date) - new Date(a.date))
    const latestDate = sorted[0].date
    return sorted
      .filter((i) => isSameMonth(i.date, latestDate))
      .reduce((s, i) => s + i.amount, 0)
  }, [income])

  // Fetch household members when in a household
  useEffect(() => {
    if (user?.household_id) {
      api.get('/household/members')
        .then((r) => setMembers(r.data))
        .catch(() => setMembers([]))
    }
  }, [user?.household_id])

  const loadFunds = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      // In a household: always filter by owner so we see one member at a time
      const ownerId = user.household_id ? (selectedMemberId ?? user.id) : undefined
      const data = await getInvestmentFunds(fundType, ownerId)
      setFunds(data)
    } catch (e) {
      console.error('Failed to load funds', e)
    } finally {
      setLoading(false)
    }
  }, [fundType, selectedMemberId, user])

  useEffect(() => { loadFunds() }, [loadFunds])

  const openAdd = () => setEditingFund({
    name: '', current_balance: 0, annual_return_pct: 7,
    monthly_contribution: 0, management_fee_pct: 1,
    contribution_pct: 0, salary: null, is_shared: false,
  })

  const openEdit = (fund) => {
    const pct = (fund.salary && fund.salary > 0)
      ? Number(((fund.monthly_contribution / fund.salary) * 100).toFixed(2))
      : 0
    setEditingFund({ ...fund, contribution_pct: pct })
  }

  const handleSave = async (form) => {
    setIsSaving(true)
    try {
      const pctFloat = parseFloat(form.contribution_pct) || 0
      const payload = {
        name: form.name.trim(),
        current_balance: parseFloat(form.current_balance) || 0,
        annual_return_pct: parseFloat(form.annual_return_pct) || 0,
        monthly_contribution: totalMonthlyIncome > 0
          ? (pctFloat / 100) * totalMonthlyIncome
          : parseFloat(form.monthly_contribution) || 0,
        management_fee_pct: parseFloat(form.management_fee_pct) || 0,
        salary: totalMonthlyIncome > 0 ? totalMonthlyIncome : null,
      }
      if (form.id) {
        const updated = await updateInvestmentFund(form.id, payload)
        setFunds((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      } else {
        const created = await createInvestmentFund({ ...payload, fund_type: fundType, is_shared: !!form.is_shared })
        setFunds((prev) => [...prev, created])
      }
      setEditingFund(null)
    } catch (e) {
      console.error('Save failed', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm(t('investments.deleteFund') + '?')) return
    try {
      await deleteInvestmentFund(id)
      setFunds((prev) => prev.filter((f) => f.id !== id))
    } catch (e) {
      console.error('Delete failed', e)
    }
  }

  const totalPortfolio = funds.reduce((s, f) => s + f.current_balance, 0)

  const chartData = useMemo(() => {
    if (!funds.length) return []
    return Array.from({ length: horizon + 1 }, (_, y) => {
      const entry = { year: y, _totalValue: 0, _totalContrib: 0 }
      funds.forEach((fund) => {
        const { points } = computeProjection(fund, horizon)
        entry[fund.name || String(fund.id)] = points[y].value
        entry._totalValue += points[y].value
        entry._totalContrib += points[y].contributions
      })
      entry._totalValue = Math.round(entry._totalValue)
      entry._totalContrib = Math.round(entry._totalContrib)
      return entry
    })
  }, [funds, horizon])

  const finalProjected = chartData.length ? chartData[chartData.length - 1]._totalValue : 0
  const totalContrib = chartData.length ? chartData[chartData.length - 1]._totalContrib : 0

  // Determine which member is being viewed (for "can add funds" check)
  const viewingSelf = !selectedMemberId || selectedMemberId === user?.id
  const selectedMember = members.find((m) => m.id === selectedMemberId)

  if (loading) return <div className="py-20 text-center text-muted">{t('common.loading')}</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{t(titleKey)}</h1>
          <p className="text-sm text-muted">{t(subtitleKey)}</p>
        </div>
        {viewingSelf && (
          <button onClick={openAdd} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover">
            + {t('investments.addFund')}
          </button>
        )}
      </div>

      {/* Household member selector */}
      {user?.household_id && members.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">{t('investments.memberSelector')}</span>
          {members.map((m) => {
            const isActive = (selectedMemberId ?? user.id) === m.id
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMemberId(m.id === user.id ? null : m.id)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent text-white' : 'border border-card-border text-muted hover:bg-card-border'
                }`}
              >
                {m.display_name || m.email}
                {m.id === user.id && <span className="ml-1 text-xs opacity-75">{t('common.you')}</span>}
              </button>
            )
          })}
        </div>
      )}

      {/* Salary basis info */}
      {totalMonthlyIncome > 0 && (
        <p className="text-sm text-muted">
          {t('investments.salaryBasis', { amount: formatCurrency(totalMonthlyIncome) })}
        </p>
      )}

      {funds.length === 0 ? (
        <div className="rounded-xl border border-card-border bg-card p-12 text-center">
          <p className="text-4xl">📈</p>
          <p className="mt-3 text-lg font-semibold text-ink">{t('investments.noFunds')}</p>
          <p className="mt-1 text-sm text-muted">
            {viewingSelf
              ? t('investments.noFundsHint')
              : t('investments.noFundsOther', { name: selectedMember?.display_name || '' })}
          </p>
          {viewingSelf && (
            <button onClick={openAdd} className="mt-4 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-hover">
              {t('investments.addFirstFund')}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('investments.totalPortfolio')}</p>
              <p className="mt-1 text-2xl font-bold text-ink">{formatCurrency(totalPortfolio)}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('investments.projectedValue')} ({horizon}y)</p>
              <p className="mt-1 text-2xl font-bold text-income">{formatCurrency(finalProjected)}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('investments.totalGrowth')}</p>
              <p className="mt-1 text-2xl font-bold text-accent">{formatCurrency(Math.max(finalProjected - totalContrib, 0))}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {funds.map((fund, idx) => {
              const { finalValue, finalGrowth } = computeProjection(fund, horizon)
              const hasPct = fund.salary && fund.salary > 0
              const derivedPct = hasPct
                ? ((fund.monthly_contribution / fund.salary) * 100).toFixed(1)
                : null
              return (
                <div key={fund.id} className="rounded-xl border border-card-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block h-2.5 w-2.5 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-semibold text-ink">{fund.name}</span>
                    </div>
                    {viewingSelf && (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(fund)} className="rounded-md p-1 text-muted hover:bg-card-border" aria-label={t('common.edit')}>✏️</button>
                        <button onClick={() => handleDelete(fund.id)} className="rounded-md p-1 text-expense hover:bg-expense/10" aria-label={t('investments.deleteFund')}>🗑️</button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-muted">{t('investments.balance')}</p>
                      <p className="font-semibold text-ink">{formatCurrency(fund.current_balance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">{t('investments.contributionPct')}</p>
                      {hasPct ? (
                        <p className="font-semibold text-ink">
                          {derivedPct}% × {formatCurrency(fund.salary)}
                          <span className="block text-xs text-muted">{formatCurrency(fund.monthly_contribution)}/mo</span>
                        </p>
                      ) : (
                        <p className="font-semibold text-ink">{formatCurrency(fund.monthly_contribution)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted">{t('investments.annualReturn')}</p>
                      <p className="font-semibold text-ink">{fund.annual_return_pct}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted">{t('investments.managementFee')}</p>
                      <p className="font-semibold text-ink">{fund.management_fee_pct}%</p>
                    </div>
                  </div>
                  <div className="border-t border-card-border pt-2 text-xs text-muted">
                    {t('investments.projectedValue')} ({horizon}y):{' '}
                    <span className="font-semibold text-income">{formatCurrency(finalValue)}</span>
                    <span className="ml-2 text-accent">(+{formatCurrency(finalGrowth)})</span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="rounded-xl border border-card-border bg-card p-5 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-semibold text-ink">{t('investments.projection')}</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted shrink-0">{t('investments.horizonLabel')}</span>
                <input
                  type="range" min="1" max="100" value={horizon}
                  onChange={(e) => setHorizon(Number(e.target.value))}
                  className="w-36 accent-accent"
                />
                <span className="min-w-[5rem] text-sm font-semibold text-ink">
                  {horizon} {t('investments.years', { count: horizon })}
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis dataKey="year" tickFormatter={(v) => `${t('investments.year')} ${v}`} tick={chartTheme.tick} />
                <YAxis tickFormatter={(v) => {
                  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`
                  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`
                  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}K`
                  return String(v)
                }} tick={chartTheme.tick} />
                <Tooltip formatter={(v, name) => [formatCurrency(v), name]} contentStyle={chartTheme.tooltipStyle} labelStyle={chartTheme.labelStyle} />
                <Legend />
                {funds.map((fund, idx) => (
                  <Line key={fund.id} type="monotone" dataKey={fund.name || String(fund.id)} stroke={COLORS[idx % COLORS.length]} dot={false} strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {editingFund !== null && viewingSelf && (
        <FundModal
          fund={editingFund}
          onSave={handleSave}
          onCancel={() => setEditingFund(null)}
          isSaving={isSaving}
          salaryBasis={totalMonthlyIncome}
        />
      )}
    </div>
  )
}
