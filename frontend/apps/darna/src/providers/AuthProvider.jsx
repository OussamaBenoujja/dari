import { useCallback, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { useAuthStore } from '../stores/authStore.js'
import { attachAuthInterceptors, setAuthToken } from '../lib/httpClient.js'
import { fetchCurrentUser, fetchUserAccount, loginUser, refreshToken as refreshTokenRequest } from '../features/auth/api.js'
import { AuthContext } from './AuthContext.js'

export function AuthProvider({ children }) {
  const accessToken = useAuthStore((state) => state.accessToken)
  const refreshTokenValue = useAuthStore((state) => state.refreshToken)
  const profile = useAuthStore((state) => state.profile)
  const status = useAuthStore((state) => state.status)
  const setTokens = useAuthStore((state) => state.setTokens)
  const setProfile = useAuthStore((state) => state.setProfile)
  const clearSession = useAuthStore((state) => state.clearSession)
  const setStatus = useAuthStore((state) => state.setStatus)
  const isTokenExpired = useAuthStore((state) => state.isTokenExpired)
  const isRefreshTokenExpired = useAuthStore((state) => state.isRefreshTokenExpired)

  const [isHydrated, setHydrated] = useState(false)

  const logout = useCallback(() => {
    clearSession()
    setAuthToken(null)
    setProfile(null)
    setStatus('anonymous')
    setHydrated(true)
  }, [clearSession, setProfile, setStatus])

  const persistTokens = useCallback(
    (rawTokens = {}) => {
      const normalized = normalizeTokenResponse(rawTokens)
      setTokens(normalized)
      if (normalized.accessToken) {
        setAuthToken(normalized.accessToken)
      } else {
        setAuthToken(null)
      }
      return normalized
    },
    [setTokens],
  )

  const hydrateProfile = useCallback(
    async (tokenOverride) => {
      const token = tokenOverride ?? accessToken
      if (!token) {
        setProfile(null)
        setStatus('anonymous')
        return null
      }

      const roles = extractRolesFromToken(token)
      const accountType = inferAccountType(roles)
      const { data } = await fetchCurrentUser()
      let accountData = null
      try {
        const accountResponse = await fetchUserAccount()
        accountData = accountResponse?.data?.data ?? null
      } catch (accountError) {
        console.warn('Unable to fetch persisted user account', accountError)
      }
      const ownerId = accountData?._id ?? accountData?.id ?? data?.sub ?? null
      const nextProfile = {
        ...data,
        roles,
        accountType,
        ownerId,
        account: accountData,
      }
      setProfile(nextProfile)
      setStatus('authenticated')
      return nextProfile
    },
    [accessToken, setProfile, setStatus],
  )

  const refreshAuth = useCallback(async () => {
    if (!refreshTokenValue || isRefreshTokenExpired()) {
      logout()
      throw new Error('Votre session a expiré. Merci de vous reconnecter.')
    }
    const { data } = await refreshTokenRequest(refreshTokenValue)
    return persistTokens(data)
  }, [refreshTokenValue, isRefreshTokenExpired, persistTokens, logout])

  const login = useCallback(
    async ({ email, password }) => {
      setStatus('loading')
      try {
  const { data } = await loginUser({ username: email, email, password })
        const normalized = persistTokens(data)
        await hydrateProfile(normalized.accessToken)
        setHydrated(true)
        return { success: true }
      } catch (error) {
        setStatus('error')
        throw error
      }
    },
    [hydrateProfile, persistTokens, setStatus],
  )

  useEffect(() => {
    attachAuthInterceptors({
      getAccessToken: () => useAuthStore.getState().accessToken,
      refreshAuth,
      onLogout: logout,
    })
  }, [refreshAuth, logout])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (isHydrated) return
      if (!accessToken || !refreshTokenValue) {
        setStatus('anonymous')
        if (!cancelled) setHydrated(true)
        return
      }

      try {
        if (isTokenExpired()) {
          const refreshed = await refreshAuth()
          await hydrateProfile(refreshed.accessToken)
        } else {
          setAuthToken(accessToken)
          await hydrateProfile(accessToken)
        }
      } catch (error) {
        console.error('Auth bootstrap failed', error)
        logout()
      } finally {
        if (!cancelled) setHydrated(true)
      }
    }

    bootstrap()

    return () => {
      cancelled = true
    }
  }, [accessToken, refreshTokenValue, isHydrated, isTokenExpired, refreshAuth, hydrateProfile, logout, setStatus])

  const roles = useMemo(() => {
    if (profile?.roles?.length) return profile.roles
    return accessToken ? extractRolesFromToken(accessToken) : []
  }, [profile?.roles, accessToken])

  const accountType = useMemo(() => profile?.accountType ?? inferAccountType(roles), [profile?.accountType, roles])

  const value = useMemo(
    () => ({
      status,
      profile,
      roles,
      accountType,
  ownerId: profile?.ownerId,
      isHydrated,
      accessToken,
      refreshToken: refreshTokenValue,
      isAuthenticated: status === 'authenticated',
      isLoading: !isHydrated || status === 'loading',
      login,
      logout,
      refreshAuth,
      hasRole: (role) => roles.includes(role),
    }),
    [status, profile, roles, accountType, isHydrated, accessToken, refreshTokenValue, login, logout, refreshAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

AuthProvider.propTypes = {
  children: PropTypes.node,
}

function normalizeTokenResponse(raw = {}) {
  return {
    accessToken: raw.access_token ?? raw.accessToken ?? null,
    refreshToken: raw.refresh_token ?? raw.refreshToken ?? null,
    expiresIn: raw.expires_in ?? raw.expiresIn ?? null,
    refreshExpiresIn: raw.refresh_expires_in ?? raw.refreshExpiresIn ?? null,
    tokenType: raw.token_type ?? raw.tokenType ?? 'Bearer',
    scope: raw.scope,
  }
}

function decodeJwtPayload(token) {
  try {
    const [, payloadPart] = token.split('.')
    if (!payloadPart) return null
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padding = normalized.length % 4
    const padded = padding ? `${normalized}${'='.repeat(4 - padding)}` : normalized
    const decoded = base64Decode(padded)
    return JSON.parse(decoded)
  } catch (error) {
    console.warn('Unable to decode token payload', error)
    return null
  }
}

function base64Decode(input) {
  if (typeof globalThis !== 'undefined' && typeof globalThis.atob === 'function') {
    return globalThis.atob(input)
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(input, 'base64').toString('binary')
  }
  throw new Error('No base64 decoder available in this environment')
}

function extractRolesFromToken(token) {
  const payload = decodeJwtPayload(token)
  if (!payload) return []
  const realmRoles = payload.realm_access?.roles ?? []
  const resourceRoles = Object.values(payload.resource_access ?? {}).flatMap((resource) => resource.roles ?? [])
  return Array.from(new Set([...realmRoles, ...resourceRoles]))
}

function inferAccountType(roles = []) {
  if (roles.includes('admin')) return 'admin'
  if (roles.some((role) => ['business', 'enterprise', 'company'].includes(role))) return 'business'
  return 'individual'
}