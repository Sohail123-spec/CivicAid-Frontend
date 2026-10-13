import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { getATCategories, getATProducts } from '../services/discoveryService.js'
import { getPublicSchemes } from '../services/schemesService.js'
import { deleteSavedResource, getProviders, getProviderServiceLocations, getSavedResources } from '../services/workspaceService.js'

const labels = { AT_CATEGORY: 'Assistive technology category', AT_PRODUCT: 'Assistive technology product', SCHEME: 'Scheme or support', PROVIDER: 'Provider', PROVIDER_LOCATION: 'Provider location', PROVIDER_SERVICE_LOCATION: 'Provider service location' }
const list = (value) => Array.isArray(value) ? value : []

function SavedResourcesPage() {
  const [saved, setSaved] = useState([])
  const [resources, setResources] = useState({ AT_CATEGORY: [], AT_PRODUCT: [], SCHEME: [], PROVIDER: [], PROVIDER_LOCATION: [], PROVIDER_SERVICE_LOCATION: [] })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [retry, setRetry] = useState(0)
  const [removing, setRemoving] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true); setError(''); setNotice('')
      try {
        const [savedResult, categoriesResult, productsResult, schemesResult, providersResult] = await Promise.allSettled([
          getSavedResources(),
          getATCategories(), getATProducts(), getPublicSchemes(), getProviders(),
        ])
        if (savedResult.status !== 'fulfilled') throw savedResult.reason
        const providers = providersResult.status === 'fulfilled' ? providersResult.value : []
        const locationGroups = await Promise.allSettled(providers.map((provider) => getProviderServiceLocations(provider.id)))
        const providerLocations = []
        const serviceLocations = []
        locationGroups.forEach((result) => {
          if (result.status === 'fulfilled') {
            result.value.forEach((location) => {
              serviceLocations.push(location)
              providerLocations.push({ ...location, id: location.providerLocationId, providerId: location.providerId })
            })
          }
        })
        if (cancelled) return
        setSaved(savedResult.value)
        setResources({
          AT_CATEGORY: categoriesResult.status === 'fulfilled' ? list(categoriesResult.value) : [],
          AT_PRODUCT: productsResult.status === 'fulfilled' ? list(productsResult.value) : [],
          SCHEME: schemesResult.status === 'fulfilled' ? list(schemesResult.value) : [],
          PROVIDER: providers,
          PROVIDER_LOCATION: providerLocations,
          PROVIDER_SERVICE_LOCATION: serviceLocations,
        })
      } catch (loadError) {
        if (!cancelled) setError(loadError?.response?.status === 401 ? 'Your session has expired. Sign in again to view saved resources.' : 'We could not load your saved resources. Please try again.')
      } finally { if (!cancelled) setIsLoading(false) }
    }
    load()
    return () => { cancelled = true }
  }, [retry])

  const rows = useMemo(() => saved.map((item) => {
    const record = resources[item.resourceType]?.find((resource) => String(resource.id) === String(item.resourceId))
    const title = record?.name || record?.providerName || record?.itemName || `${labels[item.resourceType] || 'Resource'} details unavailable`
    let href = '/discover'
    if (item.resourceType === 'AT_PRODUCT') href = `/discover/products/${encodeURIComponent(item.resourceId)}`
    if (item.resourceType === 'SCHEME') href = `/schemes/${encodeURIComponent(item.resourceId)}`
    if (['PROVIDER', 'PROVIDER_LOCATION', 'PROVIDER_SERVICE_LOCATION'].includes(item.resourceType)) href = '/providers'
    return { ...item, title, href, record }
  }), [saved, resources])

  async function remove(item) {
    setRemoving(item.id); setError(''); setNotice('')
    try {
      await deleteSavedResource(item.id)
      setSaved((current) => current.filter((row) => row.id !== item.id))
      setNotice('Resource removed from your saved list.')
    } catch (removeError) { setError(removeError?.response?.data?.message || 'Could not remove this resource. Please try again.') }
    finally { setRemoving('') }
  }

  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="site-header"><Link className="brand" to="/" aria-label="CivicAid home"><span className="brand-mark" aria-hidden="true">C</span><span><span className="brand-name">CivicAid</span><span className="brand-caption">Assistive technology access</span></span></Link><nav className="primary-nav" aria-label="Workspace navigation"><Link to="/discover">Explore AT</Link><Link to="/schemes">Schemes &amp; Support</Link><Link to="/providers">Find Services</Link><Link to="/lifecycle">My Devices</Link><Link to="/dashboard">Dashboard</Link></nav></header>
    <main id="main-content" className="resources-section"><p className="eyebrow">YOUR CIVICAID WORKSPACE</p><div className="section-heading"><div><h1>Saved resources</h1><p>Keep public resources together so you can return to them. Saved items may no longer be publicly available if their verification or freshness changes.</p></div></div>
      {error && <section className="information-note" role="alert"><p>{error}</p><button className="button button-outline" type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button></section>}{notice && <p className="success-message" role="status">{notice}</p>}
      {isLoading ? <section className="information-note" aria-busy="true"><p role="status">Loading saved resources…</p></section> : saved.length === 0 ? <section className="information-note"><h2>No saved resources yet</h2><p>When you find a useful product, scheme, provider or service location, choose “Save resource” to keep it here.</p><div className="auth-links"><Link className="button button-primary" to="/discover">Explore AT</Link><Link className="button button-outline" to="/schemes">Explore schemes</Link><Link className="button button-outline" to="/providers">Find services</Link></div></section> : <><p className="result-count" role="status">{saved.length} saved {saved.length === 1 ? 'resource' : 'resources'}</p><div className="resource-grid">{rows.map((item) => <article className="resource-card" key={item.id}><span className="resource-number">{labels[item.resourceType] || item.resourceType}</span><h2>{item.title}</h2>{item.record?.description && <p>{item.record.description}</p>}{item.record?.verificationStatus && <div className="discovery-source"><p>Verification status: {String(item.record.verificationStatus).replaceAll('_', ' ')}</p><p>Last verified: {item.record.lastVerifiedAt || 'Not recorded'}</p></div>}<p className="muted-inline">Saved on {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-IN') : 'date not recorded'}</p><div className="card-actions"><Link className="button button-outline" to={item.href}>Open resource</Link><button className="button button-outline button-danger" type="button" onClick={() => remove(item)} disabled={removing === item.id}>{removing === item.id ? 'Removing…' : 'Remove saved item'}</button></div>{!item.record && <p className="muted-inline">This item is not currently returned by public discovery. It has not been deleted from your saved list.</p>}</article>)}</div></>}
    </main><footer className="site-footer"><Link className="footer-brand" to="/">CivicAid</Link><p>Your saved information, in one place.</p></footer></div>
}

export default SavedResourcesPage
