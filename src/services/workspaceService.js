import api from './api.js'

const asList = (data, label) => {
  if (!Array.isArray(data)) throw new Error(`The server returned an invalid ${label} response.`)
  return data
}

export async function getSavedResources() {
  const { data } = await api.get('/users/me/saved-resources')
  return asList(data, 'saved resources')
}

export async function saveResource(resourceType, resourceId) {
  if (!resourceType || !resourceId) throw new Error('A resource type and identifier are required.')
  const { data } = await api.post('/users/me/saved-resources', { resourceType, resourceId })
  return data
}

export async function deleteSavedResource(id) {
  await api.delete(`/users/me/saved-resources/${encodeURIComponent(id)}`)
}

export async function getLifecycleRecords() {
  const { data } = await api.get('/users/me/lifecycle-records')
  return asList(data, 'device records')
}

export async function createLifecycleRecord(payload) {
  const { data } = await api.post('/users/me/lifecycle-records', payload)
  return data
}

export async function deleteLifecycleRecord(id) {
  await api.delete(`/users/me/lifecycle-records/${encodeURIComponent(id)}`)
}

export async function getMaintenanceRecords(lifecycleId) {
  const { data } = await api.get(`/users/me/maintenance-records/lifecycle/${encodeURIComponent(lifecycleId)}`)
  return asList(data, 'maintenance records')
}

export async function createMaintenanceRecord(payload) {
  const { data } = await api.post('/users/me/maintenance-records', payload)
  return data
}

export async function deleteMaintenanceRecord(id) {
  await api.delete(`/users/me/maintenance-records/${encodeURIComponent(id)}`)
}

export async function getRepairRecords(lifecycleId) {
  const { data } = await api.get(`/users/me/repair-records/lifecycle/${encodeURIComponent(lifecycleId)}`)
  return asList(data, 'repair records')
}

export async function createRepairRecord(payload) {
  const { data } = await api.post('/users/me/repair-records', payload)
  return data
}

export async function deleteRepairRecord(id) {
  await api.delete(`/users/me/repair-records/${encodeURIComponent(id)}`)
}

export async function getProviders() {
  const { data } = await api.get('/providers')
  return asList(data, 'providers')
}

export async function getProviderServiceLocations(providerId) {
  const { data } = await api.get(`/providers/${encodeURIComponent(providerId)}/service-locations`)
  return asList(data, 'provider service locations')
}

export async function getProviderServices(providerId) {
  const { data } = await api.get(`/providers/${encodeURIComponent(providerId)}/services`)
  return asList(data, 'provider services')
}
