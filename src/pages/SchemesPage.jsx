
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { getPublicSchemes } from '../services/schemesService.js'

function formatDate(value) {
  if (!value) return 'Not recorded'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatEnum(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Not specified'
  }

  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function isHttpsUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false

  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

function SchemeSource({ scheme }) {
  return (
    <div className="discovery-source">
      <h4>Official source and verification</h4>
      <p>
        <strong>Authority: </strong>
        {scheme.authorityName || 'Not provided'}
      </p>
      <p>
        <strong>Verification status: </strong>
        {formatEnum(scheme.verificationStatus)}
      </p>
      <p>
        <strong>Last verified: </strong>
        {formatDate(scheme.lastVerifiedAt)}
      </p>

      {scheme.sourceVersion && (
        <p>
          <strong>Source version: </strong>
          {scheme.sourceVersion}
        </p>
      )}

      {isHttpsUrl(scheme.officialSourceUrl) && (
        <p>
          <a
            className="text-link"
            href={scheme.officialSourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit official source ↗
          </a>
        </p>
      )}
    </div>
  )
}

function SchemeCard({ scheme, stateCode }) {
  const detailHref = stateCode
    ? `/schemes/${encodeURIComponent(scheme.id)}?stateCode=${encodeURIComponent(stateCode)}`
    : `/schemes/${encodeURIComponent(scheme.id)}`

  return (
    <article
      className="resource-card"
      aria-labelledby={`scheme-${scheme.id}`}
    >
      <span className="resource-number">
        {scheme.code || 'Scheme'}
      </span>

      <h3 id={`scheme-${scheme.id}`}>{scheme.name}</h3>

      <p>
        {scheme.description || 'No description is currently available.'}
      </p>

      <div className="discovery-rationale">
        <h4>Potential benefits or support</h4>
        <p>
          {scheme.benefitsSummary || 'Benefits information is not provided.'}
        </p>
      </div>

      <div className="discovery-rationale">
        <h4>Eligibility summary</h4>
        <p>
          {scheme.eligibilitySummary ||
            'Eligibility information is not provided.'}
        </p>
      </div>

      <div className="discovery-rationale">
        <h4>Required documents</h4>
        <p>
          {scheme.requiredDocumentsSummary ||
            'Required document details are not provided. Check the official source before applying.'}
        </p>
      </div>

      <div className="discovery-rationale">
        <h4>How to apply</h4>
        <p>
          <strong>Method: </strong>
          {formatEnum(scheme.applicationMethod)}
        </p>
        <p>
          {scheme.applicationInstructions ||
            'Application instructions are not provided. Check the official source.'}
        </p>

        {isHttpsUrl(scheme.officialApplicationUrl) && (
          <p>
            <a
              className="text-link"
              href={scheme.officialApplicationUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit official application page ↗
            </a>
          </p>
        )}
      </div>

      <div className="discovery-rationale">
        <h4>Coverage and dates</h4>
        <p>
          <strong>Jurisdiction: </strong>
          {formatEnum(scheme.jurisdictionLevel)}
        </p>

        {scheme.applicableStateCode && (
          <p>
            <strong>Applicable state/UT code: </strong>
            {scheme.applicableStateCode}
          </p>
        )}

        <p>
          <strong>Effective from: </strong>
          {formatDate(scheme.effectiveFrom)}
        </p>
        <p>
          <strong>Effective to: </strong>
          {formatDate(scheme.effectiveTo)}
        </p>
      </div>

      <SchemeSource scheme={scheme} />

      <p className="auth-help-text">
        Information is provided for discovery only. Inclusion does not confirm
        personal eligibility, funding availability, or approval.
      </p>

      <div className="auth-links">
        <Link className="button button-primary" to={detailHref}>
          View scheme details
        </Link>
      </div>
    </article>
  )
}

function SchemesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const urlStateCode =
    searchParams.get('stateCode')?.trim().toUpperCase() || ''

  const isValidUrlStateCode =
    !urlStateCode || /^[A-Z]{2}$/.test(urlStateCode)

  const appliedStateCode = isValidUrlStateCode ? urlStateCode : ''

  const urlFilterError = !isValidUrlStateCode
    ? 'The state/UT code in the address is invalid. Enter a valid two-letter code or show national schemes.'
    : ''

  const [schemes, setSchemes] = useState([])
  const [search, setSearch] = useState('')
  const [stateCodeInput, setStateCodeInput] = useState(urlStateCode)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterError, setFilterError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadSchemes() {
      setIsLoading(true)
      setError('')

      if (!isValidUrlStateCode) {
        setSchemes([])
        setIsLoading(false)
        return
      }

      try {
        const data = await getPublicSchemes(
          appliedStateCode ? { stateCode: appliedStateCode } : {},
        )

        if (!cancelled) {
          setSchemes(data)
        }
      } catch (loadError) {
        if (!cancelled) {
          setSchemes([])
          setError(
            loadError?.response?.status === 400
              ? 'The state/UT code was not accepted. Enter a valid two-letter code and try again.'
              : 'We could not load scheme information. Check that the backend is running and try again.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadSchemes()

    return () => {
      cancelled = true
    }
  }, [appliedStateCode, isValidUrlStateCode, retryCount])

  const visibleSchemes = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return schemes

    return schemes.filter((scheme) =>
      [
        scheme.code,
        scheme.name,
        scheme.authorityName,
        scheme.description,
        scheme.benefitsSummary,
        scheme.eligibilitySummary,
        scheme.requiredDocumentsSummary,
        scheme.applicationInstructions,
        scheme.jurisdictionLevel,
        scheme.applicableStateCode,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    )
  }, [schemes, search])

  function handleStateFilterSubmit(event) {
    event.preventDefault()
    setFilterError('')

    const normalizedCode = stateCodeInput.trim().toUpperCase()

    if (normalizedCode && !/^[A-Z]{2}$/.test(normalizedCode)) {
      setFilterError(
        'Enter a two-letter state/UT code, such as TS for Telangana, or leave it blank for national schemes.',
      )
      return
    }

    setSearchParams(
      normalizedCode ? { stateCode: normalizedCode } : {},
    )
  }

  function clearStateFilter() {
    setStateCodeInput('')
    setFilterError('')
    setSearchParams({})
  }

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

        <nav className="primary-nav" aria-label="Public navigation">
          <Link to="/">Home</Link>
          <Link to="/discover">Explore AT</Link>
          <Link to="/login">Sign in</Link>
        </nav>
      </header>

      <main id="main-content" className="resources-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PHASE 7 · SCHEMES &amp; FUNDING</p>
            <h1>Explore schemes and support</h1>
            <p>
              Review published support programmes, potential benefits,
              eligibility summaries, required documents, application
              instructions, and official sources.
            </p>
            <p>
              CivicAid does not determine eligibility or guarantee funding.
              Always check the official source for current conditions and
              application requirements.
            </p>
          </div>
        </div>

        <section
          className="information-note"
          aria-labelledby="verification-note-heading"
        >
          <span className="note-icon" aria-hidden="true">i</span>
          <div>
            <h2 id="verification-note-heading">
              About scheme verification
            </h2>
            <p>
              Only schemes that the backend considers active, currently
              effective, verified, and within the required 90-day verification
              freshness window are returned for public discovery. If a scheme
              is not listed, it may not currently meet those rules.
            </p>
          </div>
        </section>

        <section
          className="resources-section"
          aria-labelledby="state-filter-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">NARROW YOUR SEARCH</p>
              <h2 id="state-filter-heading">Find support by state or UT</h2>
              <p>
                Leave the code blank to browse national schemes. Enter a
                two-letter state/UT code to include national and applicable
                state schemes.
              </p>
            </div>
          </div>

          <form
            className="discovery-controls"
            onSubmit={handleStateFilterSubmit}
          >
            <div className="discovery-control">
              <label htmlFor="scheme-state-code">State/UT code</label>
              <input
                id="scheme-state-code"
                name="stateCode"
                type="text"
                value={stateCodeInput}
                onChange={(event) => setStateCodeInput(event.target.value)}
                placeholder="e.g. TS"
                maxLength={2}
                autoCapitalize="characters"
                autoComplete="off"
                aria-describedby="scheme-state-help"
              />
              <p id="scheme-state-help" className="auth-help-text">
                Use the two-letter state/UT code configured in CivicAid.
              </p>
            </div>

            <div className="auth-links">
              <button className="button button-primary" type="submit">
                Apply state filter
              </button>
              <button
                className="button button-outline"
                type="button"
                onClick={clearStateFilter}
              >
                Show national schemes
              </button>
            </div>
          </form>

          {(filterError || urlFilterError) && (
            <p className="auth-notice" role="alert">
              {filterError || urlFilterError}
            </p>
          )}
        </section>

        <section
          className="resources-section"
          aria-labelledby="scheme-list-heading"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">PUBLICLY AVAILABLE PROGRAMMES</p>
              <h2 id="scheme-list-heading">Schemes and support options</h2>
              <p>
                {visibleSchemes.length} scheme
                {visibleSchemes.length === 1 ? '' : 's'} shown
                {appliedStateCode
                  ? ` for ${appliedStateCode}`
                  : ' from the national catalogue'}
                .
              </p>
            </div>
          </div>

          <div className="discovery-control">
            <label htmlFor="scheme-search">Search schemes</label>
            <input
              id="scheme-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by scheme, authority, benefit, or eligibility"
            />
          </div>

          {isLoading ? (
            <section className="information-note" aria-busy="true">
              <p role="status">Loading public scheme information…</p>
            </section>
          ) : error ? (
            <section className="information-note" role="alert">
              <h3>Scheme information unavailable</h3>
              <p>{error}</p>
              <button
                className="button button-primary"
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
              >
                Try again
              </button>
            </section>
          ) : visibleSchemes.length === 0 ? (
            <section className="information-note" role="status">
              <h3>
                {schemes.length > 0
                  ? 'No matching schemes found'
                  : 'No verified public schemes are available right now'}
              </h3>
              <p>
                {schemes.length > 0
                  ? 'Try a different search term.'
                  : 'The catalogue may not yet contain schemes that meet the public verification, freshness, and effective-date requirements. This does not prove that no support programmes exist. Check the relevant official authority for current information.'}
              </p>

              {search && (
                <button
                  className="button button-outline"
                  type="button"
                  onClick={() => setSearch('')}
                >
                  Clear search
                </button>
              )}
            </section>
          ) : (
            <div className="resource-grid">
              {visibleSchemes.map((scheme) => (
                <SchemeCard
                  key={scheme.id}
                  scheme={scheme}
                  stateCode={appliedStateCode}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <Link className="footer-brand" to="/">CivicAid</Link>
        <p>Making assistive technology information easier to explore.</p>
        <span>Built around accessibility, clarity and informed choice.</span>
      </footer>
    </div>
  )
}

export default SchemesPage
