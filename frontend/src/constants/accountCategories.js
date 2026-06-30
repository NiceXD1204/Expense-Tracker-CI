export const ACCOUNT_CATEGORIES = [
  { value: 'cash', label: 'Cash', icon: '💵', color: '#22c55e' },
  { value: 'investment', label: 'Investment', icon: '📈', color: '#3b82f6' },
  { value: 'property', label: 'Property', icon: '🏠', color: '#f59e0b' },
  { value: 'loan', label: 'Loan', icon: '🏦', color: '#ef4444' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳', color: '#a855f7' },
  { value: 'other', label: 'Other', icon: '📦', color: '#6b7280' },
]

export function getAccountCategoryMeta(category) {
  return (
    ACCOUNT_CATEGORIES.find((c) => c.value === category) || {
      value: category,
      label: category || 'Other',
      icon: '📦',
      color: '#6b7280',
    }
  )
}
