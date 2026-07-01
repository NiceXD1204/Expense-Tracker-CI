import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password, rememberMe)
      navigate('/dashboard')
    } catch {
      setError(t('auth.invalidCredentials'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <span className="text-2xl">💸</span>
          <h1 className="text-2xl font-bold text-ink">{t('auth.login')}</h1>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{t('auth.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink">{t('auth.password')}</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded"
            />
            {t('auth.rememberMe')}
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? t('common.loading') : t('auth.loginBtn')}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-accent hover:underline">
            {t('auth.register')}
          </Link>
        </p>
      </div>
    </div>
  )
}
