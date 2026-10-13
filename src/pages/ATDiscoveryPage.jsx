import SaveResourceButton from '../components/SaveResourceButton.jsx'

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  getATCategories,
  getATProducts,
  getNeedCategoryMappings,
} from '../services/discoveryService.js'

function asArray(value) {
  if (Array.isArray(value)) return value

  // Also support APIs that wrap a list in a "content" or "data" property.
  if (Array.isArray(value?.content)) return value.content
  if (Array.isArray(value?.data)) return value.data

  return []
}

function getProductCategoryId(product) {
  return product.atCategoryId ?? product.categoryId ?? ''
}

function sameId(first, second) {
  if (first == null || second == null) return false
  return String(first) === String(second)
}

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

function getCategoryName(categoryId, categories) {
  const category = categories.find((item) =>
    sameId(item.id, categoryId),
  )

  return category?.name || 'Assistive technology'
}

function getCategoryMappings(categoryId, mappings) {
  return mappings.filter(
    (mapping) =>
      mapping.active !== false &&
      sameId(
        mapping.atCategoryId ?? mapping.categoryId,
        categoryId,
      ),
  )
}

function SourceInformation({ resource }) {
  return (
    <div className="discovery-source">
      <strong>Information source</strong>

      <p>
        {resource.sourceName || 'Source information not provided'}
      </p>

      {resource.sourceUrl && (
        <p>
          <a
            className="text-link"
            href={resource.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Visit source ↗
          </a>
        </p>
      )}

      <p>
        Verification status:{' '}
        {resource.verificationStatus || 'Not specified'}
      </p>

      <p>Last verified: {formatDate(resource.lastVerifiedAt)}</p>
    </div>
  )
}

function EmptyCatalogueState() {
  return (
    <section
      className="information-note"
      aria-labelledby="empty-catalogue-heading"
    >
      <h3 id="empty-catalogue-heading">
        Assistive technology catalogue is being prepared
      </h3>

      <p>
        No verified categories or products are currently available.
        CivicAid displays catalogue information only when it meets
        the required verification and freshness rules.
      </p>

      <p>
        You can still review and update your functional needs while
        the catalogue is being populated.
      </p>

      <Link to="/functional-needs" className="text-link">
        Update your functional needs →
      </Link>
    </section>
  )
}

function ATDiscoveryPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [mappings, setMappings] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDiscoveryData() {
      setIsLoading(true)
      setError('')

      try {
        const [categoryData, productData, mappingData] =
          await Promise.all([
            getATCategories(),
            getATProducts(),
            getNeedCategoryMappings(),
          ])

        if (cancelled) return

        setCategories(asArray(categoryData))
        setProducts(asArray(productData))
        setMappings(asArray(mappingData))
      } catch {
        if (!cancelled) {
          setError(
            'We could not load assistive technology information. Check that the backend is running and try again.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadDiscoveryData()

    return () => {
      cancelled = true
    }
  }, [])

  const visibleCategories = useMemo(
    () =>
      categories
        .filter((category) => category.active !== false)
        .sort(
          (first, second) =>
            (first.displayOrder ?? 0) -
            (second.displayOrder ?? 0),
        ),
    [categories],
  )

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return products
      .filter((product) => product.active !== false)
      .filter(
        (product) =>
          selectedCategory === 'all' ||
          sameId(getProductCategoryId(product), selectedCategory),
      )
      .filter((product) => {
        if (!query) return true

        const category = visibleCategories.find((item) =>
          sameId(item.id, getProductCategoryId(product)),
        )

        const searchableValues = [
          product.name,
          product.code,
          product.description,
          product.considerations,
          product.sourceName,
          category?.name,
        ]

        return searchableValues
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(query),
          )
      })
      .sort(
        (first, second) =>
          (first.displayOrder ?? 0) -
          (second.displayOrder ?? 0),
      )
  }, [products, visibleCategories, search, selectedCategory])

  const hasCatalogueData =
    visibleCategories.length > 0 ||
    products.some((product) => product.active !== false)

  function clearFilters() {
    setSearch('')
    setSelectedCategory('all')
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

        <nav className="primary-nav" aria-label="Account navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/functional-needs">My functional needs</Link>
        </nav>
      </header>

      <main id="main-content" className="resources-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PHASE 6 · AT DISCOVERY</p>

            <h1>Explore assistive technology</h1>

            <p>
              Explore available categories and products. Review their
              descriptions, considerations, sources, and verification
              dates to help you make informed decisions.
            </p>

            <p>
              <Link
                to="/functional-needs"
                className="text-link"
              >
                Update your functional needs →
              </Link>
            </p>
          </div>
        </div>

        {isLoading ? (
          <section className="information-note" aria-busy="true">
            <p role="status">
              Loading assistive technology information…
            </p>
          </section>
        ) : error ? (
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
          <>
            {!hasCatalogueData && <EmptyCatalogueState />}

            <section
              className="resources-section"
              aria-labelledby="categories-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">BROWSE BY AREA</p>

                  <h2 id="categories-heading">
                    Assistive technology categories
                  </h2>

                  <p>
                    Select a category to narrow the available products.
                  </p>
                </div>
              </div>

              {visibleCategories.length === 0 ? (
                <p role="status">
                  No public categories are currently available.
                </p>
              ) : (
                <div className="resource-grid">
                  {visibleCategories.map((category) => {
                    const isSelected = sameId(
                      selectedCategory,
                      category.id,
                    )

                    const relatedMappings = getCategoryMappings(
                      category.id,
                      mappings,
                    )

                    const categoryProductCount = products.filter(
                      (product) =>
                        product.active !== false &&
                        sameId(
                          getProductCategoryId(product),
                          category.id,
                        ),
                    ).length

                    return (
                      <article
                        className="resource-card"
                        key={category.id}
                      >
                        <span className="resource-number">
                          {category.code || 'AT'}
                        </span>

                        <h3>{category.name}</h3>
                        <SaveResourceButton resourceType="AT_CATEGORY" resourceId={category.id} />

                        <p>
                          {category.description ||
                            'Explore available assistive technology in this category.'}
                        </p>

                        <p className="discovery-category">
                          {categoryProductCount}{' '}
                          {categoryProductCount === 1
                            ? 'product'
                            : 'products'}{' '}
                          available
                        </p>

                        {relatedMappings.length > 0 && (
                          <div className="discovery-rationale">
                            <strong>
                              Why this category may be relevant
                            </strong>

                            <ul>
                              {relatedMappings.map((mapping) => (
                                <li key={mapping.id}>
                                  {mapping.functionalNeedLabel && (
                                    <strong>
                                      {mapping.functionalNeedLabel}
                                    </strong>
                                  )}

                                  {mapping.rationale && (
                                    <p>{mapping.rationale}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <SourceInformation resource={category} />

                        <button
                          type="button"
                          className={
                            isSelected
                              ? 'button button-primary'
                              : 'button button-outline'
                          }
                          onClick={() =>
                            setSelectedCategory(
                              isSelected ? 'all' : String(category.id),
                            )
                          }
                        >
                          {isSelected
                            ? 'Show all products'
                            : 'Explore this category'}
                        </button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section
              className="resources-section"
              aria-labelledby="products-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">DISCOVER OPTIONS</p>

                  <h2 id="products-heading">
                    Available assistive technology
                  </h2>

                  <p>
                    {visibleProducts.length} product
                    {visibleProducts.length === 1 ? '' : 's'} found.
                    Information shown here is for discovery, not a
                    medical recommendation.
                  </p>
                </div>
              </div>

              <div className="discovery-controls">
                <div className="discovery-control">
                  <label htmlFor="product-search">
                    Search products
                  </label>

                  <input
                    id="product-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by name, description, or category"
                  />
                </div>

                <div className="discovery-control">
                  <label htmlFor="category-filter">
                    Filter by category
                  </label>

                  <select
                    id="category-filter"
                    value={selectedCategory}
                    onChange={(event) =>
                      setSelectedCategory(event.target.value)
                    }
                  >
                    <option value="all">All categories</option>

                    {visibleCategories.map((category) => (
                      <option
                        key={category.id}
                        value={String(category.id)}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {visibleProducts.length === 0 ? (
                <section className="information-note">
                  <h3>
                    {hasCatalogueData
                      ? 'No matching products found'
                      : 'No verified catalogue products are available yet'}
                  </h3>

                  <p>
                    {hasCatalogueData
                      ? 'Try a different search term or select all categories.'
                      : 'Products will appear here after catalogue records have been added and pass CivicAid’s verification and freshness rules.'}
                  </p>

                  {(search || selectedCategory !== 'all') && (
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </button>
                  )}
                </section>
              ) : (
                <div className="resource-grid">
                  {visibleProducts.map((product) => (
                    <article
                      className="resource-card"
                      key={product.id}
                    >
                      <span className="resource-number">
                        {product.code || 'AT product'}
                      </span>

                      <h3>{product.name}</h3>

                      <p className="discovery-category">
                        {getCategoryName(
                          getProductCategoryId(product),
                          visibleCategories,
                        )}
                      </p>

                      <p>
                        {product.description ||
                          'No description is currently available.'}
                      </p>

                      {product.considerations && (
                        <div className="discovery-rationale">
                          <strong>Things to consider</strong>
                          <p>{product.considerations}</p>
                        </div>
                      )}

                      <SourceInformation resource={product} />

                      {product.id != null &&
                        String(product.id).trim() !== '' && (
                          <Link
                            className="button button-primary"
                            to={`/discover/products/${encodeURIComponent(
                              String(product.id),
                            )}`}
                            aria-label={`View details for ${
                              product.name ||
                              'this assistive technology product'
                            }`}
                          >
                            View product details{' '}
                            <span aria-hidden="true">→</span>
                          </Link>
                        )}
                    </article>
                  ))}
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

export default ATDiscoveryPage
