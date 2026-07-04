import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'

const RTL_LANGS = ['he', 'ar']

function NavItems({ onClose, showLabels }) {
  const { t } = useTranslation()
  const { logout } = useAuth()

  const NAV_ITEMS = [
    { to: '/dashboard', labelKey: 'nav.dashboard', icon: IconGrid },
    { to: '/expenses', labelKey: 'nav.expenses', icon: IconShoppingBag },
    { to: '/income', labelKey: 'nav.income', icon: IconTrendingUp },
    { to: '/recurring', labelKey: 'nav.recurring', icon: IconRepeat },
    { to: '/subscriptions', labelKey: 'nav.subscriptions', icon: IconCreditCard },
    { to: '/analytics', labelKey: 'nav.analytics', icon: IconChart },
    { to: '/forecast', labelKey: 'nav.forecast', icon: IconForecast },
    { to: '/budgets', labelKey: 'nav.budgets', icon: IconWallet },
    { to: '/networth', labelKey: 'nav.networth', icon: IconLandmark },
    { to: '/reports', labelKey: 'nav.reports', icon: IconDocument },
    { to: '/investments', labelKey: 'nav.investments', icon: IconTrendingLine },
    { to: '/keren-hishtalmut', labelKey: 'nav.kerenHistalmut', icon: IconPiggy },
    { to: '/settings', labelKey: 'nav.settings', icon: IconSettings },
    { to: '/profile', labelKey: 'nav.profile', icon: IconUser },
  ]

  return (
    <>
      {NAV_ITEMS.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onClose}
          title={showLabels ? undefined : t(labelKey)}
          className={({ isActive }) =>
            [
              'flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors duration-200',
              showLabels ? 'gap-3 px-3' : 'justify-center',
              isActive ? 'bg-accent text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white',
            ].join(' ')
          }
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
            <Icon />
          </span>
          <span
            className={[
              'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200',
              showLabels ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0',
            ].join(' ')}
          >
            {t(labelKey)}
          </span>
        </NavLink>
      ))}
      <button
        onClick={() => { onClose?.(); logout() }}
        title={showLabels ? undefined : t('nav.logout')}
        className={[
          'flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-gray-300 transition-colors duration-200 hover:bg-white/10 hover:text-white',
          showLabels ? 'gap-3 px-3' : 'justify-center',
        ].join(' ')}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center">
          <IconLogout />
        </span>
        <span
          className={[
            'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200',
            showLabels ? 'max-w-[180px] opacity-100' : 'max-w-0 opacity-0',
          ].join(' ')}
        >
          {t('nav.logout')}
        </span>
      </button>
    </>
  )
}

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const { i18n } = useTranslation()
  const isRTL = RTL_LANGS.includes(i18n.language)

  const showLabels = isExpanded || open

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-sidebar px-4 py-3 text-white md:hidden">
        <span className="text-lg font-semibold">💸 Expense Tracker</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="rounded-md p-2 hover:bg-white/10"
        >
          <IconMenu />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar panel */}
      <aside
        dir={isRTL ? 'rtl' : 'ltr'}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={[
          /* shared */
          'fixed inset-y-0 z-40 flex w-64 flex-col bg-sidebar text-gray-300 overflow-hidden',
          /* mobile: slide transform */
          'transition-transform duration-300',
          isRTL ? 'right-0' : 'left-0',
          open ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full'),
          /* desktop: static + width transition; order is relative to the
             App-level flex container which is forced dir="ltr" so md:order
             deterministically places this on the physical right for RTL
             languages instead of relying on inherited flex-direction reversal */
          'md:static md:translate-x-0 md:shrink-0 md:transition-[width] md:duration-300 md:ease-in-out',
          isRTL ? 'md:order-2' : 'md:order-1',
          isExpanded ? 'md:w-64' : 'md:w-14',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center overflow-hidden px-3 py-5 text-xl font-bold text-white">
          <span className="shrink-0">💸</span>
          <span
            className={[
              'overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200',
              showLabels ? 'ml-2 max-w-[160px] opacity-100' : 'max-w-0 opacity-0',
            ].join(' ')}
          >
            Expense Tracker
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-1.5 py-1">
          <NavItems onClose={() => setOpen(false)} showLabels={showLabels} />
        </nav>

        {/* Footer */}
        <div
          className={[
            'overflow-hidden whitespace-nowrap px-3 text-xs text-gray-500 transition-[max-height,opacity] duration-200',
            showLabels ? 'max-h-10 py-4 opacity-100' : 'max-h-0 py-0 opacity-0',
          ].join(' ')}
        >
          DevOps Final Project · 2026
        </div>
      </aside>
    </>
  )
}

function IconMenu() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

function IconLogout() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}

function IconGrid() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
    </svg>
  )
}

function IconTrendingUp() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l5-5 4 4 8-9" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 7h6v6" />
    </svg>
  )
}

function IconRepeat() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 2l4 4-4 4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 22l-4-4 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

function IconCreditCard() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h4" />
    </svg>
  )
}

function IconForecast() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17l5-5 4 4 8-9" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 7h6v6" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} strokeDasharray="2 2" d="M3 21h18" />
    </svg>
  )
}

function IconLandmark() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M4 10h16M12 3l8 5H4l8-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10v8M10 10v8M14 10v8M18 10v8" />
    </svg>
  )
}

function IconShoppingBag() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 19V9m6 10V5m6 14v-7" />
    </svg>
  )
}

function IconWallet() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 0 1 2-2h11l3 3v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 13h2" />
    </svg>
  )
}

function IconDocument() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l3 3v15H7V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9h6M9 13h6M9 17h4" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317a1 1 0 0 1 1.35-1.052l1.06.39a1 1 0 0 1 .65.876l.06 1.122a7.97 7.97 0 0 1 1.61.93l1.06-.39a1 1 0 0 1 1.18.39l.6.99a1 1 0 0 1-.21 1.27l-.85.78c.1.55.1 1.11 0 1.66l.85.78a1 1 0 0 1 .21 1.27l-.6.99a1 1 0 0 1-1.18.39l-1.06-.39c-.49.39-1.03.7-1.61.93l-.06 1.12a1 1 0 0 1-.65.88l-1.06.39a1 1 0 0 1-1.35-1.05l.07-1.13a8.1 8.1 0 0 1-1.6-.93l-1.07.4a1 1 0 0 1-1.18-.4l-.6-.99a1 1 0 0 1 .21-1.26l.85-.78a6.3 6.3 0 0 1 0-1.66l-.85-.78a1 1 0 0 1-.21-1.27l.6-.99a1 1 0 0 1 1.18-.39l1.07.39c.48-.39 1.02-.7 1.6-.93l.07-1.12z" />
      <circle cx="12" cy="12" r="2.5" strokeWidth={2} />
    </svg>
  )
}

function IconUser() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" strokeWidth={2} />
    </svg>
  )
}

function IconTrendingLine() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l5-5 4 4 4-4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20h18" />
    </svg>
  )
}

function IconPiggy() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11c0 4-3.134 7-7 7s-7-3-7-7 3.134-7 7-7c1.8 0 3.45.68 4.7 1.8" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7h-4v4" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14h.01M12 16v2" />
    </svg>
  )
}
