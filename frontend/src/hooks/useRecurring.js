import { useCallback, useEffect, useState } from 'react'
import { addRecurring, deleteRecurring, getRecurring, runRecurring, updateRecurring } from '../api/recurring'

export default function useRecurring() {
  const [recurring, setRecurring] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRecurring()
      setRecurring(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(async (payload) => {
    const created = await addRecurring(payload)
    setRecurring((prev) => [created, ...prev])
    return created
  }, [])

  const update = useCallback(async (id, payload) => {
    const updated = await updateRecurring(id, payload)
    setRecurring((prev) => prev.map((r) => (r.id === id ? updated : r)))
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    await deleteRecurring(id)
    setRecurring((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const run = useCallback(async () => {
    const result = await runRecurring()
    return result
  }, [])

  return { recurring, loading, error, refresh, create, update, remove, run }
}
