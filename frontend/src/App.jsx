import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Analytics from './pages/Analytics'
import Budgets from './pages/Budgets'
import Dashboard from './pages/Dashboard'
import Forecast from './pages/Forecast'
import ForgotPassword from './pages/ForgotPassword'
import Income from './pages/Income'
import Login from './pages/Login'
import NetWorth from './pages/NetWorth'
import Recurring from './pages/Recurring'
import Register from './pages/Register'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Subscriptions from './pages/Subscriptions'
import Transactions from './pages/Transactions'

const RTL_LANGS = ['he', 'ar']

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <span className="text-muted">Loading…</span>
      </div>
    )
  }
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { i18n } = useTranslation()
  const isRTL = RTL_LANGS.includes(i18n.language)

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language, isRTL])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <div
              className={`flex min-h-screen flex-col bg-page ${isRTL ? 'md:flex-row-reverse' : 'md:flex-row'}`}
            >
              <Sidebar />
              <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
                <TopBar />
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/income" element={<Income />} />
                  <Route path="/recurring" element={<Recurring />} />
                  <Route path="/subscriptions" element={<Subscriptions />} />
                  <Route path="/transactions" element={<Transactions />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/forecast" element={<Forecast />} />
                  <Route path="/budgets" element={<Budgets />} />
                  <Route path="/networth" element={<NetWorth />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          </PrivateRoute>
        }
      />
    </Routes>
  )
}
