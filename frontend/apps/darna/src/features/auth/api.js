import { apiClient } from '../../lib/httpClient.js'

export function registerUser(payload) {
  return apiClient.post('/api/auth/register', payload)
}

export function loginUser(payload) {
  return apiClient.post('/api/auth/login', payload)
}

export function fetchCurrentUser() {
  return apiClient.get('/api/auth/me')
}

export function refreshToken(refreshToken) {
  return apiClient.post('/api/auth/refresh', { refresh_token: refreshToken })
}

export function fetchUserAccount() {
  return apiClient.get('/api/users/me')
}
