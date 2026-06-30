import { useCallback, useEffect, useState } from 'react'
import { addIncome, deleteIncome, getIncome, updateIncome } from '../api/income'

export default function useIncome() {
  const [income, setIncome] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getIncome()
      setIncome(data)
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
    const created = await addIncome(payload)
    setIncome((prev) => [created, ...prev])
    return created
  }, [])

  const update = useCallback(async (id, payload) => {
    const updated = await updateIncome(id, payload)
    setIncome((prev) => prev.map((i) => (i.id === id ? updated : i)))
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    await deleteIncome(id)
    setIncome((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return { income, loading, error, refresh, create, update, remove }
}
