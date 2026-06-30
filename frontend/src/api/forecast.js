import api from './expenses'

export async function getForecast(months, startingBalance) {
  const { data } = await api.get('/forecast', { params: { months, starting_balance: startingBalance } })
  return data
}
