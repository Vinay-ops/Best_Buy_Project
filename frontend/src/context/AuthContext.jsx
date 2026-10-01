import React, { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [checked, setChecked] = useState(false)

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.logged_in) setUser(data.user)
        else setUser(null)
      }
    } catch (e) {}
    setChecked(true)
  }, [])

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (res.ok) { setUser(data.user); return { ok: true } }
    return { ok: false, error: data.error }
  }, [])

  const register = useCallback(async (username, password) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (res.ok) return { ok: true }
    return { ok: false, error: data.error }
  }, [])

  const logout = useCallback(async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, checked, checkAuth, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
