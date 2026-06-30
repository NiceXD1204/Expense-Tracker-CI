import { CATEGORIES } from '../constants/categories'

const STORAGE_KEY = 'expense-tracker:budgets'

export const DEFAULT_BUDGETS = {
  // Original
  food: 800,
  bills: 600,
  health: 400,
  entertainment: 300,
  transport: 200,
  other: 200,

  // Original requested (round 2)
  kindergarten: 1500,
  school: 800,
  babysitter: 600,
  water: 150,
  electricity: 400,
  property_tax: 500,
  repairs: 300,
  car: 400,
  fuel: 600,
  car_insurance: 350,
  family_events: 400,

  // Home & living
  rent_mortgage: 4000,
  building_maintenance: 250,
  gas: 200,
  internet_tv: 150,
  home_goods: 300,

  // Kids & education
  activities: 500,
  kids_clothing: 300,
  toys: 200,

  // Food
  groceries: 2500,
  dining_out: 800,

  // Transport
  public_transport: 250,
  parking_tolls: 150,

  // Health
  health_insurance: 600,
  pharmacy: 200,
  dental: 300,

  // Personal & leisure
  clothing: 400,
  subscriptions: 150,
  fitness: 250,
  gifts: 300,
  travel: 1000,

  // Finance
  savings: 2000,
  bank_fees: 50,
  loans: 1000,
}

export function loadBudgets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_BUDGETS }
    const parsed = JSON.parse(raw)
    const merged = { ...DEFAULT_BUDGETS, ...parsed }
    CATEGORIES.forEach((c) => {
      if (typeof merged[c] !== 'number' || merged[c] < 0) merged[c] = DEFAULT_BUDGETS[c]
    })
    return merged
  } catch {
    return { ...DEFAULT_BUDGETS }
  }
}

export function saveBudgets(budgets) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets))
}
