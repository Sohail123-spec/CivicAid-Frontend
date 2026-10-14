import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, loading, signOut } = useAuth()
  const [adminCheck, setAdminCheck] = useState('checking')

  useEffect(() => {
    if (!requireAdmin || loading || !isAuthenticated) {
      return
    }

    let cancelled = false

    async function verifyAdmin() {
      try {
        await api.get('/admin/schemes')

        if (!cancelled) {
          setAdminCheck('admin')
        }
      } catch (error) {
        if (!cancelled) {
          setAdminCheck(
            error.response?.status === 401 ||
              error.response?.status === 403
              ? 'unauthorized'
              : 'error'
          )
        }
      }
    }

    verifyAdmin()

    return () => {
      cancelled = true
    }
  }, [requireAdmin, loading, isAuthenticated])

  if (loading) {
    return <p>Loading...</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!requireAdmin) {
    return children
  }

  if (adminCheck === 'checking') {
    return <p>Verifying administrator access...</p>
  }

  if (adminCheck !== 'admin') {
    if (adminCheck === 'unauthorized') {
      signOut()
      return <Navigate to="/admin/login" replace />
    }

    return <p>Unable to verify administrator access. Please try again.</p>
  }

  return children
}
