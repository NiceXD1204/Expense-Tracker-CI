import axios from 'axios'
import { createContext, useContext, useEffect, useState } from 'react'

const BASE = import.meta.env.VITE_BACKEND_URL || '/api'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem('token') || sessionStorage.getItem('token') || null
  )
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    axios
      .get(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => setUser(r.data))
      .catch(() => {
        setToken(null)
        localStorage.removeItem('token')
        sessionStorage.removeItem('token')
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = async (email, password, rememberMe) => {
    const { data } = await axios.post(`${BASE}/auth/login`, {
      email,
      password,
      remember_me: rememberMe,
    })
    const t = data.access_token
    if (rememberMe) localStorage.setItem('token', t)
    else sessionStorage.setItem('token', t)
    setToken(t)
    const me = await axios.get(`${BASE}/auth/me`, { headers: { Authorization: `Bearer ${t}` } })
    setUser(me.data)
    return me.data
  }

  const register = async (email, password, displayName) => {
    await axios.post(`${BASE}/auth/register`, { email, password, display_name: displayName })
    return login(email, password, false)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    sessionStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ token, user, setUser, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
