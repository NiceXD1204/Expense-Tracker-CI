import { useCallback, useEffect, useState } from 'react'
import { addAccount, deleteAccount, getAccounts, updateAccount } from '../api/accounts'

export default function useAccounts() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAccounts()
      setAccounts(data)
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
    const created = await addAccount(payload)
    setAccounts((prev) => [created, ...prev])
    return created
  }, [])

  const update = useCallback(async (id, payload) => {
    const updated = await updateAccount(id, payload)
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)))
    return updated
  }, [])

  const remove = useCallback(async (id) => {
    await deleteAccount(id)
    setAccounts((prev) => prev.filter((a) => a.id !== id))
  }, [])

  return { accounts, loading, error, refresh, create, update, remove }
}
