export const INCOME_SOURCE_META = {
  husband: { label: 'Husband', color: '#3b82f6', icon: '👨' },
  wife: { label: 'Wife', color: '#ec4899', icon: '👩' },
  other: { label: 'Other', color: '#6b7280', icon: '💼' },
}

export const INCOME_SOURCES = Object.keys(INCOME_SOURCE_META)

export function getIncomeSourceMeta(source) {
  return INCOME_SOURCE_META[source] || { label: source || 'Other', color: '#6b7280', icon: '💼' }
}
