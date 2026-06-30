import { useEffect, useState } from 'react'
import { onCurrencyChange } from '../utils/currency'

// formatCurrency() reads the selected currency straight from localStorage on
// every call (it's a plain helper, not a hook) - call this once per page so
// that page re-renders (and every formatCurrency() call inside it re-evaluates)
// the instant the user changes currency in Settings.
export default function useCurrencyTick() {
  const [, setTick] = useState(0)

  useEffect(() => onCurrencyChange(() => setTick((t) => t + 1)), [])
}
