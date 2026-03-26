import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'token';
const USER_KEY = 'fg_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'

  // Persist user to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_KEY)
    }
  }, [user])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem(TOKEN_KEY, data.token)
      setUser(data.user)
      navigate('/dashboard')
      return data
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const register = useCallback(async (formData) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', formData)
      localStorage.setItem(TOKEN_KEY, data.token)
      setUser(data.user)
      navigate('/dashboard')
      return data
    } finally {
      setLoading(false)
    }
  }, [navigate])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
    navigate('/')
  }, [navigate])

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me')
      setUser(data)
    } catch {
      // Token expired or invalid
      logout()
    }
  }, [logout])

  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    refreshUser,
    setUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthContext
