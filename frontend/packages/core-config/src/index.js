const REQUIRED_KEYS = ['VITE_API_BASE_URL', 'VITE_SOCKET_URL', 'VITE_KEYCLOAK_BASE_URL']
const OPTIONAL_KEYS = ['VITE_APP_TENANT', 'VITE_APP_REGION']

const cache = {
  env: null,
}

const DEFAULTS = {
  VITE_API_BASE_URL: 'http://localhost:3001/',
  VITE_SOCKET_URL: 'ws://localhost:3001',
  VITE_KEYCLOAK_BASE_URL: 'http://localhost:8080',
}

function readRawEnv() {
  if (typeof window !== 'undefined' && window.__DARNA_ENV__) {
    return window.__DARNA_ENV__
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env
  }
  return {}
}

function normalizeUrl(value, { ensureTrailingSlash = false } = {}) {
  if (!value || typeof value !== 'string') return value
  let normalized = value.trim()
  if (!normalized) return normalized
  if (ensureTrailingSlash && !normalized.endsWith('/')) {
    normalized = `${normalized}/`
  }
  if (!ensureTrailingSlash && normalized.endsWith('/')) {
    normalized = normalized.replace(/\/+$/, '')
  }
  return normalized
}

function buildEnv() {
  const raw = readRawEnv()
  const nextEnv = {
    MODE: raw.MODE || raw.NODE_ENV || 'development',
    BASE_URL: raw.BASE_URL || '/',
  }

  REQUIRED_KEYS.forEach((key) => {
    const rawValue = raw[key] ?? DEFAULTS[key]
    if (!rawValue) {
      throw new Error(
        `Missing required env var ${key}. Provide it via .env or Docker build args.`,
      )
    }
    nextEnv[key] = key === 'VITE_API_BASE_URL'
      ? normalizeUrl(rawValue, { ensureTrailingSlash: true })
      : normalizeUrl(rawValue)
  })

  OPTIONAL_KEYS.forEach((key) => {
    if (raw[key]) {
      nextEnv[key] = raw[key]
    }
  })

  return Object.freeze(nextEnv)
}

export function getEnv() {
  if (!cache.env) {
    cache.env = buildEnv()
  }
  return cache.env
}

export function getApiBaseUrl() {
  return getEnv().VITE_API_BASE_URL
}

export function getSocketUrl() {
  return getEnv().VITE_SOCKET_URL
}

export function getKeycloakBaseUrl() {
  return getEnv().VITE_KEYCLOAK_BASE_URL
}

export function createApiUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  return new URL(normalizedPath, getApiBaseUrl()).toString()
}

export function isDevelopment() {
  return getEnv().MODE === 'development'
}

export function getTenantContext() {
  const env = getEnv()
  return {
    tenant: env.VITE_APP_TENANT || 'darna',
    region: env.VITE_APP_REGION || 'ma',
  }
}
