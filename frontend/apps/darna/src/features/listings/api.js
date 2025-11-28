import { apiClient } from '../../lib/httpClient.js'

export function searchListings(params) {
  return apiClient.get('/api/realEstate/search', { params })
}

export function fetchListingById(listingId) {
  return apiClient.get(`/api/realEstate/${listingId}`)
}

export function createListing(payload) {
  return apiClient.post('/api/realEstate', payload)
}

export function fetchMyListings(params = {}) {
  return apiClient.get('/api/realEstate/mine', { params })
}

export function updateListing(listingId, payload) {
  return apiClient.patch(`/api/realEstate/${listingId}`, payload)
}

export function deleteListing(listingId) {
  return apiClient.delete(`/api/realEstate/${listingId}`)
}

export function estimateListingPrice(listingId) {
  return apiClient.post(`/api/realEstate/${listingId}/estimate`)
}
