
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext.jsx'
import { getCurrentUser, updateCurrentUser, deleteCurrentUser } from '../services/authService.js'

function formatAccountStatus(status) {
  if (typeof status !== 'string' || !status.trim()) {
    return 'Not available'
  }

  return status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function ProfilePage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  // Edit display name
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBusy, setEditBusy] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  // Account deletion
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadProfile() {
      setIsLoading(true)
      setError('')
      setProfile(null)

      try {
        const currentProfile = await getCurrentUser()

        if (
          !currentProfile ||
          typeof currentProfile !== 'object'
        ) {
          throw new Error('Invalid profile response')
        }

        if (!cancelled) {
          setProfile(currentProfile)
          setEditName(currentProfile.displayName ?? '')
        }
      } catch {
        if (!cancelled) {
          setError(
            "We couldn't load your profile. Please check your connection and try again.",
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [retryCount])

  function handleSignOut() {
    signOut()
    navigate('/login', { replace: true })
  }

  function handleRetry() {
    setRetryCount((currentCount) => currentCount + 1)
  }

  async function handleEditSubmit(event) {
    event.preventDefault()
    const trimmed = editName.trim()
    if (!trimmed) {
      setEditError('Display name cannot be empty.')
      return
    }
    if (trimmed.length > 100) {
      setEditError('Display name must not exceed 100 characters.')
      return
    }
    setEditBusy(true)
    setEditError('')
    setEditSuccess('')
    try {
      const updated = await updateCurrentUser({ displayName: trimmed })
      setProfile(updated)
      setEditName(updated.displayName ?? '')
      setEditSuccess('Display name updated successfully.')
      setEditMode(false)
    } catch (requestError) {
      const status = requestError?.response?.status
      const message = requestError?.response?.data?.message
      setEditError(
        status === 400
          ? (message || 'The display name provided is not valid.')
          : status === 401
          ? 'Your session has expired. Sign in again.'
          : message || 'We could not update your profile. Please try again.',
      )
    } finally {
      setEditBusy(false)
    }
  }

  function handleEditCancel() {
    setEditMode(false)
    setEditName(profile?.displayName ?? '')
    setEditError('')
    setEditSuccess('')
  }

  async function handleDeleteConfirm() {
    setDeleteBusy(true)
    setDeleteError('')
    try {
      await deleteCurrentUser()
      signOut()
      navigate('/', { replace: true })
    } catch (requestError) {
      const status = requestError?.response?.status
      const message = requestError?.response?.data?.message
      setDeleteError(
        status === 409
          ? (message || 'Your account cannot be deleted because it is referenced in audit or verification history. Contact an administrator.')
          : status === 401
          ? 'Your session has expired. Sign in again.'
          : message || 'We could not delete your account. Please try again.',
      )
      setShowDeleteConfirm(false)
    } finally {
      setDeleteBusy(false)
    }
  }

  const displayName =
    profile?.displayName?.trim() || 'Name not provided'

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

        <nav className="primary-nav" aria-label="Account navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/functional-needs">Functional needs</Link>
          <Link to="/discover">Explore AT</Link>
        </nav>

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
            <h1>My profile</h1>
            <p>
              Review and update the account information associated with
              your CivicAid account.
            </p>
          </div>
        </div>

        {isLoading ? (
          <section
            className="information-note"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="note-icon" aria-hidden="true">
              i
            </span>

            <div>
              <h2>Loading your profile</h2>
              <p role="status">
                Please wait while we retrieve your account information.
              </p>
            </div>
          </section>
        ) : error ? (
          <section className="information-note" role="alert">
            <span className="note-icon" aria-hidden="true">
              !
            </span>

            <div>
              <h2>Profile unavailable</h2>
              <p>{error}</p>

              <div className="auth-links">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={handleRetry}
                >
                  Try again
                </button>

                <Link
                  className="auth-return-link"
                  to="/dashboard"
                >
                  Return to dashboard
                </Link>
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* ── Account details ─────────────────────────────────────── */}
            <section
              className="resources-section"
              aria-labelledby="profile-details-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">ACCOUNT DETAILS</p>
                  <h2 id="profile-details-heading">
                    {displayName}
                  </h2>
                  <p>
                    These details were retrieved from your authenticated
                    CivicAid account.
                  </p>
                </div>
              </div>

              <div className="resource-grid">
                <article className="resource-card">
                  <h3>Display name</h3>
                  <p>{displayName}</p>
                </article>

                <article className="resource-card">
                  <h3>Email address</h3>
                  <p>{profile.email || 'Not available'}</p>
                </article>

                <article className="resource-card">
                  <h3>Account status</h3>
                  <p>{formatAccountStatus(profile.accountStatus)}</p>
                </article>
              </div>
            </section>

            {/* ── Edit display name ────────────────────────────────────── */}
            <section
              className="workspace-panel"
              aria-labelledby="edit-profile-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">EDIT PROFILE</p>
                  <h2 id="edit-profile-heading">Update display name</h2>
                  <p>
                    You may change the name shown on your CivicAid account.
                    Email address cannot be changed through this page.
                  </p>
                </div>
              </div>

              {editSuccess && !editMode && (
                <p role="status" className="success-message">{editSuccess}</p>
              )}

              {!editMode ? (
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => {
                    setEditMode(true)
                    setEditError('')
                    setEditSuccess('')
                    setEditName(profile?.displayName ?? '')
                  }}
                >
                  Edit display name
                </button>
              ) : (
                <form className="stacked-form" onSubmit={handleEditSubmit}>
                  <label className="auth-field">
                    Display name
                    <input
                      className="auth-input"
                      type="text"
                      value={editName}
                      maxLength={100}
                      required
                      aria-required="true"
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </label>
                  {editError && (
                    <p role="alert" className="form-error">{editError}</p>
                  )}
                  <div className="auth-links">
                    <button
                      className="button button-primary"
                      type="submit"
                      disabled={editBusy}
                    >
                      {editBusy ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                      className="button button-outline"
                      type="button"
                      onClick={handleEditCancel}
                      disabled={editBusy}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* ── Journey links ────────────────────────────────────────── */}
            <section
              className="resources-section"
              aria-labelledby="profile-next-steps-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">CONTINUE YOUR JOURNEY</p>
                  <h2 id="profile-next-steps-heading">
                    Manage your CivicAid journey
                  </h2>
                  <p>
                    Your saved functional needs help organise your
                    assistive technology discovery. They describe
                    what you want to explore and are not a medical
                    diagnosis.
                  </p>
                </div>
              </div>

              <div className="auth-links">
                <Link
                  className="button button-primary"
                  to="/functional-needs"
                >
                  Manage functional needs
                </Link>

                <Link
                  className="button button-outline"
                  to="/discover"
                >
                  Explore assistive technology
                </Link>

                <Link
                  className="auth-return-link"
                  to="/dashboard"
                >
                  Return to dashboard
                </Link>
              </div>
            </section>

            {/* ── Account deletion ─────────────────────────────────────── */}
            <section
              className="workspace-panel"
              aria-labelledby="delete-account-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PRIVACY</p>
                  <h2 id="delete-account-heading">Delete account</h2>
                  <p>
                    Permanently deletes your account and all your personal
                    data including functional needs, saved resources, and
                    lifecycle records. This action cannot be undone.
                  </p>
                  <p>
                    Deletion is not available if your account has recorded
                    a verification outcome or appears in audit history, as
                    those records are required for platform integrity.
                  </p>
                </div>
              </div>

              {deleteError && (
                <p role="alert" className="form-error">{deleteError}</p>
              )}

              {!showDeleteConfirm ? (
                <button
                  className="button button-outline"
                  type="button"
                  style={{ borderColor: 'var(--color-error, #b91c1c)', color: 'var(--color-error, #b91c1c)' }}
                  onClick={() => {
                    setDeleteError('')
                    setShowDeleteConfirm(true)
                  }}
                >
                  Delete my account
                </button>
              ) : (
                <div className="information-note" role="alertdialog" aria-labelledby="delete-confirm-heading" aria-modal="false">
                  <div>
                    <h3 id="delete-confirm-heading">Confirm account deletion</h3>
                    <p>
                      This will permanently remove your account and all associated
                      personal data. This cannot be undone. Are you sure?
                    </p>
                    <div className="auth-links">
                      <button
                        className="button button-primary"
                        type="button"
                        disabled={deleteBusy}
                        style={{ background: 'var(--color-error, #b91c1c)', borderColor: 'var(--color-error, #b91c1c)' }}
                        onClick={handleDeleteConfirm}
                      >
                        {deleteBusy ? 'Deleting…' : 'Yes, permanently delete my account'}
                      </button>
                      <button
                        className="button button-outline"
                        type="button"
                        disabled={deleteBusy}
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <Link className="footer-brand" to="/">
          CivicAid
        </Link>

        <p>
          Making assistive technology information easier to explore.
        </p>

        <span>
          Built around accessibility, clarity and informed choice.
        </span>
      </footer>
    </div>
  )
}

export default ProfilePage
