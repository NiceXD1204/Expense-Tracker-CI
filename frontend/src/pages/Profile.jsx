import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import api from '../api/expenses'

const SECURITY_QUESTION_KEYS = [
  'security.questions.pet',
  'security.questions.city',
  'security.questions.maiden',
  'security.questions.school',
  'security.questions.nickname',
]

export default function Profile() {
  const { t } = useTranslation()
  const { user, setUser } = useAuth()
  const fileRef = useRef(null)

  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [securityQuestion, setSecurityQuestion] = useState(user?.security_question || '')
  const [securityAnswer, setSecurityAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (displayName?.[0] || user?.email?.[0] || '?').toUpperCase()

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const ax = api
      const { data } = await ax.put('/auth/profile', {
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        security_question: securityQuestion || undefined,
        security_answer: securityAnswer || undefined,
      })
      setUser(data)
      setSecurityAnswer('')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError(t('profile.errorSave'))
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      try {
        const ax = api
        const { data } = await ax.post('/auth/avatar', { avatar_data: dataUrl })
        setUser(data)
      } catch {
        setError(t('profile.errorSave'))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAvatar = async () => {
    try {
      const ax = api
      const { data } = await ax.post('/auth/avatar', { avatar_data: '' })
      setUser(data)
    } catch {
      setError(t('profile.errorSave'))
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t('profile.title')}</h1>
        <p className="text-sm text-muted">{t('profile.subtitle')}</p>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            {user?.avatar_data ? (
              <img
                src={user.avatar_data}
                alt={displayName}
                className="h-24 w-24 rounded-full object-cover border-2 border-card-border"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-accent text-3xl font-bold text-white select-none">
                {initials}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-card-border px-3 py-1.5 text-sm text-ink hover:bg-card-border"
            >
              {t('profile.changePhoto')}
            </button>
            {user?.avatar_data && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="rounded-lg border border-expense/40 px-3 py-1.5 text-sm text-expense hover:bg-expense/10"
              >
                {t('profile.removePhoto')}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">{t('profile.firstName')}</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                maxLength={100}
                className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">{t('profile.lastName')}</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                maxLength={100}
                className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-muted">{t('profile.displayName')}</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-muted opacity-60 cursor-not-allowed"
            />
          </div>

          {/* Security question section */}
          <div className="border-t border-card-border pt-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-ink">
                {user?.security_question
                  ? t('security.changeQuestion')
                  : t('security.setQuestion')}
              </p>
              {user?.security_question && (
                <p className="mt-1 text-xs text-income">{t('security.questionSet')}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-muted">{t('security.question')}</label>
              <select value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20">
                <option value="">— {t('security.selectQuestion')} —</option>
                {SECURITY_QUESTION_KEYS.map((k) => (
                  <option key={k} value={t(k)}>{t(k)}</option>
                ))}
              </select>
            </div>
            {securityQuestion && (
              <div>
                <label className="mb-1 block text-sm font-medium text-muted">{t('security.newAnswer')}</label>
                <input type="text" value={securityAnswer} onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder={t('security.answerHint')}
                  className="w-full rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" />
                <p className="mt-0.5 text-xs text-muted">{t('security.answerNote')}</p>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-expense">{error}</p>
          )}

          {saved && (
            <p className="text-sm text-income">{t('profile.saved')}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? t('common.saving') : t('profile.save')}
          </button>
        </form>
      </div>
    </div>
  )
}
