import api from './expenses'

export async function getAccounts() {
  const { data } = await api.get('/accounts')
  return data
}

export async function addAccount(payload) {
  const { data } = await api.post('/accounts', payload)
  return data
}

export async function updateAccount(id, payload) {
  const { data } = await api.put(`/accounts/${id}`, payload)
  return data
}

export async function deleteAccount(id) {
  await api.delete(`/accounts/${id}`)
}

export async function getNetWorth() {
  const { data } = await api.get('/accounts/networth')
  return data
}
