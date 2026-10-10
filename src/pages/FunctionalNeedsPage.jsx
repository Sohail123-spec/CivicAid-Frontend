
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  getAvailableNeeds,
  getMyFunctionalNeeds,
  saveMyFunctionalNeeds,
} from '../services/functionalNeedsService.js'

function getNeedCode(need) {
  return need.code
}

function FunctionalNeedsPage() {
  const [needs, setNeeds] = useState([])
  const [selectedCodes, setSelectedCodes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadNeeds() {
      setIsLoading(true)
      setError('')

      try {
        const availableNeeds = await getAvailableNeeds()

        let savedNeeds = []

        try {
          savedNeeds = await getMyFunctionalNeeds()
        } catch {
          // Keep the available options visible if loading saved
          // selections fails.
        }

        if (cancelled) return

        setNeeds(availableNeeds)

        setSelectedCodes(
          savedNeeds
            .map((need) =>
              typeof need === 'string' ? need : need.code,
            )
            .filter(Boolean),
        )
      } catch {
        if (!cancelled) {
          setError(
            'We could not load functional needs. Please try again.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadNeeds()

    return () => {
      cancelled = true
    }
  }, [])

  function toggleNeed(code) {
    setSelectedCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    )

    setNotice('')
    setError('')
  }

  async function handleSave(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (selectedCodes.length === 0) {
      setError('Please select at least one functional need.')
      return
    }

    setIsSaving(true)

    try {
      const savedNeeds = await saveMyFunctionalNeeds(selectedCodes)

      setSelectedCodes(
        savedNeeds
          .map((need) =>
            typeof need === 'string' ? need : need.code,
          )
          .filter(Boolean),
      )

      setNotice('Your functional needs have been saved.')
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message ||
          saveError?.message ||
          'We could not save your selections. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const selectableNeeds = needs
    .filter((need) => need.selectable !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))

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
        </nav>
      </header>

      <main id="main-content" className="resources-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR CIVICAID JOURNEY</p>
            <h1>Tell us what support you are looking for</h1>
            <p>
              Select the functional areas where you would like to
              explore assistive technology options. Your selections
              help organise your discovery journey; they are not a
              medical diagnosis or prescription.
            </p>
          </div>
        </div>

        {isLoading ? (
          <section className="information-note" aria-busy="true">
            <p role="status">Loading functional needs…</p>
          </section>
        ) : error && needs.length === 0 ? (
          <section className="information-note" role="alert">
            <p>{error}</p>
            <button
              className="button button-outline"
              type="button"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </section>
        ) : (
          <form onSubmit={handleSave}>
            <section
              className="resources-section"
              aria-labelledby="needs-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">FUNCTIONAL NEEDS</p>
                  <h2 id="needs-heading">Choose all that apply</h2>
                  <p>
                    Selected: {selectedCodes.length}
                  </p>
                </div>
              </div>

              {selectableNeeds.length === 0 ? (
                <p role="status">
                  No selectable functional needs are currently available.
                </p>
              ) : (
                <div className="resource-grid">
                  {selectableNeeds.map((need) => {
                    const code = getNeedCode(need)
                    const checked = selectedCodes.includes(code)
                    const inputId = `need-${code}`

                    return (
                      <label
                        className="resource-card functional-need-card"
                        htmlFor={inputId}
                        key={code}
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleNeed(code)}
                        />

                        <span className="functional-need-content">
                          <strong className="functional-need-title">
                            {need.label}
                          </strong>

                          {need.description && (
                            <span className="functional-need-description">
                              {need.description}
                            </span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}

              {error && (
                <p className="auth-notice" role="alert">
                  {error}
                </p>
              )}

              {notice && (
                <p className="auth-notice" role="status">
                  {notice}
                </p>
              )}

              <div className="auth-links">
                <button
                  className="button button-primary"
                  type="submit"
                  disabled={
                    isSaving ||
                    isLoading ||
                    selectableNeeds.length === 0
                  }
                >
                  {isSaving ? 'Saving…' : 'Save my selections'}
                </button>

                <Link className="auth-return-link" to="/dashboard">
                  Return to dashboard
                </Link>
              </div>
            </section>
          </form>
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

export default FunctionalNeedsPage
