import api from './expenses'

export async function getBudgetSettings() {
  const { data } = await api.get('/budget-settings')
  return data
}

export async function updateBudgetSettings(payload) {
  const { data } = await api.put('/budget-settings', payload)
  return data
}
