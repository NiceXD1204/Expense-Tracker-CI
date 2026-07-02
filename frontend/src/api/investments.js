import api from './expenses'

export async function getInvestmentFunds(fundType, ownerUserId) {
  const params = {}
  if (fundType) params.fund_type = fundType
  if (ownerUserId != null) params.owner_user_id = ownerUserId
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
