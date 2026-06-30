import { loadCurrency } from './currency'

// The single source of truth for displaying money anywhere in the app.
// Reads the user's selected currency (default ILS) from localStorage on
// every call - this is display-only formatting, it never converts amounts.
export function formatCurrency(amount) {
  const currency = loadCurrency()
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 2,
    }).format(Number(amount) || 0)
  } catch {
    return `${currency} ${(Number(amount) || 0).toFixed(2)}`
  }
}

// new Date("YYYY-MM-DD") parses the string as UTC midnight (per spec), which
// can display/compare as the *previous* day once converted to a timezone
// behind UTC. The backend's "date" field is a pure calendar date with no
// time/timezone attached, so it must be parsed as local-midnight instead.
export function parseDateOnly(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// "15 Jun 2026" - day-month-year order, for the transaction "date" field.
export function formatNiceDate(value) {
  return parseDateOnly(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function monthLabel(date) {
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
}

export function isSameMonth(value, refDate) {
  const d = parseDateOnly(value)
  return d.getFullYear() === refDate.getFullYear() && d.getMonth() === refDate.getMonth()
}

export function daysInMonth(refDate) {
  return new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate()
}

// "YYYY-MM-DD" in the *local* timezone - deliberately not toISOString(),
// which converts to UTC first and can silently shift the date by a day.
export function toDateInputValue(value) {
  const d = value ? parseDateOnly(value) : new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
