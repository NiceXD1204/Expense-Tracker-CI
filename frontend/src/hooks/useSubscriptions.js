import { useCallback, useEffect, useState } from 'react'
import { getSubscriptions } from '../api/subscriptions'

const DEFAULT_SUMMARY = { monthly_total: 0, yearly_total: 0, count: 0 }

export default function useSubscriptions() {
  const [items, setItems] = useState([])
  const [summary, setSummary] = useState(DEFAULT_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getSubscriptions()
      setItems(data.items)
      setSummary(data.summary)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { items, summary, loading, error, refresh }
}
