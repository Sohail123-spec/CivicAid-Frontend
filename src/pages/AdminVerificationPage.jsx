import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import api from '../services/api.js'

const outcomes = ['VERIFIED', 'REJECTED', 'REVOKED']
const pretty = (value) =>
  value
    ? String(value).replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Not recorded'

// ─── Verification Form ─────────────────────────────────────────────────────

function VerificationForm({ kind, resource, onVerified }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const result = String(form.get('result'))
    const reviewNotes = String(form.get('reviewNotes') || '').trim()
    const sourceName = String(form.get('sourceName') || '').trim()
    const sourceUrl = String(form.get('sourceUrl') || '').trim()
    const sourceVersion = String(form.get('sourceVersion') || '').trim()
    setError(''); setMessage('')
    if (result !== 'VERIFIED' && !reviewNotes) {
      setError('Review notes are required when rejecting or revoking a record.')
      return
    }
    if (sourceUrl && !/^https:\/\/\S+$/i.test(sourceUrl)) {
      setError('Source URL must start with https://.')
      return
    }
    setBusy(true)
    try {
      await api.post(`/admin/${kind}/${encodeURIComponent(resource.id)}/verifications`, {
        result, sourceName, sourceUrl: sourceUrl || null,
        sourceVersion: sourceVersion || null, reviewNotes: reviewNotes || null,
      })
      setMessage(`Verification outcome recorded: ${pretty(result)}.`)
      await onVerified()
    } catch (requestError) {
      const status = requestError?.response?.status
      setError(
        status === 403 ? 'Access denied. This workflow requires an administrator account.'
          : status === 401 ? 'Your session has expired. Sign in again.'
          : requestError?.response?.data?.message || 'The verification could not be recorded. Check the source details and try again.'
      )
    } finally { setBusy(false) }
  }

  return (
    <form className="stacked-form" onSubmit={submit}>
      <h4>Record source review</h4>
      <label className="auth-field">Outcome
        <select className="auth-input" name="result" defaultValue="VERIFIED" required>
          {outcomes.map((value) => <option value={value} key={value}>{pretty(value)}</option>)}
        </select>
      </label>
      <label className="auth-field">Source name
        <input className="auth-input" name="sourceName" maxLength="200" required placeholder="Official authority or reviewed source" />
      </label>
      <label className="auth-field">HTTPS source URL
        <input className="auth-input" name="sourceUrl" type="url" pattern="https://.*" maxLength="2048" placeholder="https://…" />
      </label>
      <label className="auth-field">Source version (optional)
        <input className="auth-input" name="sourceVersion" maxLength="100" />
      </label>
      <label className="auth-field">Review notes
        <textarea className="auth-input" name="reviewNotes" maxLength="1000" rows="3" placeholder="What was checked? Required for reject/revoke." />
      </label>
      {error && <p role="alert" className="form-error">{error}</p>}
      {message && <p role="status" className="success-message">{message}</p>}
      <button className="button button-primary" type="submit" disabled={busy}>
        {busy ? 'Recording…' : 'Record verification outcome'}
      </button>
    </form>
  )
}

// ─── Create Provider Form ──────────────────────────────────────────────────

const providerTypes = [
  'NGO', 'REHABILITATION_CENTRE', 'AT_SUPPLIER_VENDOR', 'HOSPITAL_INSTITUTION', 'REPAIR_SERVICE_PROVIDER'
]

function CreateProviderForm({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      code: String(form.get('code') || '').trim().toUpperCase(),
      name: String(form.get('name') || '').trim(),
      providerType: String(form.get('providerType') || ''),
      description: String(form.get('description') || '').trim(),
      websiteUrl: String(form.get('websiteUrl') || '').trim() || null,
      sourceName: String(form.get('sourceName') || '').trim(),
      sourceUrl: String(form.get('sourceUrl') || '').trim() || null,
    }
    setError(''); setMessage('')
    if (!payload.code || !payload.name || !payload.providerType || !payload.description || !payload.sourceName) {
      setError('Code, name, type, description and source name are required.')
      return
    }
    if (!/^[A-Z][A-Z0-9_]*$/.test(payload.code)) {
      setError('Code must start with a letter and contain only uppercase letters, digits and underscores.')
      return
    }
    setBusy(true)
    try {
      await api.post('/admin/providers', payload)
      setMessage(`Provider "${payload.name}" created. Reload to see it in the list.`)
      event.target.reset()
      await onCreated()
    } catch (requestError) {
      const status = requestError?.response?.status
      setError(
        status === 409 ? 'A provider with that code or name already exists.'
          : status === 403 ? 'Access denied.'
          : requestError?.response?.data?.message || 'Could not create provider. Check the details and try again.'
      )
    } finally { setBusy(false) }
  }

  return (
    <div className="resource-card" style={{ marginTop: '1rem' }}>
      <button className="button button-outline" type="button" onClick={() => setOpen((v) => !v)}>
        {open ? '▲ Hide create provider form' : '▼ Create new provider'}
      </button>
      {open && (
        <form className="stacked-form" onSubmit={submit} style={{ marginTop: '1rem' }}>
          <h4>Create provider</h4>
          <label className="auth-field">Code (e.g. ALIMCO)
            <input className="auth-input" name="code" maxLength="64" required placeholder="UPPERCASE_CODE" />
          </label>
          <label className="auth-field">Name
            <input className="auth-input" name="name" maxLength="200" required placeholder="Full official name" />
          </label>
          <label className="auth-field">Type
            <select className="auth-input" name="providerType" required>
              {providerTypes.map((t) => <option value={t} key={t}>{pretty(t)}</option>)}
            </select>
          </label>
          <label className="auth-field">Description
            <textarea className="auth-input" name="description" rows="3" required placeholder="Official description of the provider" />
          </label>
          <label className="auth-field">Website URL (https://)
            <input className="auth-input" name="websiteUrl" type="url" pattern="https://.*" maxLength="2048" placeholder="https://…" />
          </label>
          <label className="auth-field">Source name
            <input className="auth-input" name="sourceName" maxLength="200" required placeholder="Authority or reference source" />
          </label>
          <label className="auth-field">Source URL (https://)
            <input className="auth-input" name="sourceUrl" type="url" pattern="https://.*" maxLength="2048" placeholder="https://…" />
          </label>
          {error && <p role="alert" className="form-error">{error}</p>}
          {message && <p role="status" className="success-message">{message}</p>}
          <button className="button button-primary" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create provider'}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Create Provider Location Form ────────────────────────────────────────

function CreateProviderLocationForm({ providers, onCreated }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const providerId = String(form.get('providerId') || '').trim()
    const payload = {
      addressLine1: String(form.get('addressLine1') || '').trim(),
      addressLine2: String(form.get('addressLine2') || '').trim() || null,
      locality: String(form.get('locality') || '').trim(),
      city: String(form.get('city') || '').trim(),
      stateCode: String(form.get('stateCode') || '').trim().toUpperCase(),
      postalCode: String(form.get('postalCode') || '').trim() || null,
      publicPhone: String(form.get('publicPhone') || '').trim() || null,
      publicEmail: String(form.get('publicEmail') || '').trim() || null,
      sourceName: String(form.get('sourceName') || '').trim(),
      sourceUrl: String(form.get('sourceUrl') || '').trim() || null,
      accessibilityNotes: String(form.get('accessibilityNotes') || '').trim() || null,
    }
    setError(''); setMessage('')
    if (!providerId) { setError('Select a provider.'); return }
    if (!payload.addressLine1 || !payload.locality || !payload.city || !payload.stateCode || !payload.sourceName) {
      setError('Address line 1, locality, city, state code and source name are required.')
      return
    }
    if (!payload.publicPhone && !payload.publicEmail) {
      setError('At least one contact method (phone or email) is required.')
      return
    }
    if (!/^[A-Z]{2}$/.test(payload.stateCode)) {
      setError('State code must be exactly two uppercase letters (e.g. UP, MH).')
      return
    }
    setBusy(true)
    try {
      await api.post(`/admin/providers/${encodeURIComponent(providerId)}/locations`, payload)
      setMessage('Location created. Reload to see it in the list.')
      event.target.reset()
      await onCreated()
    } catch (requestError) {
      const status = requestError?.response?.status
      setError(
        status === 403 ? 'Access denied.'
          : requestError?.response?.data?.message || 'Could not create location. Check the details and try again.'
      )
    } finally { setBusy(false) }
  }

  return (
    <div className="resource-card" style={{ marginTop: '1rem' }}>
      <button className="button button-outline" type="button" onClick={() => setOpen((v) => !v)}>
        {open ? '▲ Hide create location form' : '▼ Create new provider location'}
      </button>
      {open && (
        <form className="stacked-form" onSubmit={submit} style={{ marginTop: '1rem' }}>
          <h4>Create provider location</h4>
          <label className="auth-field">Provider
            <select className="auth-input" name="providerId" required>
              <option value="">— select provider —</option>
              {providers.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="auth-field">Address line 1
            <input className="auth-input" name="addressLine1" maxLength="250" required />
          </label>
          <label className="auth-field">Address line 2 (optional)
            <input className="auth-input" name="addressLine2" maxLength="250" />
          </label>
          <label className="auth-field">Locality / area
            <input className="auth-input" name="locality" maxLength="100" required />
          </label>
          <label className="auth-field">City
            <input className="auth-input" name="city" maxLength="100" required />
          </label>
          <label className="auth-field">State code (2 letters, e.g. UP)
            <input className="auth-input" name="stateCode" maxLength="2" required placeholder="UP" />
          </label>
          <label className="auth-field">Postal code (6 digits, optional)
            <input className="auth-input" name="postalCode" maxLength="6" placeholder="209217" />
          </label>
          <label className="auth-field">Public phone
            <input className="auth-input" name="publicPhone" maxLength="30" placeholder="+91-…" />
          </label>
          <label className="auth-field">Public email
            <input className="auth-input" name="publicEmail" type="email" maxLength="254" />
          </label>
          <label className="auth-field">Accessibility notes (optional)
            <textarea className="auth-input" name="accessibilityNotes" maxLength="1000" rows="2" />
          </label>
          <label className="auth-field">Source name
            <input className="auth-input" name="sourceName" maxLength="200" required placeholder="Official source" />
          </label>
          <label className="auth-field">Source URL (https://)
            <input className="auth-input" name="sourceUrl" type="url" pattern="https://.*" maxLength="2048" placeholder="https://…" />
          </label>
          {error && <p role="alert" className="form-error">{error}</p>}
          {message && <p role="status" className="success-message">{message}</p>}
          <button className="button button-primary" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create location'}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Create Provider Service Form ──────────────────────────────────────────

const serviceTypes = [
  'INFORMATION_AND_REFERRAL', 'ASSESSMENT_AND_FITTING', 'AT_SUPPLY_OR_DISPENSING',
  'TRAINING', 'MAINTENANCE', 'REPAIR', 'REPLACEMENT_OR_REASSESSMENT_SUPPORT'
]

function CreateProviderServiceForm({ providers, onCreated }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const providerId = String(form.get('providerId') || '').trim()
    const payload = {
      code: String(form.get('code') || '').trim().toUpperCase(),
      name: String(form.get('name') || '').trim(),
      serviceType: String(form.get('serviceType') || ''),
      description: String(form.get('description') || '').trim(),
      sourceName: String(form.get('sourceName') || '').trim(),
      sourceUrl: String(form.get('sourceUrl') || '').trim() || null,
    }
    setError(''); setMessage('')
    if (!providerId) { setError('Select a provider.'); return }
    if (!payload.code || !payload.name || !payload.serviceType || !payload.description || !payload.sourceName) {
      setError('Code, name, type, description and source name are required.')
      return
    }
    if (!/^[A-Z][A-Z0-9_]*$/.test(payload.code)) {
      setError('Code must start with a letter and contain only uppercase letters, digits and underscores.')
      return
    }
    setBusy(true)
    try {
      await api.post(`/admin/provider-services/providers/${encodeURIComponent(providerId)}`, payload)
      setMessage(`Service "${payload.name}" created. Reload to see it in the list.`)
      event.target.reset()
      await onCreated()
    } catch (requestError) {
      const status = requestError?.response?.status
      setError(
        status === 409 ? 'A service with that code already exists for this provider.'
          : status === 403 ? 'Access denied.'
          : requestError?.response?.data?.message || 'Could not create service. Check the details and try again.'
      )
    } finally { setBusy(false) }
  }

  return (
    <div className="resource-card" style={{ marginTop: '1rem' }}>
      <button className="button button-outline" type="button" onClick={() => setOpen((v) => !v)}>
        {open ? '▲ Hide create service form' : '▼ Create new provider service'}
      </button>
      {open && (
        <form className="stacked-form" onSubmit={submit} style={{ marginTop: '1rem' }}>
          <h4>Create provider service</h4>
          <label className="auth-field">Provider
            <select className="auth-input" name="providerId" required>
              <option value="">— select provider —</option>
              {providers.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="auth-field">Service code (e.g. ALIMCO_AT_SUPPLY)
            <input className="auth-input" name="code" maxLength="64" required placeholder="PROVIDER_SERVICE_CODE" />
          </label>
          <label className="auth-field">Name
            <input className="auth-input" name="name" maxLength="200" required />
          </label>
          <label className="auth-field">Type
            <select className="auth-input" name="serviceType" required>
              {serviceTypes.map((t) => <option value={t} key={t}>{pretty(t)}</option>)}
            </select>
          </label>
          <label className="auth-field">Description
            <textarea className="auth-input" name="description" rows="3" required />
          </label>
          <label className="auth-field">Source name
            <input className="auth-input" name="sourceName" maxLength="200" required placeholder="Official source" />
          </label>
          <label className="auth-field">Source URL (https://)
            <input className="auth-input" name="sourceUrl" type="url" pattern="https://.*" maxLength="2048" placeholder="https://…" />
          </label>
          {error && <p role="alert" className="form-error">{error}</p>}
          {message && <p role="status" className="success-message">{message}</p>}
          <button className="button button-primary" type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create service'}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── Main Admin Verification Page ──────────────────────────────────────────

function AdminVerificationPage() {
  const [schemes, setSchemes] = useState([])
  const [providers, setProviders] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [providerLocations, setProviderLocations] = useState([])
  const [providerServices, setProviderServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [accessDenied, setAccessDenied] = useState(false)
  const [retry, setRetry] = useState(0)

  const load = useCallback(async () => {
    const [schemeResult, providerResult, categoryResult, productResult, locationResult, serviceResult] =
      await Promise.allSettled([
        api.get('/admin/schemes'),
        api.get('/admin/providers'),
        api.get('/admin/at-categories'),
        api.get('/admin/products'),
        api.get('/admin/provider-locations'),
        api.get('/admin/provider-services'),
      ])
    const results = [schemeResult, providerResult, categoryResult, productResult, locationResult, serviceResult]
    const rejected = results.filter((result) => result.status === 'rejected')
    const denied = rejected.some((result) => result.reason?.response?.status === 403)
    setAccessDenied(denied)
    if (schemeResult.status === 'fulfilled') setSchemes(Array.isArray(schemeResult.value.data) ? schemeResult.value.data : [])
    if (providerResult.status === 'fulfilled') setProviders(Array.isArray(providerResult.value.data) ? providerResult.value.data : [])
    if (categoryResult.status === 'fulfilled') setCategories(Array.isArray(categoryResult.value.data) ? categoryResult.value.data : [])
    if (productResult.status === 'fulfilled') setProducts(Array.isArray(productResult.value.data) ? productResult.value.data : [])
    if (locationResult.status === 'fulfilled') setProviderLocations(Array.isArray(locationResult.value.data) ? locationResult.value.data : [])
    if (serviceResult.status === 'fulfilled') setProviderServices(Array.isArray(serviceResult.value.data) ? serviceResult.value.data : [])
    if (rejected.length === results.length) {
      setError(denied
        ? 'Your account cannot access the admin verification APIs. Sign in with an authorized ADMIN account.'
        : 'We could not load admin records. Check your connection and try again.')
    } else if (rejected.length) {
      setError('Some admin records could not be loaded. Available sections are shown below.')
    } else {
      setError('')
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      try {
        await load()
      } catch {
        if (!cancelled) setError('We could not load admin records. Please try again.')
      } finally { if (!cancelled) setLoading(false) }
    }
    run()
    return () => { cancelled = true }
  }, [load, retry])

  async function refresh() {
    await load()
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="CivicAid home">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span><span className="brand-name">CivicAid</span><span className="brand-caption">Assistive technology access</span></span>
        </Link>
        <nav className="primary-nav" aria-label="Admin navigation">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/discover">Public catalogue</Link>
          <Link to="/schemes">Public schemes</Link>
        </nav>
      </header>

      <main id="main-content" className="resources-section">
        <p className="eyebrow">PHASE 10 · ADMINISTRATION</p>
        <h1>Admin verification workspace</h1>
        <p>
          Review the source before recording a verification outcome. Verification must reflect
          an actual review; it must never be used just to make a resource appear publicly.
        </p>

        {error && (
          <section className="information-note" role="alert">
            <p>{error}</p>
            {(accessDenied || error) && (
              <p>Only the backend can authorize admin actions. This page does not grant permissions.</p>
            )}
            <button className="button button-outline" type="button" onClick={() => setRetry((v) => v + 1)}>
              Retry loading
            </button>
          </section>
        )}

        {loading ? (
          <section className="information-note" aria-busy="true">
            <p role="status">Loading administrative records…</p>
          </section>
        ) : (
          <>
            {/* ── Schemes ── */}
            <section className="workspace-panel">
              <div className="section-heading">
                <div>
                  <h2>Schemes</h2>
                  <p>Admin list includes records that may not yet be public.</p>
                </div>
              </div>
              {schemes.length === 0
                ? <p>No scheme records were returned by the admin API.</p>
                : (
                  <div className="admin-record-list">
                    {schemes.map((scheme) => (
                      <article className="resource-card" key={scheme.id}>
                        <span className="resource-number">{scheme.code || 'Scheme'}</span>
                        <h3>{scheme.name}</h3>
                        <p>{scheme.description || 'No description provided.'}</p>
                        <p>Active: {scheme.active ? 'Yes' : 'No'} · Verification: {pretty(scheme.verificationStatus)} · Last verified: {scheme.lastVerifiedAt || 'Not recorded'}</p>
                        <VerificationForm kind="schemes" resource={scheme} onVerified={refresh} />
                      </article>
                    ))}
                  </div>
                )
              }
            </section>

            {/* ── Providers ── */}
            <section className="workspace-panel">
              <div className="section-heading">
                <div>
                  <h2>Providers</h2>
                  <p>Admin list includes records that may not yet be public.</p>
                </div>
              </div>
              <CreateProviderForm onCreated={refresh} />
              {providers.length === 0
                ? <p>No provider records were returned by the admin API.</p>
                : (
                  <div className="admin-record-list">
                    {providers.map((provider) => (
                      <article className="resource-card" key={provider.id}>
                        <span className="resource-number">{pretty(provider.providerType)}</span>
                        <h3>{provider.name}</h3>
                        <p>{provider.description || 'No description provided.'}</p>
                        <p>Active: {provider.active ? 'Yes' : 'No'} · Verification: {pretty(provider.verificationStatus)} · Last verified: {provider.lastVerifiedAt || 'Not recorded'}</p>
                        <VerificationForm kind="providers" resource={provider} onVerified={refresh} />
                      </article>
                    ))}
                  </div>
                )
              }
            </section>

            {/* ── Provider Locations ── */}
            <section className="workspace-panel">
              <div className="section-heading">
                <div>
                  <h2>Provider locations</h2>
                  <p>Verify individual service delivery locations before they appear in public discovery results.</p>
                </div>
              </div>
              <CreateProviderLocationForm providers={providers} onCreated={refresh} />
              {providerLocations.length === 0
                ? <p>No provider location records were returned by the admin API.</p>
                : (
                  <div className="admin-record-list">
                    {providerLocations.map((location) => (
                      <article className="resource-card" key={location.id}>
                        <span className="resource-number">{location.city || 'Location'}</span>
                        <h3>{location.name || location.addressLine1 || 'Unnamed location'}</h3>
                        <p>{[location.addressLine1, location.city, location.stateCode, location.postalCode].filter(Boolean).join(', ') || 'Address not recorded.'}</p>
                        <p>Active: {location.active ? 'Yes' : 'No'} · Verification: {pretty(location.verificationStatus)} · Last verified: {location.lastVerifiedAt || 'Not recorded'}</p>
                        <VerificationForm kind="provider-locations" resource={location} onVerified={refresh} />
                      </article>
                    ))}
                  </div>
                )
              }
            </section>

            {/* ── Provider Services ── */}
            <section className="workspace-panel">
              <div className="section-heading">
                <div>
                  <h2>Provider services</h2>
                  <p>Verify services offered by providers. Only verified services appear in the public catalogue.</p>
                </div>
              </div>
              <CreateProviderServiceForm providers={providers} onCreated={refresh} />
              {providerServices.length === 0
                ? <p>No provider service records were returned by the admin API.</p>
                : (
                  <div className="admin-record-list">
                    {providerServices.map((service) => (
                      <article className="resource-card" key={service.id}>
                        <span className="resource-number">{pretty(service.serviceType) || 'Service'}</span>
                        <h3>{service.name || 'Unnamed service'}</h3>
                        <p>{service.description || 'No description provided.'}</p>
                        <p>Active: {service.active ? 'Yes' : 'No'} · Verification: {pretty(service.verificationStatus)} · Last verified: {service.lastVerifiedAt || 'Not recorded'}</p>
                        <VerificationForm kind="provider-services" resource={service} onVerified={refresh} />
                      </article>
                    ))}
                  </div>
                )
              }
            </section>

            {/* ── AT Categories ── */}
            <section className="workspace-panel">
              <div className="section-heading">
                <div>
                  <h2>Assistive technology categories</h2>
                  <p>Review the category source before recording verification. Changes to category details reset verification.</p>
                </div>
              </div>
              {categories.length === 0
                ? <p>No category records were returned by the admin API.</p>
                : (
                  <div className="admin-record-list">
                    {categories.map((category) => (
                      <article className="resource-card" key={category.id}>
                        <span className="resource-number">{category.code}</span>
                        <h3>{category.name}</h3>
                        <p>{category.description || 'No description provided.'}</p>
                        <p>Source currently recorded: {category.sourceName || 'Not recorded'}{category.sourceUrl ? ` · ${category.sourceUrl}` : ''}</p>
                        <p>Active: {category.active ? 'Yes' : 'No'} · Verification: {pretty(category.verificationStatus)} · Last verified: {category.lastVerifiedAt || 'Not recorded'}</p>
                        <VerificationForm kind="at-categories" resource={category} onVerified={refresh} />
                      </article>
                    ))}
                  </div>
                )
              }
            </section>

            {/* ── AT Products ── */}
            <section className="workspace-panel">
              <div className="section-heading">
                <div>
                  <h2>Assistive technology products</h2>
                  <p>Product verification does not override the parent category's verification requirement.</p>
                </div>
              </div>
              {products.length === 0
                ? <p>No product records were returned by the admin API.</p>
                : (
                  <div className="admin-record-list">
                    {products.map((product) => (
                      <article className="resource-card" key={product.id}>
                        <span className="resource-number">{product.code}</span>
                        <h3>{product.name}</h3>
                        <p>{product.description || 'No description provided.'}</p>
                        {product.considerations && <p>Considerations: {product.considerations}</p>}
                        <p>Source currently recorded: {product.sourceName || 'Not recorded'}{product.sourceUrl ? ` · ${product.sourceUrl}` : ''}</p>
                        <p>Active: {product.active ? 'Yes' : 'No'} · Verification: {pretty(product.verificationStatus)} · Last verified: {product.lastVerifiedAt || 'Not recorded'}</p>
                        <VerificationForm kind="products" resource={product} onVerified={refresh} />
                      </article>
                    ))}
                  </div>
                )
              }
            </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <Link className="footer-brand" to="/">CivicAid</Link>
        <p>Source review and verification must remain evidence-based.</p>
      </footer>
    </div>
  )
}

export default AdminVerificationPage
