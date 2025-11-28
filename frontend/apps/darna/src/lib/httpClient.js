import axios from 'axios'
import { getApiBaseUrl } from '@darna/core-config'

const httpClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
})

let requestInterceptorId = null
let responseInterceptorId = null
let refreshPromise = null

export function attachAuthInterceptors({ getAccessToken, refreshAuth, onLogout }) {
  if (requestInterceptorId !== null || responseInterceptorId !== null) {
    return
  }

  requestInterceptorId = httpClient.interceptors.request.use((config) => {
    const token = getAccessToken?.()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  responseInterceptorId = httpClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error.response?.status
      const originalRequest = error.config
      if (status !== 401 || !originalRequest || originalRequest.__isRetry) {
        return Promise.reject(error)
      }

      originalRequest.__isRetry = true

      try {
        if (!refreshPromise) {
          refreshPromise = refreshAuth?.()
        }
        if (refreshPromise) {
          await refreshPromise
          refreshPromise = null
          return httpClient(originalRequest)
        }
      } catch (refreshError) {
        refreshPromise = null
        onLogout?.(refreshError)
        return Promise.reject(refreshError)
      }

      return Promise.reject(error)
    },
  )
}

export const apiClient = httpClient

export function setAuthToken(token) {
  if (!token) {
    delete httpClient.defaults.headers.common.Authorization
    return
  }
  httpClient.defaults.headers.common.Authorization = `Bearer ${token}`
}
