import api from './expenses'

export async function getIncome() {
  const { data } = await api.get('/income')
  return data
}

export async function addIncome(payload) {
  const { data } = await api.post('/income', payload)
  return data
}

export async function updateIncome(id, payload) {
  const { data } = await api.put(`/income/${id}`, payload)
  return data
}

export async function deleteIncome(id) {
  await api.delete(`/income/${id}`)
}

export async function getIncomeSummary() {
  const { data } = await api.get('/income/summary')
  return data
}
