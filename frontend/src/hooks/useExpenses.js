import { useCallback, useEffect, useState } from 'react'
import { addExpense, deleteExpense, getExpenses, updateExpense } from '../api/expenses'

export default function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getExpenses()
      setExpenses(data)
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
    const created = await addExpense(payload)
    setExpenses((prev) => [created, ...prev])
    return created
  }, [])

  const update = useCallback(async (id, payload) => {
    const updated = await updateExpense(id, payload)
    setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)))
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    await deleteExpense(id)
    setExpenses((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { expenses, loading, error, refresh, create, update, remove }
}
