import SaveResourceButton from '../components/SaveResourceButton.jsx'

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  getATCategoryById,
  getATProductById,
  getNeedCategoryMappings,
} from '../services/discoveryService.js'

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

function formatStatus(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Not specified'
  }

  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function isHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return false

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
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

function ProductSource({ product }) {
  return (
    <section
      className="information-note"
      aria-labelledby="product-source-heading"
    >
      <span className="note-icon" aria-hidden="true">
        i
      </span>
      <div>
        <h2 id="product-source-heading">Source and verification</h2>
        <p>
          <strong>Source: </strong>
          {product.sourceName || 'Source information not provided'}
        </p>

        {isHttpUrl(product.sourceUrl) && (
          <p>
            <a
              className="text-link"
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit source website ↗
            </a>
          </p>
        )}

        <p>
          <strong>Verification status: </strong>
          {formatStatus(product.verificationStatus)}
        </p>
        <p>
          <strong>Last verified: </strong>
          {formatDate(product.lastVerifiedAt)}
        </p>
      </div>
    </section>
  )
}

function ATProductDetailPage() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [category, setCategory] = useState(null)
  const [categoryMappings, setCategoryMappings] = useState([])
  const [mappingsLoaded, setMappingsLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadProductDetails() {
      setIsLoading(true)
      setError('')
      setProduct(null)
      setCategory(null)
      setCategoryMappings([])
      setMappingsLoaded(false)

      if (!productId || !productId.trim()) {
        setError('A product identifier was not provided in this address.')
        setIsLoading(false)
        return
      }

      try {
        const productData = await getATProductById(productId)

        let categoryData = null

        if (productData.categoryId) {
          try {
            categoryData = await getATCategoryById(
              String(productData.categoryId),
            )
          } catch {
            // Product details can still be shown if category details fail.
          }
        }

        let mappingData = []
        let didLoadMappings = false

        try {
          mappingData = await getNeedCategoryMappings()
          didLoadMappings = true
        } catch {
          // Product details remain available if mappings cannot be loaded.
        }

        if (!cancelled) {
          setProduct(productData)
          setCategory(categoryData)
          setCategoryMappings(
            mappingData.filter(
              (mapping) =>
                mapping.active !== false &&
                String(mapping.atCategoryId) === String(productData.categoryId),
            ),
          )
          setMappingsLoaded(didLoadMappings)
        }
      } catch (loadError) {
        if (!cancelled) {
          if (loadError?.response?.status === 404) {
            setError(
              'This product is not currently available for public discovery. It may have been removed or may no longer meet the catalogue verification requirements.',
            )
          } else if (loadError?.response?.status === 401) {
            setError(
              'The public product information could not be accessed. Please return to the catalogue or try again.',
            )
          } else {
            setError(
              'We could not load this product. Check your connection and try again.',
            )
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadProductDetails()

    return () => {
      cancelled = true
    }
  }, [productId, retryCount])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <SiteHeader />

      <main id="main-content" className="resources-section">
        <p className="eyebrow">PHASE 6 · AT DISCOVERY</p>
        <h1>Assistive technology details</h1>
        <p>
          Review the published product description, considerations, and source
          information. CivicAid provides information for discovery; it does not
          determine personal suitability or replace professional assessment.
        </p>

        <p>
          <Link className="text-link" to="/discover">
            ← Back to assistive technology catalogue
          </Link>
        </p>

        {isLoading ? (
          <section className="information-note" aria-busy="true">
            <p role="status">Loading product details…</p>
          </section>
        ) : error ? (
          <section className="information-note" role="alert">
            <span className="note-icon" aria-hidden="true">
              !
            </span>
            <div>
              <h2>Product details unavailable</h2>
              <p>{error}</p>

              <div className="auth-links">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => setRetryCount((count) => count + 1)}
                >
                  Try again
                </button>

                <Link className="button button-outline" to="/discover">
                  Browse catalogue
                </Link>
              </div>
            </div>
          </section>
        ) : product ? (
          <>
            <section
              className="resources-section"
              aria-labelledby="product-name-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PRODUCT INFORMATION</p>
                  <h2 id="product-name-heading">{product.name}</h2>
                  <SaveResourceButton resourceType="AT_PRODUCT" resourceId={product.id} />

                  {product.code && (
                    <p>
                      <strong>Catalogue code: </strong>
                      {product.code}
                    </p>
                  )}

                  <p>
                    <strong>Category: </strong>
                    {category?.name || 'Category details unavailable'}
                  </p>
                </div>
              </div>

              <article className="resource-card">
                <h3>Description</h3>
                <p>
                  {product.description ||
                    'No product description has been provided in the catalogue record.'}
                </p>
              </article>
            </section>

            <section
              className="resources-section"
              aria-labelledby="functional-relevance-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">PUBLISHED CATEGORY MAPPINGS</p>
                  <h2 id="functional-relevance-heading">
                    Functional areas this category may support
                  </h2>
                  <p>
                    These are catalogue mappings, not a personalised
                    recommendation or a guarantee that this product is suitable
                    for you.
                  </p>
                </div>
              </div>

              {categoryMappings.length > 0 ? (
                <div className="resource-grid">
                  {categoryMappings.map((mapping) => (
                    <article className="resource-card" key={mapping.id}>
                      <h3>
                        {mapping.functionalNeedLabel || 'Functional area'}
                      </h3>
                      <p>
                        {mapping.rationale ||
                          'No additional rationale is recorded for this mapping.'}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <p role="status">
                  {mappingsLoaded
                    ? 'No currently published functional-area mappings are available for this category.'
                    : 'Functional-area mappings could not be loaded. The product information above is still available.'}
                </p>
              )}
            </section>

            <section
              className="resources-section"
              aria-labelledby="considerations-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">BEFORE YOU EXPLORE FURTHER</p>
                  <h2 id="considerations-heading">
                    Important considerations
                  </h2>
                  <p>
                    Considerations are shown as published in the catalogue.
                    They are not a personal suitability assessment.
                  </p>
                </div>
              </div>

              <article className="resource-card">
                <p>
                  {product.considerations ||
                    'No additional considerations are recorded for this product.'}
                </p>
              </article>
            </section>

            <ProductSource product={product} />

            <section className="information-note">
              <span className="note-icon" aria-hidden="true">
                i
              </span>
              <div>
                <h2>Use this information thoughtfully</h2>
                <p>
                  Product information does not guarantee that a device will
                  meet your needs. Suitability, funding eligibility, and
                  provision decisions should be discussed with the relevant
                  professionals and authorities.
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

export default ATProductDetailPage
