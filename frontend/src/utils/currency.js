// Used only when the browser doesn't support Intl.supportedValuesOf('currency')
// (older Safari/Firefox). Covers every active ISO 4217 currency code.
const FALLBACK_CURRENCY_CODES = [
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
  'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL',
  'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY',
  'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP',
  'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD',
  'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HTG', 'HUF', 'IDR', 'ILS', 'INR',
  'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF',
  'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL',
  'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR',
  'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR',
  'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR',
  'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD',
  'SHP', 'SLE', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP', 'SZL', 'THB',
  'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX',
  'USD', 'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF',
  'XPF', 'YER', 'ZAR', 'ZMW', 'ZWL',
]

export const DEFAULT_CURRENCY = 'ILS'
const STORAGE_KEY = 'currency'
const CHANGE_EVENT = 'currency-change'

export function getSupportedCurrencies() {
  if (typeof Intl.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('currency')
    } catch {
      // fall through to the static list below
    }
  }
  return FALLBACK_CURRENCY_CODES
}

export function loadCurrency() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored || DEFAULT_CURRENCY
  } catch {
    return DEFAULT_CURRENCY
  }
}

export function saveCurrency(code) {
  localStorage.setItem(STORAGE_KEY, code)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function onCurrencyChange(handler) {
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}

export function getCurrencySymbol(code) {
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(1)
    const symbolPart = parts.find((p) => p.type === 'currency')
    return symbolPart ? symbolPart.value : code
  } catch {
    return code
  }
}

export function getCurrencyName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'currency' }).of(code)
  } catch {
    return code
  }
}
