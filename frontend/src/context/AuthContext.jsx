import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import api, { TOKEN_KEY, USER_KEY } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    let active = true
    const token = sessionStorage.getItem(TOKEN_KEY)

    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/auth/me')
      .then((response) => {
        if (active) {
          setUser(response.data.username)
          sessionStorage.setItem(USER_KEY, response.data.username)
        }
      })
      .catch(() => {
        if (active) clearSession()
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [clearSession])

  useEffect(() => {
    const handleUnauthorized = () => clearSession()
    window.addEventListener('library:unauthorized', handleUnauthorized)
    return () =>
      window.removeEventListener('library:unauthorized', handleUnauthorized)
  }, [clearSession])

  const login = useCallback(async (username, password) => {
    const response = await api.post('/auth/login', { username, password })
    const { token, username: adminUsername } = response.data

    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, adminUsername)
    setUser(adminUsername)
    return adminUsername
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // The local session must be cleared even if the server is unreachable.
    } finally {
      clearSession()
    }
  }, [clearSession])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
