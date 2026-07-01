import { useTranslation } from 'react-i18next'
import ThemeToggle from './ThemeToggle'

const LANGUAGES = [
  { code: 'he', flag: '🇮🇱', name: 'עברית' },
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'fr', flag: '🇫🇷', name: 'Français' },
]

export default function TopBar() {
  const { i18n } = useTranslation()

  const handleLang = (code) => {
    i18n.changeLanguage(code)
    localStorage.setItem('language', code)
  }

  return (
    <div className="mb-4 flex items-center justify-end gap-2">
      <select
        value={i18n.language}
        onChange={(e) => handleLang(e.target.value)}
        className="rounded-lg border border-card-border bg-card px-2 py-1.5 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        aria-label="Language"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.name}
          </option>
        ))}
      </select>
      <ThemeToggle />
    </div>
  )
}
