
import api from './api.js'

/**
 * Retrieves the functional needs available for selection.
 *
 * Backend endpoint: GET /api/needs
 *
 * Each item contains:
 * id, code, label, description, parentNeedId, selectable, displayOrder
 */
export async function getAvailableNeeds() {
  const response = await api.get('/needs')

  if (!Array.isArray(response.data)) {
    throw new Error(
      'The server returned an invalid functional-needs response.',
    )
  }

  return response.data
}

/**
 * Retrieves the authenticated user's saved functional needs.
 *
 * Backend endpoint: GET /api/users/me/functional-needs
 */
export async function getMyFunctionalNeeds() {
  const response = await api.get('/users/me/functional-needs')

  if (!Array.isArray(response.data)) {
    throw new Error(
      'The server returned an invalid saved-needs response.',
    )
  }

  return response.data
}

/**
 * Replaces the authenticated user's saved functional needs.
 *
 * Backend endpoint: PUT /api/users/me/functional-needs
 *
 * @param {string[]} functionalNeedCodes - Selected need codes.
 */
export async function saveMyFunctionalNeeds(functionalNeedCodes) {
  if (
    !Array.isArray(functionalNeedCodes) ||
    functionalNeedCodes.length === 0 ||
    functionalNeedCodes.some(
      (code) => typeof code !== 'string' || !code.trim(),
    )
  ) {
    throw new Error('Select at least one valid functional need.')
  }

  const response = await api.put('/users/me/functional-needs', {
    functionalNeedCodes: [
      ...new Set(
        functionalNeedCodes.map((code) => code.trim()),
      ),
    ],
  })

  if (!Array.isArray(response.data)) {
    throw new Error(
      'The server returned an invalid saved-needs response.',
    )
  }

  return response.data
}
