import api from './expenses'

export async function getCategoryBudgets() {
  const { data } = await api.get('/budgets/categories')
  return data
}

export async function updateCategoryBudget(category, amount) {
  const { data } = await api.put('/budgets/categories', { category, amount })
  return data
}
