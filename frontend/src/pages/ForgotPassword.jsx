import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/expenses'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/forgot-password/question', { email })
      if (!data.question) {
        setQuestion(null)
      } else {
        setQuestion(data.question)
      }
      setStep(2)
    } catch {
      setError(t('forgotPassword.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { email, answer, new_password: newPassword })
      setStep(3)
    } catch (err) {
      const detail = err?.response?.data?.detail || ''
      if (detail.includes('Too many')) setError(t('forgotPassword.tooManyAttempts'))
      else if (detail.includes('Incorrect')) setError(t('forgotPassword.wrongAnswer'))
      else setError(t('forgotPassword.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-8 shadow-lg">
        <div className="mb-6 flex items-center gap-2">
          <span className="text-2xl">🔑</span>
          <h1 className="text-2xl font-bold text-ink">{t('forgotPassword.title')}</h1>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <p className="text-sm text-muted">{t('forgotPassword.subtitle')}</p>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink">{t('auth.email')}</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t('forgotPassword.emailPlaceholder')}
                className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? t('common.loading') : t('forgotPassword.continue')}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleReset} className="space-y-4">
            {question ? (
              <>
                <div className="rounded-lg border border-card-border bg-card px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">{t('forgotPassword.yourQuestion')}</p>
                  <p className="mt-1 text-sm font-medium text-ink">{question}</p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">{t('forgotPassword.enterAnswer')}</label>
                  <input type="text" required value={answer} onChange={(e) => setAnswer(e.target.value)}
                    className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-ink">{t('forgotPassword.newPassword')}</label>
                  <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {loading ? t('common.loading') : t('forgotPassword.resetPassword')}
                </button>
              </>
            ) : (
              <p className="text-sm text-muted">{t('forgotPassword.emailNotFound')}</p>
            )}
          </form>
        )}

        {step === 3 && (
          <div className="text-center space-y-4">
            <p className="text-4xl">✅</p>
            <p className="text-sm font-medium text-ink">{t('forgotPassword.success')}</p>
            <Link to="/login" className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        )}

        {step !== 3 && (
          <p className="mt-5 text-center text-sm text-muted">
            <Link to="/login" className="font-medium text-accent hover:underline">{t('forgotPassword.backToLogin')}</Link>
          </p>
        )}
      </div>
    </div>
  )
}
