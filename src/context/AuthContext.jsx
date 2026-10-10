
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { getAuthToken } from '../services/api.js'

import {
  getCurrentUser,
  login as loginService,
  logout as logoutService,
  register as registerService,
} from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null)
      setIsLoading(false)
      return null
    }

    setIsLoading(true)

    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      return currentUser
    } catch {
      logoutService()
      setUser(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      if (!getAuthToken()) {
        if (!cancelled) {
          setIsLoading(false)
        }
        return
      }

      try {
        const currentUser = await getCurrentUser()

        if (!cancelled) {
          setUser(currentUser)
        }
      } catch {
        logoutService()

        if (!cancelled) {
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  const signIn = useCallback(async (credentials) => {
    const result = await loginService(credentials)
    setUser(result.user)
    return result.user
  }, [])

  const signUp = useCallback(async (details) => {
    const result = await registerService(details)
    setUser(result.user)
    return result.user
  }, [])

  const signOut = useCallback(() => {
    logoutService()
    setUser(null)
  }, [])

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
