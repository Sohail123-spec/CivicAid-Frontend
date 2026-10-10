
import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <main
        className="auth-main"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="auth-card">
          <p role="status">Restoring your CivicAid session…</p>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return children
}

export default ProtectedRoute
