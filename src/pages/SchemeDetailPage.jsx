import SaveResourceButton from '../components/SaveResourceButton.jsx'

import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import {
  getPublicSchemeById,
  getPublicSchemeCategories,
  getPublicSchemeProducts,
} from '../services/schemesService.js'

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

      <nav className="primary-nav" aria-label="Public navigation">
        <Link to="/">Home</Link>
        <Link to="/discover">Explore AT</Link>
        <Link to="/schemes">Schemes &amp; Support</Link>
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

function SchemeDetailPage() {
  const { schemeId } = useParams()
  const [searchParams] = useSearchParams()
  const stateCode =
    searchParams.get('stateCode')?.trim().toUpperCase() || ''

  const [scheme, setScheme] = useState(null)
  const [schemeCategories, setSchemeCategories] = useState([])
  const [schemeProducts, setSchemeProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadScheme() {
      setIsLoading(true)
      setError('')
      setScheme(null)
      setSchemeCategories([])
      setSchemeProducts([])

      if (!schemeId || !schemeId.trim()) {
        setError('A scheme identifier was not provided in this address.')
        setIsLoading(false)
        return
      }

      try {
        const data = await getPublicSchemeById(
          schemeId,
          stateCode ? { stateCode } : {},
        )

        if (!cancelled) {
          setScheme(data)
        }

        // Load categories and products in parallel — failures are non-fatal
        const opts = stateCode ? { stateCode } : {}
        const [cats, prods] = await Promise.allSettled([
          getPublicSchemeCategories(schemeId, opts),
          getPublicSchemeProducts(schemeId, opts),
        ])
        if (!cancelled) {
          if (cats.status === 'fulfilled') setSchemeCategories(cats.value)
          if (prods.status === 'fulfilled') setSchemeProducts(prods.value)
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError?.response?.status === 404) {
            setError(
              stateCode
                ? 'This scheme is not currently available for public discovery with the selected state/UT. It may be inactive, outside its effective dates, outside the verification freshness window, or not applicable to this state/UT.'
                : 'This scheme is not currently available for public discovery. State-specific schemes require the applicable state/UT code; a scheme may also be inactive, outside its effective dates, or outside the verification freshness window.',
            )
          } else if (loadError?.response?.status === 400) {
            setError(
              'The state/UT code was not accepted. Return to the scheme list and check the code.',
            )
          } else {
            setError(
              'We could not load this scheme. Check your connection and try again.',
            )
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadScheme()

    return () => {
      cancelled = true
    }
  }, [schemeId, stateCode, retryCount])

  const listHref = stateCode
    ? `/schemes?stateCode=${encodeURIComponent(stateCode)}`
    : '/schemes'

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <SiteHeader />

      <main id="main-content" className="resources-section">
        <p className="eyebrow">PHASE 7 · SCHEMES &amp; FUNDING</p>
        <h1>Scheme details</h1>
        <p>
          Review published support information, application instructions,
          and the official source. CivicAid cannot confirm personal eligibility
          or guarantee funding approval.
        </p>

        <p>
          <Link className="text-link" to={listHref}>
            ← Back to schemes and support
          </Link>
        </p>

        {isLoading ? (
          <section className="information-note" aria-busy="true">
            <p role="status">Loading scheme details…</p>
          </section>
        ) : error ? (
          <section className="information-note" role="alert">
            <span className="note-icon" aria-hidden="true">
              !
            </span>
            <div>
              <h2>Scheme details unavailable</h2>
              <p>{error}</p>
              <div className="auth-links">
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => setRetryCount((count) => count + 1)}
                >
                  Try again
                </button>
                <Link className="button button-outline" to={listHref}>
                  Browse schemes
                </Link>
              </div>
            </div>
          </section>
        ) : scheme ? (
          <>
            <section
              className="resources-section"
              aria-labelledby="scheme-name-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">SCHEME INFORMATION</p>
                  {scheme.code && (
                    <p className="resource-number">{scheme.code}</p>
                  )}
                  <h2 id="scheme-name-heading">{scheme.name}</h2>
                  <SaveResourceButton resourceType="SCHEME" resourceId={scheme.id} />
                  <p>
                    <strong>Responsible authority: </strong>
                    {scheme.authorityName || 'Not provided'}
                  </p>
                </div>
              </div>
              <article className="resource-card">
                <h3>Overview</h3>
                <p>
                  {scheme.description ||
                    'No description is currently available.'}
                </p>
              </article>
            </section>

            <section
              className="resources-section"
              aria-labelledby="benefits-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">POTENTIAL SUPPORT</p>
                  <h2 id="benefits-heading">Benefits and support</h2>
                </div>
              </div>
              <article className="resource-card">
                <p>
                  {scheme.benefitsSummary ||
                    'Benefits information is not provided.'}
                </p>
              </article>
            </section>

            <section
              className="resources-section"
              aria-labelledby="eligibility-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">BEFORE APPLYING</p>
                  <h2 id="eligibility-heading">Eligibility summary</h2>
                </div>
              </div>
              <article className="resource-card">
                <p>
                  {scheme.eligibilitySummary ||
                    'Eligibility information is not provided. Check the official source before applying.'}
                </p>
              </article>
            </section>

            <section
              className="resources-section"
              aria-labelledby="documents-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">APPLICATION PREPARATION</p>
                  <h2 id="documents-heading">Required documents</h2>
                </div>
              </div>
              <article className="resource-card">
                <p>
                  {scheme.requiredDocumentsSummary ||
                    'Required documents are not specified. Confirm the current list with the responsible authority.'}
                </p>
              </article>
            </section>

            {schemeCategories.length > 0 && (
              <section
                className="resources-section"
                aria-labelledby="covered-categories-heading"
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">ASSISTIVE TECHNOLOGY</p>
                    <h2 id="covered-categories-heading">Covered technology categories</h2>
                  </div>
                </div>
                <div className="admin-record-list">
                  {schemeCategories.map((cat) => (
                    <article className="resource-card" key={cat.id}>
                      <span className="resource-number">{cat.categoryCode}</span>
                      <h3>{cat.categoryName}</h3>
                      {cat.categoryDescription && (
                        <p>{cat.categoryDescription}</p>
                      )}
                      <p>
                        <strong>Why it is covered: </strong>
                        {cat.rationale}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {schemeProducts.length > 0 && (
              <section
                className="resources-section"
                aria-labelledby="covered-products-heading"
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">ELIGIBLE AIDS &amp; APPLIANCES</p>
                    <h2 id="covered-products-heading">Covered assistive technology products</h2>
                  </div>
                </div>
                <div className="admin-record-list">
                  {schemeProducts.map((prod) => (
                    <article className="resource-card" key={prod.id}>
                      <span className="resource-number">{prod.productCode}</span>
                      <h3>{prod.productName}</h3>
                      {prod.productDescription && (
                        <p>{prod.productDescription}</p>
                      )}
                      <p>
                        <strong>Category: </strong>
                        {prod.categoryName}
                      </p>
                      <p>
                        <strong>Why it is covered: </strong>
                        {prod.rationale}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section
              className="resources-section"
              aria-labelledby="application-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">NEXT STEPS</p>
                  <h2 id="application-heading">How to apply</h2>
                </div>
              </div>
              <article className="resource-card">
                <p>
                  <strong>Application method: </strong>
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
              </article>
            </section>

            <section
              className="information-note"
              aria-labelledby="scheme-source-heading"
            >
              <span className="note-icon" aria-hidden="true">
                i
              </span>
              <div>
                <h2 id="scheme-source-heading">
                  Official source and verification
                </h2>
                <p>
                  <strong>Official authority: </strong>
                  {scheme.authorityName || 'Not provided'}
                </p>
                {isHttpsUrl(scheme.officialSourceUrl) ? (
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
                ) : (
                  <p>Official source URL is not provided.</p>
                )}
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
            </section>

            <section className="information-note">
              <span className="note-icon" aria-hidden="true">
                i
              </span>
              <div>
                <h2>Important eligibility notice</h2>
                <p>
                  Scheme information is provided for discovery only. The
                  responsible authority determines eligibility, document
                  acceptance, available funding, and final approval. Check the
                  official source for current rules before taking action.
                </p>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  )
}

export default SchemeDetailPage
