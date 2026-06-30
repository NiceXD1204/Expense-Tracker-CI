import api from './expenses'

export async function getSubscriptions() {
  const { data } = await api.get('/subscriptions')
  return data
}
