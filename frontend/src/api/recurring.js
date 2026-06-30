import api from './expenses'

export async function getRecurring() {
  const { data } = await api.get('/recurring')
  return data
}

export async function addRecurring(payload) {
  const { data } = await api.post('/recurring', payload)
  return data
}

export async function updateRecurring(id, payload) {
  const { data } = await api.put(`/recurring/${id}`, payload)
  return data
}

export async function deleteRecurring(id) {
  await api.delete(`/recurring/${id}`)
}

export async function runRecurring() {
  const { data } = await api.post('/recurring/run')
  return data
}
