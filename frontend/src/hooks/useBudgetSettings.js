import { useCallback, useEffect, useState } from 'react'
import { getBudgetSettings, updateBudgetSettings } from '../api/budgetSettings'

const DEFAULT_SETTINGS = { monthly_savings_goal: 0, monthly_spending_limit: 0 }

export default function useBudgetSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getBudgetSettings()
      .then((data) => {
        if (mounted) setSettings(data)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const update = useCallback(async (payload) => {
    const updated = await updateBudgetSettings(payload)
    setSettings(updated)
    return updated
  }, [])

  return { settings, loading, update }
}
