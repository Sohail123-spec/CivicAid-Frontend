
import api from './api.js'

/**
 * Retrieve publicly available schemes.
 *
 * Backend endpoint: GET /api/schemes
 *
 * Without a stateCode, the backend returns eligible national schemes.
 * With a stateCode, the backend may return eligible national and
 * applicable state schemes.
 *
 * The backend remains responsible for active status, effective dates,
 * verification status, and the 90-day freshness policy.
 *
 * @param {{ stateCode?: string }} options
 * @returns {Promise<Array<object>>}
 */
export async function getPublicSchemes(options = {}) {
  const params = {}
  const stateCode = options.stateCode

  if (stateCode != null && String(stateCode).trim() !== '') {
    const normalizedStateCode = String(stateCode).trim().toUpperCase()

    if (!/^[A-Z]{2}$/.test(normalizedStateCode)) {
      throw new Error(
        'State code must contain two letters, such as TS for Telangana.',
      )
    }

    params.stateCode = normalizedStateCode
  }

  const response = await api.get('/schemes', { params })

  if (!Array.isArray(response.data)) {
    throw new Error(
      'The server returned an invalid public schemes response.',
    )
  }

  return response.data
}

/**
 * Retrieve a single publicly available scheme.
 *
 * Backend endpoint: GET /api/schemes/{schemeId}
 *
 * State-level schemes require the applicable stateCode. The backend
 * decides whether the requested scheme is currently available for
 * public discovery.
 *
 * @param {string} schemeId
 * @param {{ stateCode?: string }} options
 * @returns {Promise<object>}
 */
export async function getPublicSchemeById(schemeId, options = {}) {
  if (
    typeof schemeId !== 'string' ||
    !schemeId.trim()
  ) {
    throw new Error('A valid scheme ID is required.')
  }

  const params = {}
  const stateCode = options.stateCode

  if (stateCode != null && String(stateCode).trim() !== '') {
    const normalizedStateCode = String(stateCode).trim().toUpperCase()

    if (!/^[A-Z]{2}$/.test(normalizedStateCode)) {
      throw new Error(
        'State code must contain two letters, such as TS for Telangana.',
      )
    }

    params.stateCode = normalizedStateCode
  }

  const response = await api.get(
    `/schemes/${encodeURIComponent(schemeId.trim())}`,
    { params },
  )

  if (
    !response.data ||
    typeof response.data !== 'object' ||
    Array.isArray(response.data)
  ) {
    throw new Error(
      'The server returned an invalid scheme details response.',
    )
  }

  return response.data
}

/**
 * Retrieve covered assistive technology categories for a scheme.
 *
 * Backend endpoint: GET /api/schemes/{schemeId}/categories
 *
 * @param {string} schemeId
 * @param {{ stateCode?: string }} options
 * @returns {Promise<Array<object>>}
 */
export async function getPublicSchemeCategories(schemeId, options = {}) {
  if (typeof schemeId !== 'string' || !schemeId.trim()) {
    throw new Error('A valid scheme ID is required.')
  }

  const params = {}
  if (options.stateCode != null && String(options.stateCode).trim() !== '') {
    params.stateCode = String(options.stateCode).trim().toUpperCase()
  }

  const response = await api.get(
    `/schemes/${encodeURIComponent(schemeId.trim())}/categories`,
    { params },
  )

  return Array.isArray(response.data) ? response.data : []
}

/**
 * Retrieve covered assistive technology products for a scheme.
 *
 * Backend endpoint: GET /api/schemes/{schemeId}/products
 *
 * @param {string} schemeId
 * @param {{ stateCode?: string }} options
 * @returns {Promise<Array<object>>}
 */
export async function getPublicSchemeProducts(schemeId, options = {}) {
  if (typeof schemeId !== 'string' || !schemeId.trim()) {
    throw new Error('A valid scheme ID is required.')
  }

  const params = {}
  if (options.stateCode != null && String(options.stateCode).trim() !== '') {
    params.stateCode = String(options.stateCode).trim().toUpperCase()
  }

  const response = await api.get(
    `/schemes/${encodeURIComponent(schemeId.trim())}/products`,
    { params },
  )

  return Array.isArray(response.data) ? response.data : []
}

