import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || '/api',
  timeout: 8000,
})

export async function getExpenses() {
  const { data } = await api.get('/expenses')
  return data
}

export async function addExpense(payload) {
  const { data } = await api.post('/expenses', payload)
  return data
}

export async function updateExpense(id, payload) {
  const { data } = await api.put(`/expenses/${id}`, payload)
  return data
}

export async function deleteExpense(id) {
  await api.delete(`/expenses/${id}`)
}

export async function getSummary() {
  const { data } = await api.get('/summary')
  return data
}

export async function getHealth() {
  const { data } = await api.get('/healthz')
  return data
}

export default api
