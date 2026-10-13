
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'

function DashboardPage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  const displayName =
    user?.displayName || user?.name || user?.email || 'CivicAid user'

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

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

        <nav className="primary-nav" aria-label="Workspace navigation">
          <Link to="/">Home</Link>
          <Link to="/functional-needs">Functional needs</Link>
          <Link to="/discover">Explore AT</Link>
          <Link to="/schemes">Schemes</Link>
          <Link to="/providers">Find services</Link>
          <Link to="/lifecycle">My devices</Link>
          <Link to="/saved">Saved</Link>
        </nav>

        <Link
          className="button button-outline header-action"
          to="/profile"
        >
          My Profile
        </Link>

        <button
          className="button button-outline header-action"
          type="button"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </header>

      <main id="main-content" className="resources-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR CIVICAID ACCOUNT</p>
            <h1>Welcome, {displayName}</h1>
            <p>
              Your CivicAid workspace helps you organise your assistive
              technology journey. Review your account, describe your
              functional needs, and explore available resources.
            </p>
          </div>
        </div>

        <section
          className="information-note"
          aria-labelledby="account-status"
        >
          <span className="note-icon" aria-hidden="true">
            i
          </span>

          <div>
            <h2 id="account-status">Your account</h2>
            <p>
              Signed in as{' '}
              <strong>{user?.email || 'your account'}</strong>.
              Your session is managed by CivicAid's authentication service.
            </p>

            <div className="auth-links">
              <Link
                className="button button-primary"
                to="/profile"
              >
                View my profile
              </Link>
            </div>
          </div>
        </section>

        <section
          className="resources-section"
          aria-labelledby="next-steps"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">NEXT STEPS</p>
              <h2 id="next-steps">Explore CivicAid</h2>
              <p>
                Start by recording the functional areas for which you
                would like to explore assistive technology options.
                Your selections help organise your discovery journey;
                they are not a medical diagnosis or prescription.
              </p>

              <div className="auth-links">
                <Link
                  className="button button-primary"
                  to="/functional-needs"
                >
                  Choose functional needs
                </Link>

                <Link
                  className="button button-outline"
                  to="/discover"
                >
                  Explore assistive technology
                </Link>

                <Link className="button button-outline" to="/schemes">Explore schemes</Link>
                <Link className="button button-outline" to="/providers">Find services</Link>
                <Link className="button button-outline" to="/lifecycle">Manage my devices</Link>
                <Link className="button button-outline" to="/saved">View saved resources</Link>
                <Link className="button button-outline" to="/admin">Admin verification</Link>
                <Link className="auth-return-link" to="/">Explore the homepage</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <Link className="footer-brand" to="/">
          CivicAid
        </Link>

        <p>Making assistive technology information easier to explore.</p>

        <span>
          Built around accessibility, clarity and informed choice.
        </span>
      </footer>
    </div>
  )
}

export default DashboardPage
