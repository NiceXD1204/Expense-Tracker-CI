// Tailwind-named colors resolved to hex so they can be used directly in
// inline styles (Recharts cells, dynamic backgrounds, etc).
const COLOR_HEX = {
  pink: '#ec4899',
  indigo: '#6366f1',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  yellow: '#eab308',
  slate: '#64748b',
  orange: '#f97316',
  blue: '#3b82f6',
  red: '#ef4444',
  teal: '#14b8a6',
  purple: '#a855f7',
  emerald: '#10b981',
  stone: '#78716c',
  amber: '#f59e0b',
  sky: '#0ea5e9',
  lime: '#84cc16',
  fuchsia: '#d946ef',
  violet: '#8b5cf6',
  green: '#22c55e',
  gray: '#6b7280',
}

// Each entry: value -> { label, color (hex), icon, group }
// `group` drives the <optgroup> sections in the category picker.
export const CATEGORY_META = {
  // Original
  food: { label: 'Food', color: COLOR_HEX.green, icon: '🛒', group: 'Food' },
  bills: { label: 'Bills', color: COLOR_HEX.yellow, icon: '⚡', group: 'Home & Living' },
  health: { label: 'Health', color: COLOR_HEX.blue, icon: '💊', group: 'Health' },
  entertainment: { label: 'Entertainment', color: COLOR_HEX.purple, icon: '🎬', group: 'Personal & Leisure' },
  transport: { label: 'Transport', color: COLOR_HEX.orange, icon: '🚗', group: 'Transport' },
  other: { label: 'Other', color: COLOR_HEX.gray, icon: '📦', group: 'Other' },

  // Original requested (round 2)
  kindergarten: { label: 'Kindergarten', color: COLOR_HEX.pink, icon: '🧸', group: 'Kids & Education' },
  school: { label: 'School', color: COLOR_HEX.indigo, icon: '🎒', group: 'Kids & Education' },
  babysitter: { label: 'Babysitter', color: COLOR_HEX.rose, icon: '👶', group: 'Kids & Education' },
  water: { label: 'Water', color: COLOR_HEX.cyan, icon: '💧', group: 'Home & Living' },
  electricity: { label: 'Electricity', color: COLOR_HEX.yellow, icon: '⚡', group: 'Home & Living' },
  property_tax: { label: 'Property Tax', color: COLOR_HEX.slate, icon: '🏛️', group: 'Home & Living' },
  repairs: { label: 'Repairs', color: COLOR_HEX.orange, icon: '🔧', group: 'Home & Living' },
  car: { label: 'Car', color: COLOR_HEX.blue, icon: '🚗', group: 'Transport' },
  fuel: { label: 'Fuel', color: COLOR_HEX.red, icon: '⛽', group: 'Transport' },
  car_insurance: { label: 'Car Insurance', color: COLOR_HEX.teal, icon: '🛡️', group: 'Transport' },
  family_events: { label: 'Family Events', color: COLOR_HEX.purple, icon: '🎉', group: 'Kids & Education' },

  // Home & living
  rent_mortgage: { label: 'Rent / Mortgage', color: COLOR_HEX.emerald, icon: '🏠', group: 'Home & Living' },
  building_maintenance: { label: 'Building Fees', color: COLOR_HEX.stone, icon: '🏢', group: 'Home & Living' },
  gas: { label: 'Gas', color: COLOR_HEX.amber, icon: '🔥', group: 'Home & Living' },
  internet_tv: { label: 'Internet & TV', color: COLOR_HEX.sky, icon: '📡', group: 'Home & Living' },
  home_goods: { label: 'Home Goods', color: COLOR_HEX.lime, icon: '🛋️', group: 'Home & Living' },

  // Kids & education
  activities: { label: 'Activities', color: COLOR_HEX.fuchsia, icon: '⚽', group: 'Kids & Education' },
  kids_clothing: { label: 'Kids Clothing', color: COLOR_HEX.pink, icon: '👕', group: 'Kids & Education' },
  toys: { label: 'Toys', color: COLOR_HEX.violet, icon: '🧸', group: 'Kids & Education' },

  // Food
  groceries: { label: 'Groceries', color: COLOR_HEX.green, icon: '🛒', group: 'Food' },
  dining_out: { label: 'Dining Out', color: COLOR_HEX.orange, icon: '🍽️', group: 'Food' },

  // Transport
  public_transport: { label: 'Public Transport', color: COLOR_HEX.blue, icon: '🚌', group: 'Transport' },
  parking_tolls: { label: 'Parking & Tolls', color: COLOR_HEX.gray, icon: '🅿️', group: 'Transport' },

  // Health
  health_insurance: { label: 'Health Insurance', color: COLOR_HEX.red, icon: '🏥', group: 'Health' },
  pharmacy: { label: 'Pharmacy', color: COLOR_HEX.rose, icon: '💊', group: 'Health' },
  dental: { label: 'Dental', color: COLOR_HEX.cyan, icon: '🦷', group: 'Health' },

  // Personal & leisure
  clothing: { label: 'Clothing', color: COLOR_HEX.indigo, icon: '👔', group: 'Personal & Leisure' },
  subscriptions: { label: 'Subscriptions', color: COLOR_HEX.purple, icon: '📺', group: 'Personal & Leisure' },
  fitness: { label: 'Fitness', color: COLOR_HEX.teal, icon: '🏋️', group: 'Personal & Leisure' },
  gifts: { label: 'Gifts', color: COLOR_HEX.pink, icon: '🎁', group: 'Personal & Leisure' },
  travel: { label: 'Travel', color: COLOR_HEX.sky, icon: '✈️', group: 'Personal & Leisure' },

  // Finance
  savings: { label: 'Savings', color: COLOR_HEX.emerald, icon: '💰', group: 'Finance' },
  bank_fees: { label: 'Bank Fees', color: COLOR_HEX.slate, icon: '🏦', group: 'Finance' },
  loans: { label: 'Loans', color: COLOR_HEX.red, icon: '💳', group: 'Finance' },
}

export const CATEGORIES = Object.keys(CATEGORY_META)

// Ordered list of group names, used to render <optgroup>s in a stable order.
export const CATEGORY_GROUPS = [
  'Home & Living',
  'Kids & Education',
  'Food',
  'Transport',
  'Health',
  'Personal & Leisure',
  'Finance',
  'Other',
]

export function getCategoryMeta(category) {
  return CATEGORY_META[category] || { label: category || 'Other', color: COLOR_HEX.gray, icon: '📦', group: 'Other' }
}

// Categories grouped for <optgroup>-style pickers: [{ group, categories: [value, ...] }, ...]
export function getCategoriesByGroup() {
  return CATEGORY_GROUPS.map((group) => ({
    group,
    categories: CATEGORIES.filter((c) => CATEGORY_META[c].group === group),
  })).filter((g) => g.categories.length > 0)
}
