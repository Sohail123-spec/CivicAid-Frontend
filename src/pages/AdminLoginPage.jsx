
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../services/api.js'
import '../App.css'

function AdminLoginPage() {
  const navigate = useNavigate()
  const { signIn, signOut } = useAuth()
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')
    setBusy(true)

    const form = new FormData(event.currentTarget)
    const email = form.get('email')
    const password = form.get('password')

    try {
      await signIn({ email, password })

      try {
        // The backend decides whether this account has ADMIN access.
        await api.get('/admin/schemes')
        navigate('/admin', { replace: true })
      } catch (error) {
        signOut()

        if (error.response?.status === 403) {
          setNotice(
            'This account does not have administrator access. Please use an authorized ADMIN account.',
          )
        } else if (error.response?.status === 401) {
          setNotice(
            'Your session could not be authorized. Please sign in again.',
          )
        } else {
          setNotice(
            'Unable to verify administrator access. Please try again when the backend is available.',
          )
        }
      }
    } catch (error) {
      const status = error.response?.status

      if (status === 401) {
        setNotice('Email address or password is incorrect.')
      } else if (!error.response) {
        setNotice('Unable to reach CivicAid. Please try again.')
      } else {
        setNotice(
          error.response.data?.message ||
            'Administrator sign-in failed. Please try again.',
        )
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="CivicAid home">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span>
            <span className="brand-name">CivicAid</span>
            <span className="brand-caption">
              Assistive technology access
            </span>
          </span>
        </Link>

        <Link className="button button-outline" to="/login">
          User sign in
        </Link>
      </header>

      <main className="auth-main" id="main-content">
        <section className="auth-card">
          <p className="eyebrow">ADMINISTRATION</p>
          <h1 className="auth-title">Administrator sign in</h1>
          <p className="auth-description">
            Sign in with an existing CivicAid administrator account
            to access the verification workspace.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="auth-field">
              Administrator email
              <input
                className="auth-input"
                type="email"
                name="email"
                autoComplete="username"
                required
                disabled={busy}
              />
            </label>

            <label className="auth-field">
              Password
              <input
                className="auth-input"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                disabled={busy}
              />
            </label>

            <button
              className="button button-primary auth-submit"
              type="submit"
              disabled={busy}
            >
              {busy ? 'Verifying access…' : 'Sign in as administrator'}
            </button>
          </form>

          {notice && (
            <p className="auth-notice" role="alert">
              {notice}
            </p>
          )}

          <div className="auth-links">
            <p>
              Not an administrator? <Link to="/login">User sign in</Link>
            </p>
            <Link to="/" className="auth-return-link">
              ← Return to home
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <Link className="footer-brand" to="/">CivicAid</Link>
        <p>Secure access to the administration workspace.</p>
      </footer>
    </div>
  )
}

export default AdminLoginPage
