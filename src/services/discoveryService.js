
import api from './api.js'

/**
 * Fetch publicly available assistive technology categories.
 * The backend applies its own active, verification, and freshness rules.
 */
export async function getATCategories() {
  const response = await api.get('/at-categories')

  if (!Array.isArray(response.data)) {
    throw new Error(
      'The server returned an invalid assistive technology categories response.',
    )
  }

  return response.data
}

/**
 * Fetch a single publicly available assistive technology category.
 * The backend returns only records eligible for public discovery.
 *
 * @param {string} categoryId - Category UUID.
 */
export async function getATCategoryById(categoryId) {
  if (typeof categoryId !== 'string' || !categoryId.trim()) {
    throw new Error('A valid category ID is required.')
  }

  const response = await api.get(
    `/at-categories/${encodeURIComponent(categoryId)}`,
  )

  if (
    !response.data ||
    typeof response.data !== 'object' ||
    Array.isArray(response.data)
  ) {
    throw new Error(
      'The server returned an invalid assistive technology category response.',
    )
  }

  return response.data
}

/**
 * Fetch publicly available assistive technology products.
 * The backend applies its own active, verification, and freshness rules.
 */
export async function getATProducts() {
  const response = await api.get('/products')

  if (!Array.isArray(response.data)) {
    throw new Error(
      'The server returned an invalid assistive technology products response.',
    )
  }

  return response.data
}

/**
 * Fetch one publicly available assistive technology product.
 * The backend determines whether the product is eligible for public
 * discovery and returns an error if it is unavailable or not found.
 *
 * @param {string} productId - Product UUID.
 */
export async function getATProductById(productId) {
  if (typeof productId !== 'string' || !productId.trim()) {
    throw new Error('A valid product ID is required.')
  }

  const response = await api.get(
    `/products/${encodeURIComponent(productId)}`,
  )

  if (
    !response.data ||
    typeof response.data !== 'object' ||
    Array.isArray(response.data)
  ) {
    throw new Error(
      'The server returned an invalid assistive technology product response.',
    )
  }

  return response.data
}

/**
 * Fetch verified public mappings between functional needs and
 * assistive technology categories, as exposed by the backend.
 */
export async function getNeedCategoryMappings() {
  const response = await api.get('/need-category-mappings')

  if (!Array.isArray(response.data)) {
    throw new Error(
      'The server returned an invalid discovery mappings response.',
    )
  }

  return response.data
}
