
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  getATCategories,
  getATProducts,
  getNeedCategoryMappings,
} from '../services/discoveryService.js'
import {
  getAvailableNeeds,
  getMyFunctionalNeeds,
  saveMyFunctionalNeeds,
} from '../services/functionalNeedsService.js'

const questionnaireSteps = [
  {
    id: 'MOBILITY',
    label: 'Mobility',
    description:
      'Choose areas related to moving around, maintaining balance, and using your arms or hands.',
  },
  {
    id: 'VISION',
    label: 'Vision',
    description:
      'Choose areas related to reading, seeing details, recognising objects, or using visual information.',
  },
  {
    id: 'HEARING',
    label: 'Hearing',
    description:
      'Choose areas related to spoken information, environmental sounds, or audio.',
  },
  {
    id: 'COMMUNICATION',
    label: 'Communication',
    description:
      'Choose areas related to expressing yourself or understanding communication.',
  },
  {
    id: 'DAILY_ACTIVITIES',
    label: 'Daily Activities',
    description:
      'Choose any other areas related to everyday activities, learning, self-care, accessing places, or digital devices.',
  },
]

const directStepCodes = new Set([
  'MOBILITY',
  'VISION',
  'HEARING',
  'COMMUNICATION',
])

function asArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.content)) return value.content
  if (Array.isArray(value?.data)) return value.data
  return []
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

function formatStatus(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return 'Not specified'
  }

  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function SourceInformation({ resource }) {
  return (
    <div className="discovery-source">
      <strong>Information source</strong>
      <p>{resource.sourceName || 'Source information not provided'}</p>

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

      <p>Verification status: {formatStatus(resource.verificationStatus)}</p>
      <p>Last verified: {formatDate(resource.lastVerifiedAt)}</p>
    </div>
  )
}

function getNeedStepId(need, parentNeeds) {
  const parent = parentNeeds.find((item) =>
    sameId(item.id, need.parentNeedId),
  )

  if (parent && directStepCodes.has(parent.code)) {
    return parent.code
  }

  // GET /api/needs returns selectable child needs, not their parent rows.
  // Use each seeded need's stable code prefix when the parent is not present.
  const code = typeof need.code === 'string' ? need.code.toUpperCase() : ''

  for (const stepCode of directStepCodes) {
    if (code === stepCode || code.startsWith(`${stepCode}_`)) {
      return stepCode
    }
  }

  // Cognition, self-care, environmental access, and digital access
  // are intentionally grouped under Daily Activities.
  return 'DAILY_ACTIVITIES'
}

function FunctionalNeedsPage() {
  const [needs, setNeeds] = useState([])
  const [selectedCodes, setSelectedCodes] = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [isLoadingNeeds, setIsLoadingNeeds] = useState(true)
  const [isLoadingResults, setIsLoadingResults] = useState(false)
  const [error, setError] = useState('')
  const [discoveryError, setDiscoveryError] = useState('')
  const [discoveryLoadStatus, setDiscoveryLoadStatus] = useState({
    categories: false,
    products: false,
    mappings: false,
  })
  const [discoveryData, setDiscoveryData] = useState({
    categories: [],
    products: [],
    mappings: [],
  })

  useEffect(() => {
    let cancelled = false

    async function loadNeeds() {
      setIsLoadingNeeds(true)
      setError('')

      try {
        const availableNeeds = await getAvailableNeeds()
        let savedNeeds = []

        try {
          savedNeeds = await getMyFunctionalNeeds()
        } catch {
          // Keep the available options usable if saved selections cannot load.
        }

        if (cancelled) return

        setNeeds(availableNeeds)
        setSelectedCodes(
          savedNeeds
            .map((need) => (typeof need === 'string' ? need : need.code))
            .filter(Boolean),
        )
      } catch {
        if (!cancelled) {
          setError(
            'We could not load functional needs. Check your connection and try again.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingNeeds(false)
        }
      }
    }

    loadNeeds()

    return () => {
      cancelled = true
    }
  }, [])

  const parentNeeds = useMemo(
    () => needs.filter((need) => !need.parentNeedId),
    [needs],
  )

  const selectableNeeds = useMemo(
    () =>
      needs
        .filter((need) => need.selectable !== false && need.parentNeedId)
        .sort(
          (first, second) =>
            (first.displayOrder ?? 0) - (second.displayOrder ?? 0),
        ),
    [needs],
  )

  const currentStep = questionnaireSteps[currentStepIndex]

  const currentStepNeeds = useMemo(
    () =>
      selectableNeeds.filter(
        (need) => getNeedStepId(need, parentNeeds) === currentStep?.id,
      ),
    [selectableNeeds, parentNeeds, currentStep],
  )

  const selectedNeedRecords = useMemo(
    () => selectableNeeds.filter((need) => selectedCodes.includes(need.code)),
    [selectableNeeds, selectedCodes],
  )

  const matchingMappings = useMemo(() => {
    const selectedIds = new Set(
      selectedNeedRecords.map((need) => String(need.id)),
    )

    return discoveryData.mappings.filter(
      (mapping) =>
        mapping.active !== false &&
        selectedIds.has(String(mapping.functionalNeedId)),
    )
  }, [discoveryData.mappings, selectedNeedRecords])

  const matchingCategories = useMemo(() => {
    const mappedCategoryIds = new Set(
      matchingMappings.map((mapping) => String(mapping.atCategoryId)),
    )

    return discoveryData.categories
      .filter(
        (category) =>
          category.active !== false && mappedCategoryIds.has(String(category.id)),
      )
      .sort(
        (first, second) =>
          (first.displayOrder ?? 0) - (second.displayOrder ?? 0),
      )
  }, [discoveryData.categories, matchingMappings])

  function toggleNeed(code) {
    setSelectedCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    )
    setError('')
  }

  function handlePrevious() {
    setError('')
    setCurrentStepIndex((index) => Math.max(0, index - 1))
  }

  function handleNext() {
    setError('')

    if (currentStepIndex < questionnaireSteps.length - 1) {
      setCurrentStepIndex((index) => index + 1)
      return
    }

    void handleShowResults()
  }

  async function handleShowResults() {
    setError('')
    setDiscoveryError('')

    if (selectedCodes.length === 0) {
      setError('Please select at least one functional area before viewing results.')
      return
    }

    setIsLoadingResults(true)

    try {
      const savedNeeds = await saveMyFunctionalNeeds(selectedCodes)
      const savedCodes = savedNeeds
        .map((need) => (typeof need === 'string' ? need : need.code))
        .filter(Boolean)

      if (savedCodes.length > 0) {
        setSelectedCodes(savedCodes)
      }
    } catch (saveError) {
      setError(
        saveError?.response?.data?.message ||
          'We could not save your selections. Please try again.',
      )
      setIsLoadingResults(false)
      return
    }

    const [categoriesResult, productsResult, mappingsResult] =
      await Promise.allSettled([
        getATCategories(),
        getATProducts(),
        getNeedCategoryMappings(),
      ])

    const categoriesSucceeded = categoriesResult.status === 'fulfilled'
    const productsSucceeded = productsResult.status === 'fulfilled'
    const mappingsSucceeded = mappingsResult.status === 'fulfilled'

    setDiscoveryLoadStatus({
      categories: categoriesSucceeded,
      products: productsSucceeded,
      mappings: mappingsSucceeded,
    })

    setDiscoveryData({
      categories: categoriesSucceeded
        ? asArray(categoriesResult.value)
        : [],
      products: productsSucceeded ? asArray(productsResult.value) : [],
      mappings: mappingsSucceeded ? asArray(mappingsResult.value) : [],
    })

    if (!categoriesSucceeded || !productsSucceeded || !mappingsSucceeded) {
      setDiscoveryError(
        'Some discovery information could not be loaded. Results below may be incomplete; you can also browse the public catalogue directly.',
      )
    }

    setShowResults(true)
    setIsLoadingResults(false)
  }

  function handleReviewAnswers() {
    setShowResults(false)
    setCurrentStepIndex(0)
    setError('')
  }

  const categoriesWithProducts = matchingCategories.map((category) => ({
    ...category,
    relatedMappings: matchingMappings.filter((mapping) =>
      sameId(mapping.atCategoryId, category.id),
    ),
    products: discoveryData.products
      .filter((product) => product.active !== false)
      .filter((product) => sameId(product.categoryId, category.id))
      .sort(
        (first, second) =>
          (first.displayOrder ?? 0) - (second.displayOrder ?? 0),
      ),
  }))

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
          <Link to="/discover">Explore AT</Link>
          <Link to="/profile">My profile</Link>
        </nav>
      </header>

      <main id="main-content" className="resources-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR CIVICAID JOURNEY</p>
            <h1>
              {showResults
                ? 'Your discovery results'
                : 'Tell us what support you are looking for'}
            </h1>
            <p>
              Select functional areas where you would like to explore assistive
              technology. You do not need a medical diagnosis to use this
              questionnaire. Your answers are not a diagnosis or prescription.
            </p>
          </div>
        </div>

        {isLoadingNeeds ? (
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
        ) : showResults ? (
          <>
            <section
              className="information-note"
              aria-labelledby="selected-needs-heading"
            >
              <span className="note-icon" aria-hidden="true">
                i
              </span>
              <div>
                <h2 id="selected-needs-heading">Your selected functional areas</h2>
                <p>
                  {selectedNeedRecords.length > 0
                    ? selectedNeedRecords.map((need) => need.label).join(', ')
                    : 'No functional needs are selected.'}
                </p>
                <p>
                  Categories below are shown only when available public mappings
                  and catalogue records support them. These results are for
                  discovery, not a medical recommendation.
                </p>
              </div>
            </section>

            {discoveryError && (
              <section className="information-note" role="status">
                <p>{discoveryError}</p>
                <Link className="text-link" to="/discover">
                  Browse the public AT catalogue →
                </Link>
              </section>
            )}

            {categoriesWithProducts.length === 0 ? (
              <section
                className="information-note"
                aria-labelledby="no-results-heading"
              >
                <h2 id="no-results-heading">
                  {discoveryError
                    ? 'Discovery results could not be fully loaded'
                    : 'No verified mapped categories are available yet'}
                </h2>
                <p>
                  {discoveryError
                    ? 'CivicAid could not load all the catalogue or mapping information needed to build your results. Try browsing the public catalogue or try again later.'
                    : 'CivicAid could not find public, currently verified categories mapped to your selected functional areas. This does not mean that assistive technology cannot help; the catalogue or its reviewed mappings may not be populated yet.'}
                </p>
                <p>
                  You can still browse the public catalogue, or review your answers.
                </p>
                <div className="auth-links">
                  <Link className="button button-primary" to="/discover">
                    Browse AT catalogue
                  </Link>
                  <button
                    className="button button-outline"
                    type="button"
                    onClick={handleReviewAnswers}
                  >
                    Review answers
                  </button>
                </div>
              </section>
            ) : (
              <section
                className="resources-section"
                aria-labelledby="matched-categories-heading"
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">BASED ON AVAILABLE MAPPINGS</p>
                    <h2 id="matched-categories-heading">Categories to explore</h2>
                    <p>
                      Each explanation below comes from CivicAid's published
                      need-to-category mapping. It does not rank devices or
                      establish suitability.
                    </p>
                  </div>
                </div>

                <div className="resource-grid">
                  {categoriesWithProducts.map((category) => (
                    <article className="resource-card" key={category.id}>
                      <span className="resource-number">
                        {category.code || 'AT'}
                      </span>
                      <h3>{category.name}</h3>
                      <p>
                        {category.description ||
                          'Category description not provided.'}
                      </p>

                      <div className="discovery-rationale">
                        <strong>Why this category appears</strong>
                        <ul>
                          {category.relatedMappings.map((mapping) => (
                            <li key={mapping.id}>
                              {mapping.functionalNeedLabel && (
                                <strong>
                                  {mapping.functionalNeedLabel}:{' '}
                                </strong>
                              )}
                              {mapping.rationale}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <SourceInformation resource={category} />

                      <h4>Available products</h4>
                      {category.products.length === 0 ? (
                        <p>
                          {discoveryLoadStatus.products
                            ? 'No verified public products are currently available in this category.'
                            : 'Product information could not be loaded for this category. Please try browsing the public catalogue again later.'}
                        </p>
                      ) : (
                        <div className="resource-grid">
                          {category.products.map((product) => (
                            <article className="resource-card" key={product.id}>
                              <h4>{product.name}</h4>
                              <p>{product.description}</p>
                              {product.considerations && (
                                <p>
                                  <strong>Considerations: </strong>
                                  {product.considerations}
                                </p>
                              )}
                              <SourceInformation resource={product} />
                            </article>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className="auth-links">
              <button
                className="button button-primary"
                type="button"
                onClick={handleReviewAnswers}
              >
                Review or change answers
              </button>
              <Link className="button button-outline" to="/dashboard">
                Return to dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <section
              className="resources-section"
              aria-labelledby="questionnaire-progress-heading"
            >
              <div className="section-heading">
                <div>
                  <p className="eyebrow">
                    STEP {currentStepIndex + 1} OF {questionnaireSteps.length}
                  </p>
                  <h2 id="questionnaire-progress-heading">{currentStep.label}</h2>
                  <p>{currentStep.description}</p>
                  <p>Selected across all steps: {selectedCodes.length}</p>
                </div>
              </div>

              <progress
                value={currentStepIndex + 1}
                max={questionnaireSteps.length}
                aria-label={`Questionnaire progress: step ${
                  currentStepIndex + 1
                } of ${questionnaireSteps.length}`}
              />

              {currentStepNeeds.length === 0 ? (
                <section className="information-note" role="status">
                  <p>
                    There are no selectable functional needs in this step at
                    the moment. Continue to the next step.
                  </p>
                </section>
              ) : (
                <div className="resource-grid">
                  {currentStepNeeds.map((need) => {
                    const checked = selectedCodes.includes(need.code)
                    const inputId = `need-${need.code}`

                    return (
                      <label
                        className="resource-card functional-need-card"
                        htmlFor={inputId}
                        key={need.code}
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleNeed(need.code)}
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

              <div className="auth-links">
                <button
                  className="button button-outline"
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0 || isLoadingResults}
                >
                  Previous
                </button>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={handleNext}
                  disabled={isLoadingResults}
                >
                  {isLoadingResults
                    ? 'Saving answers and loading results…'
                    : currentStepIndex === questionnaireSteps.length - 1
                      ? 'Save answers and view results'
                      : 'Next step'}
                </button>
              </div>
            </section>

            <section className="information-note">
              <span className="note-icon" aria-hidden="true">
                i
              </span>
              <div>
                <h2>Your answers stay focused on support needs</h2>
                <p>
                  CivicAid uses the functional areas you select to look for
                  reviewed category mappings. The questionnaire does not
                  diagnose conditions or decide which product is right for you.
                </p>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <Link className="footer-brand" to="/">
          CivicAid
        </Link>
        <p>Making assistive technology information easier to explore.</p>
        <span>Built around accessibility, clarity and informed choice.</span>
      </footer>
    </div>
  )
}

export default FunctionalNeedsPage
