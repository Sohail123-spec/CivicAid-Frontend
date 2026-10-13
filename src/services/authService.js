
import api, { setAuthToken, clearAuthToken } from './api.js'

/**
 * Signs in an existing CivicAid user.
 *
 * Backend endpoint: POST /api/auth/login
 */
export async function login({ email, password }) {
  const response = await api.post('/auth/login', {
    email: email.trim(),
    password,
  })

  const { token, user } = response.data ?? {}

  if (!token || !user) {
    throw new Error('The server returned an invalid login response.')
  }

  setAuthToken(token)

  return { token, user }
}

/**
 * Registers a new CivicAid user.
 *
 * Backend endpoint: POST /api/auth/register
 */
export async function register({ displayName, email, password }) {
  const response = await api.post('/auth/register', {
    displayName: displayName.trim(),
    email: email.trim(),
    password,
  })

  const { token, user } = response.data ?? {}

  if (!token || !user) {
    throw new Error('The server returned an invalid registration response.')
  }

  setAuthToken(token)

  return { token, user }
}

/**
 * Signs out locally by removing the stored JWT.
 */
export function logout() {
  clearAuthToken()
}

/**
 * Retrieves the current authenticated user's profile.
 *
 * Backend endpoint: GET /api/users/me
 */
export async function getCurrentUser() {
  const response = await api.get('/users/me')
  return response.data
}

/**
 * Updates the authenticated user's display name.
 *
 * Backend endpoint: PUT /api/users/me
 * @param {string} displayName — new display name (1–100 characters)
 * @returns {Promise<object>} updated profile
 */
export async function updateCurrentUser({ displayName }) {
  const response = await api.put('/users/me', {
    displayName: displayName.trim(),
  })
  return response.data
}

/**
 * Permanently deletes the authenticated user's account.
 * Throws with a descriptive message if the server returns 409 (account
 * referenced in immutable audit or verification history).
 *
 * Backend endpoint: DELETE /api/users/me
 */
export async function deleteCurrentUser() {
  await api.delete('/users/me')
}
