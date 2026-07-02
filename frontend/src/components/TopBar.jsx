import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from './ThemeToggle'

const LANGUAGES = [
  { code: 'he', flag: '🇮🇱', name: 'עברית' },
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
]

function UserAvatar({ user }) {
  if (!user) return null

  const initials = user.first_name && user.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
    : (user.display_name?.[0] || user.email?.[0] || '?').toUpperCase()

  return (
    <Link to="/profile" className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/40">
      {user.avatar_data ? (
        <img
          src={user.avatar_data}
          alt={user.display_name}
          className="h-8 w-8 rounded-full object-cover border border-card-border"
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-white select-none">
          {initials}
        </span>
      )}
    </Link>
  )
}

export default function TopBar() {
  const { i18n } = useTranslation()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[1]

  const handleLang = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
    setOpen(false)
  }

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  return (
    <div className="mb-4 flex items-center justify-end gap-2">
      {/* Custom language dropdown — native <select> doesn't render flag emojis on Windows */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-2.5 py-1.5 text-sm text-ink hover:bg-card-border focus:outline-none focus:ring-2 focus:ring-accent/20"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{current.flag}</span>
          <span className="hidden sm:inline">{current.name}</span>
          <svg className="h-3 w-3 text-muted" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 8L1 3h10L6 8z" />
          </svg>
        </button>

        {open && (
          <ul
            role="listbox"
            className="absolute right-0 z-50 mt-1 min-w-[10rem] overflow-hidden rounded-lg border border-card-border bg-card shadow-lg"
          >
            {LANGUAGES.map((l) => (
              <li key={l.code}>
                <button
                  role="option"
                  aria-selected={l.code === i18n.language}
                  onClick={() => handleLang(l.code)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-card-border ${
                    l.code === i18n.language ? 'font-semibold text-accent' : 'text-ink'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ThemeToggle />
      <UserAvatar user={user} />
    </div>
  )
}
