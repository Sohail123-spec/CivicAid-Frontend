
import { useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { useAuth } from './context/AuthContext.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import FunctionalNeedsPage from './pages/FunctionalNeedsPage.jsx'
import ATDiscoveryPage from './pages/ATDiscoveryPage.jsx'
import ATProductDetailPage from './pages/ATProductDetailPage.jsx'
import SchemeDetailPage from './pages/SchemeDetailPage.jsx'
import ProvidersPage from './pages/ProvidersPage.jsx'
import LifecyclePage from './pages/LifecyclePage.jsx'
import SavedResourcesPage from './pages/SavedResourcesPage.jsx'
import AdminVerificationPage from './pages/AdminVerificationPage.jsx'
import SchemesPage from './pages/SchemesPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import './App.css'

const navigationItems = [
  { label: 'Home', href: '#home' },
  { label: 'Explore AT', href: '/discover' },
  { label: 'Schemes & Support', href: '/schemes' },
  { label: 'Find Services', href: '/providers' },
  { label: 'My Devices', href: '/lifecycle' },
  { label: 'Saved', href: '/saved' },
]

const resourceCards = [
  {
    number: '01',
    id: 'explore',
    title: 'Explore assistive technology',
    description:
      'Learn about assistive technology categories and options that can support mobility, vision, hearing, communication and everyday activities.',
    action: 'Explore technology',
    link: '/discover',
  },
  {
    number: '02',
    id: 'schemes',
    title: 'Schemes and support',
    description:
      'Understand available support programmes, eligibility information, required documents and official application channels.',
    action: 'Explore support',
    link: '/schemes',
  },
  {
    number: '03',
    id: 'services',
    title: 'Find services',
    description:
      'Discover service providers, the services they offer, location information and available contact details.',
    action: 'Explore services',
    link: '#services',
  },
  {
    number: '04',
    id: 'devices',
    title: 'Manage your devices',
    description:
      'Keep your assistive technology journey organised with device records, maintenance history, repairs and reassessment information.',
    action: 'Learn about device records',
    link: '#device-lifecycle',
  },
  {
    number: '05',
    id: 'saved',
    title: 'Keep useful resources',
    description:
      'Save useful information so you can return to relevant assistive technology options, support programmes and services.',
    action: 'Learn about saved resources',
    link: '#saved-resources',
  },
]

const trustPoints = [
  {
    symbol: '◎',
    title: 'Clear information',
    description: 'Understand your options in plain language.',
  },
  {
    symbol: '↗',
    title: 'Official sources',
    description: 'Find the appropriate source or application channel.',
  },
  {
    symbol: '◷',
    title: 'Verification details',
    description: 'Check when information was last verified.',
  },
]

function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="CivicAid home">
        <span className="brand-mark" aria-hidden="true">
          C
        </span>
        <span>
          <span className="brand-name">CivicAid</span>
          <span className="brand-caption">
            Assistive technology access
          </span>
        </span>
      </Link>

      <nav className="primary-nav" aria-label="Main navigation">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            to={item.href.startsWith('#') ? `/${item.href}` : item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Link className="button button-outline header-action" to="/login">
        Sign in
      </Link>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link className="footer-brand" to="/">
        CivicAid
      </Link>
      <p>Making assistive technology information easier to explore.</p>
      <span>
        Built around accessibility, clarity and informed choice.
      </span>
    </footer>
  )
}

function HomePage() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <SiteHeader />

      <main id="main-content">
        <section className="hero-section" id="home">
          <div className="hero-copy">
            <p className="eyebrow">ACCESS · INFORMATION · SUPPORT</p>
            <h1>
              Find support for your
              <span> assistive technology journey.</span>
            </h1>
            <p className="hero-description">
              Explore assistive technology options, support schemes,
              services and lifecycle resources in one accessible place.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#explore">
                Start exploring <span aria-hidden="true">→</span>
              </a>
              <a className="button button-outline" href="#resources">
                Browse resources
              </a>
            </div>
            <p className="hero-note">
              Take the next step at your own pace. Use clear information
              and source details to help guide your decisions.
            </p>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="visual-orbit orbit-one" />
            <div className="visual-orbit orbit-two" />
            <div className="visual-center">
              <span className="visual-symbol">+</span>
              <span className="visual-center-label">Support, your way</span>
            </div>
            <div className="floating-card visual-card-top">
              <span className="visual-card-icon">↗</span>
              <span>
                <strong>Explore options</strong>
                <small>Understand what may help</small>
              </span>
            </div>
            <div className="floating-card visual-card-bottom">
              <span className="visual-card-icon">✓</span>
              <span>
                <strong>Check the source</strong>
                <small>Review verification details</small>
              </span>
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="CivicAid principles">
          {trustPoints.map((point) => (
            <div key={point.title}>
              <span className="trust-icon" aria-hidden="true">
                {point.symbol}
              </span>
              <span>
                <strong>{point.title}</strong>
                <small>{point.description}</small>
              </span>
            </div>
          ))}
        </section>

        <section className="resources-section" id="resources">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR NEXT STEP</p>
              <h2>How can CivicAid help you?</h2>
              <p>
                Start with what matters to you. Explore the available
                resource areas and learn what each part of your journey
                can involve.
              </p>
            </div>
          </div>

          <div className="resource-grid">
            {resourceCards.map((resource) => (
              <article
                className="resource-card"
                id={resource.id}
                key={resource.number}
              >
                <span className="resource-number">{resource.number}</span>
                <h3>{resource.title}</h3>
                <p>{resource.description}</p>

                {resource.link.startsWith('/') ? (
                  <Link to={resource.link} className="text-link">
                    {resource.action}{' '}
                    <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <a href={resource.link} className="text-link">
                    {resource.action}{' '}
                    <span aria-hidden="true">→</span>
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="resources-section" id="device-lifecycle">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BEYOND DISCOVERY</p>
              <h2>Support throughout the device lifecycle</h2>
              <p>
                Assistive technology support may continue long after
                selecting a device. Keeping relevant records can help
                organise the next steps.
              </p>
            </div>
          </div>

          <div className="resource-grid">
            <article className="resource-card">
              <span className="resource-number">01</span>
              <h3>Acquisition and use</h3>
              <p>
                Keep track of device details, acquisition information
                and warranty records where applicable.
              </p>
            </article>
            <article className="resource-card">
              <span className="resource-number">02</span>
              <h3>Maintenance and repair</h3>
              <p>
                Organise maintenance history, repair details and
                relevant service contacts.
              </p>
            </article>
            <article className="resource-card">
              <span className="resource-number">03</span>
              <h3>Reassessment and replacement</h3>
              <p>
                Keep reassessment and replacement information available
                for future planning with appropriate professionals.
              </p>
            </article>
          </div>
        </section>

        <section className="information-note" id="help">
          <span className="note-icon" aria-hidden="true">
            i
          </span>
          <div>
            <h2>Information to support informed decisions</h2>
            <p>
              CivicAid is designed to help you discover assistive
              technology information, support programmes and services.
              It does not diagnose conditions, prescribe devices,
              guarantee device suitability or confirm eligibility for
              schemes or funding. Professional assessment and official
              decisions remain with the appropriate professionals
              and authorities.
            </p>
          </div>
        </section>

        <section className="resources-section" id="saved-resources">
          <div className="section-heading">
            <div>
              <p className="eyebrow">KEEP INFORMATION CLOSE</p>
              <h2>Resources for your next step</h2>
              <p>
                As you explore CivicAid, saved resources can help you
                return to information you want to review again.
                Always check the source and verification details
                before relying on time-sensitive information.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

function AuthLayout({ children }) {
  return (
    <div className="auth-page">
      <SiteHeader />
      <main className="auth-main" id="main-content">
        <div className="auth-card">{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}

function getErrorMessage(error, fallback) {
  if (!error.response) {
    return 'Unable to reach CivicAid. Check that the backend is running and try again.'
  }

  const data = error.response.data

  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message
  }

  if (typeof data?.detail === 'string' && data.detail.trim()) {
    return data.detail
  }

  if (error.response.status === 400) {
    return 'Please check the information you entered and try again.'
  }

  if (error.response.status === 401) {
    return 'The email address or password is incorrect.'
  }

  if (error.response.status === 409) {
    return 'An account with this email address may already exist.'
  }

  return fallback
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, isAuthenticated, isLoading } = useAuth()
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')

    const formData = new FormData(event.currentTarget)
    const email = formData.get('email')
    const password = formData.get('password')

    setIsSubmitting(true)

    try {
      await signIn({ email, password })

      const requestedPath = location.state?.from
      const destination =
        requestedPath &&
        typeof requestedPath.pathname === 'string' &&
        requestedPath.pathname.startsWith('/') &&
        !requestedPath.pathname.startsWith('//')
          ? `${requestedPath.pathname}${requestedPath.search ?? ''}${requestedPath.hash ?? ''}`
          : '/dashboard'

      navigate(destination, { replace: true })
    } catch (error) {
      setNotice(
        getErrorMessage(error, 'Sign-in failed. Please try again.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <p className="eyebrow">WELCOME BACK</p>
      <h1 className="auth-title">Sign in to CivicAid</h1>
      <p className="auth-description">
        Access your saved resources and assistive technology records.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          Email address
          <input
            className="auth-input"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </label>

        <button
          className="button button-primary auth-submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {notice && (
        <p className="auth-notice" role="alert" aria-live="polite">
          {notice}
        </p>
      )}

      <div className="auth-links">
        <p>
          New to CivicAid? <Link to="/register">Create an account</Link>
        </p>
        <Link to="/" className="auth-return-link">
          ← Return to home
        </Link>
      </div>
    </AuthLayout>
  )
}

function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, isAuthenticated, isLoading } = useAuth()
  const [notice, setNotice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')

    const formData = new FormData(event.currentTarget)
    const displayName = formData.get('displayName')
    const email = formData.get('email')
    const password = formData.get('password')

    setIsSubmitting(true)

    try {
      await signUp({ displayName, email, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setNotice(
        getErrorMessage(error, 'Registration failed. Please try again.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout>
      <p className="eyebrow">GET STARTED</p>
      <h1 className="auth-title">Create your account</h1>
      <p className="auth-description">
        Create a CivicAid account to prepare for managing your resources
        and assistive technology journey.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          Full name
          <input
            className="auth-input"
            type="text"
            name="displayName"
            autoComplete="name"
            minLength={1}
            maxLength={120}
            required
            disabled={isSubmitting}
          />
        </label>

        <label className="auth-field">
          Email address
          <input
            className="auth-input"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            disabled={isSubmitting}
          />
        </label>

        <label className="auth-field">
          Password
          <input
            className="auth-input"
            type="password"
            name="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={72}
            required
            disabled={isSubmitting}
          />
          <span className="auth-help-text">
            Use between 8 and 72 characters.
          </span>
        </label>

        <button
          className="button button-primary auth-submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      {notice && (
        <p className="auth-notice" role="alert" aria-live="polite">
          {notice}
        </p>
      )}

      <div className="auth-links">
        <p>
          Already registered? <Link to="/login">Sign in</Link>
        </p>
        <Link to="/" className="auth-return-link">
          ← Return to home
        </Link>
      </div>
    </AuthLayout>
  )
}

function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <AuthLayout>
      <p className="eyebrow">PAGE NOT FOUND</p>
      <h1 className="auth-title">We couldn't find that page.</h1>
      <p className="auth-description">
        The address may be incorrect, or the page may not be available yet.
      </p>
      <button
        type="button"
        className="button button-primary auth-submit"
        onClick={() => navigate('/')}
      >
        Return to home
      </button>
    </AuthLayout>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/functional-needs"
        element={
          <ProtectedRoute>
            <FunctionalNeedsPage />
          </ProtectedRoute>
        }
      />

      <Route path="/discover" element={<ATDiscoveryPage />} />

      <Route
        path="/discover/products/:productId"
        element={<ATProductDetailPage />}
      />

      <Route path="/schemes" element={<SchemesPage />} />
      <Route path="/schemes/:schemeId" element={<SchemeDetailPage />} />
      <Route path="/providers" element={<ProvidersPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminVerificationPage /></ProtectedRoute>} />

      <Route
        path="/lifecycle"
        element={<ProtectedRoute><LifecyclePage /></ProtectedRoute>}
      />
      <Route
        path="/saved"
        element={<ProtectedRoute><SavedResourcesPage /></ProtectedRoute>}
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
