import { useCallback, useEffect, useState } from 'react'
import { CATEGORIES } from '../constants/categories'
import { getCategoryBudgets, updateCategoryBudget } from '../api/categoryBudgets'

function zeroDefaults() {
  return CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: 0 }), {})
}

export default function useCategoryBudgets() {
  const [budgets, setBudgets] = useState(zeroDefaults)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    getCategoryBudgets()
      .then((rows) => {
        if (!mounted) return
        const map = zeroDefaults()
        rows.forEach((r) => { map[r.category] = r.amount })
        setBudgets(map)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const update = useCallback(async (category, amount) => {
    setBudgets((prev) => ({ ...prev, [category]: amount }))
    await updateCategoryBudget(category, amount)
  }, [])

  return { budgets, loading, update }
}
