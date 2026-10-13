import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import SaveResourceButton from '../components/SaveResourceButton.jsx'
import { getProviders, getProviderServiceLocations, getProviderServices } from '../services/workspaceService.js'

function readable(value) {
  return typeof value === 'string' && value.trim()
    ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Not provided'
}

function ProviderMap({ locations }) {
  const mapNode = useRef(null)

  useEffect(() => {
    if (!mapNode.current) return undefined
    const map = L.map(mapNode.current, { scrollWheelZoom: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const usable = locations.filter((item) => item.latitude != null && item.longitude != null && Number.isFinite(Number(item.latitude)) && Number.isFinite(Number(item.longitude)))
    if (usable.length) {
      const bounds = []
      usable.forEach((item) => {
        const point = [Number(item.latitude), Number(item.longitude)]
        bounds.push(point)
        const marker = L.circleMarker(point, { radius: 7, color: '#145c58', fillColor: '#e8f3f1', fillOpacity: 1, weight: 2 }).addTo(map)
        marker.bindPopup(`<strong>${String(item.providerName || 'Provider').replace(/[<>&]/g, '')}</strong><br>${String(item.serviceName || 'Service').replace(/[<>&]/g, '')}<br>${String(item.city || '').replace(/[<>&]/g, '')}`)
      })
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12 })
    } else {
      map.setView([20.5937, 78.9629], 4)
    }

    const resizeObserver = new ResizeObserver(() => map.invalidateSize())
    resizeObserver.observe(mapNode.current)
    return () => {
      resizeObserver.disconnect()
      map.remove()
    }
  }, [locations])

  return <div className="provider-map" ref={mapNode} role="region" aria-label="Map of provider service locations" />
}

function ProvidersPage() {
  const [providers, setProviders] = useState([])
  const [locations, setLocations] = useState([])
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError('')
      try {
        const providerRows = await getProviders()
        const details = await Promise.all(providerRows.map(async (provider) => {
          const [serviceResult, locationResult] = await Promise.allSettled([
            getProviderServices(provider.id),
            getProviderServiceLocations(provider.id),
          ])
          return {
            provider,
            services: serviceResult.status === 'fulfilled' ? serviceResult.value : [],
            locations: locationResult.status === 'fulfilled' ? locationResult.value : [],
          }
        }))
        if (cancelled) return
        setProviders(details)
        setLocations(details.flatMap((row) => row.locations))
      } catch {
        if (!cancelled) setError('We could not load public provider information. Please check your connection and try again.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [retry])

  const serviceTypes = useMemo(() => [...new Set(providers.flatMap((row) => row.services.map((service) => service.serviceType).filter(Boolean)))].sort(), [providers])
  const filtered = useMemo(() => providers.filter(({ provider, services, locations: providerLocations }) => {
    const term = search.trim().toLowerCase()
    const text = [provider.name, provider.description, provider.providerType, ...services.map((item) => `${item.name} ${item.description} ${item.serviceType}`), ...providerLocations.map((item) => `${item.city} ${item.locality} ${item.stateCode}`)].join(' ').toLowerCase()
    return (!term || text.includes(term)) && (serviceFilter === 'all' || services.some((service) => service.serviceType === serviceFilter))
  }), [providers, search, serviceFilter])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="CivicAid home"><span className="brand-mark" aria-hidden="true">C</span><span><span className="brand-name">CivicAid</span><span className="brand-caption">Assistive technology access</span></span></Link>
        <nav className="primary-nav" aria-label="Public navigation"><Link to="/discover">Explore AT</Link><Link to="/schemes">Schemes &amp; Support</Link><Link to="/providers" aria-current="page">Find Services</Link><Link to="/login">Sign in</Link></nav>
      </header>
      <main id="main-content" className="resources-section">
        <p className="eyebrow">PHASE 8 · PROVIDER &amp; LOCATION DISCOVERY</p>
        <div className="section-heading"><div><h1>Find services and providers</h1><p>Explore public provider and service-location information. Contact the organisation to confirm current availability, accessibility, and service details.</p></div></div>
        <section className="filter-panel" aria-label="Filter providers">
          <label className="auth-field">Search providers, services or locations<input className="auth-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try a service name or city" /></label>
          <label className="auth-field">Service type<select className="auth-input" value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}><option value="all">All service types</option>{serviceTypes.map((type) => <option key={type} value={type}>{readable(type)}</option>)}</select></label>
        </section>
        {isLoading ? <section className="information-note" aria-busy="true"><p role="status">Loading providers and service locations…</p></section> : error ? <section className="information-note" role="alert"><h2>Provider information unavailable</h2><p>{error}</p><button className="button button-primary" type="button" onClick={() => setRetry((value) => value + 1)}>Try again</button></section> : providers.length === 0 ? <section className="information-note"><h2>No verified public providers are available yet</h2><p>Provider records appear here only when the backend considers them eligible for public discovery. No sample providers have been added.</p></section> : <>
          <p className="result-count" role="status">Showing {filtered.length} of {providers.length} providers</p>
          <ProviderMap locations={locations} />
          {filtered.length === 0 ? <section className="information-note"><h2>No matches found</h2><p>Try another search term or choose all service types.</p><button className="button button-outline" type="button" onClick={() => { setSearch(''); setServiceFilter('all') }}>Clear filters</button></section> : <div className="resource-grid">{filtered.map(({ provider, services, locations: providerLocations }) => <article className="resource-card" key={provider.id}>
            <span className="resource-number">{readable(provider.providerType)}</span><h2>{provider.name}</h2><p>{provider.description || 'No description is currently available.'}</p>
            <div className="discovery-source"><strong>Trust information</strong><p>Verification status: {readable(provider.verificationStatus)}</p><p>Last verified: {provider.lastVerifiedAt || 'Not recorded'}</p>{provider.sourceName && <p>Source: {provider.sourceName}</p>}{provider.sourceUrl && <p><a className="text-link" href={provider.sourceUrl} target="_blank" rel="noopener noreferrer">Review source ↗</a></p>}</div>
            <h3>Services</h3>{services.length ? <ul>{services.map((service) => <li key={service.id}><strong>{service.name}</strong> — {service.description || readable(service.serviceType)} <span className="muted-inline">({readable(service.verificationStatus)})</span></li>)}</ul> : <p>No currently eligible public services are listed for this provider.</p>}
            <h3>Service locations</h3>{providerLocations.length ? providerLocations.map((location) => <div className="location-entry" key={location.id}><strong>{location.addressLine1 || 'Address not provided'}</strong><p>{[location.addressLine2, location.locality, location.city, location.stateCode, location.postalCode].filter(Boolean).join(', ') || 'Location details not provided'}</p>{location.accessibilityNotes && <p><strong>Accessibility:</strong> {location.accessibilityNotes}</p>}{(location.publicPhone || location.publicEmail) && <p>{location.publicPhone && <>Phone: <a href={`tel:${location.publicPhone}`}>{location.publicPhone}</a> </>}{location.publicEmail && <>Email: <a href={`mailto:${location.publicEmail}`}>{location.publicEmail}</a></>}</p>}{location.latitude != null && location.longitude != null && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude)) && <p><a className="text-link" href={`https://www.openstreetmap.org/?mlat=${encodeURIComponent(location.latitude)}&mlon=${encodeURIComponent(location.longitude)}#map=15/${encodeURIComponent(location.latitude)}/${encodeURIComponent(location.longitude)}`} target="_blank" rel="noopener noreferrer">Open location map ↗</a></p>}<p className="muted-inline">Location verification: {readable(location.verificationStatus)} · Last verified: {location.lastVerifiedAt || 'Not recorded'}</p><SaveResourceButton resourceType="PROVIDER_SERVICE_LOCATION" resourceId={location.id} /></div>) : <p>No currently eligible service locations are listed.</p>}
            {provider.websiteUrl && <p><a className="text-link" href={provider.websiteUrl} target="_blank" rel="noopener noreferrer">Provider website ↗</a></p>}
            <SaveResourceButton resourceType="PROVIDER" resourceId={provider.id} />
          </article>)}</div>}
        </>}
        <p className="trust-disclaimer">CivicAid helps with discovery. It does not certify providers or guarantee that a service is suitable or currently available.</p>
      </main>
      <footer className="site-footer"><Link className="footer-brand" to="/">CivicAid</Link><p>Clear information for the assistive technology journey.</p></footer>
    </div>
  )
}

export default ProvidersPage
