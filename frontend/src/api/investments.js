import api from './expenses'

export async function getInvestmentFunds(fundType) {
  const params = {}
  if (fundType) params.fund_type = fundType
  const { data } = await api.get('/investment-funds', { params })
  return data
}

export async function createInvestmentFund(payload) {
  const { data } = await api.post('/investment-funds', payload)
  return data
}

export async function updateInvestmentFund(id, payload) {
  const { data } = await api.put(`/investment-funds/${id}`, payload)
  return data
}

export async function deleteInvestmentFund(id) {
  await api.delete(`/investment-funds/${id}`)
}
