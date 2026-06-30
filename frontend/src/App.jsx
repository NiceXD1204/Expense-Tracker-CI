import { Navigate, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import Analytics from './pages/Analytics'
import Budgets from './pages/Budgets'
import Dashboard from './pages/Dashboard'
import Forecast from './pages/Forecast'
import Income from './pages/Income'
import NetWorth from './pages/NetWorth'
import Recurring from './pages/Recurring'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Subscriptions from './pages/Subscriptions'
import Transactions from './pages/Transactions'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-page md:flex-row">
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
  )
}
