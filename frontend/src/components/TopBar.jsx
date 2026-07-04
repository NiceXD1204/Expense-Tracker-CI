import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'

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
  const { user } = useAuth()

  return (
    <div className="mb-4 flex items-center justify-end gap-2">
      <LanguageSwitcher />
      <ThemeToggle />
      <UserAvatar user={user} />
    </div>
  )
}
