import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const initialState = {
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  profile: null,
  status: 'idle',
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      setTokens: ({ accessToken, refreshToken, expiresIn, refreshExpiresIn }) => {
        const tokenExpiresAt = expiresIn ? Date.now() + expiresIn * 1000 : null
        const refreshTokenExpiresAt = refreshExpiresIn ? Date.now() + refreshExpiresIn * 1000 : null
        set({ accessToken, refreshToken, tokenExpiresAt, refreshTokenExpiresAt })
      },
      clearSession: () => set({ ...initialState }),
      setProfile: (profile) => set({ profile }),
      setStatus: (status) => set({ status }),
      isTokenExpired: () => {
        const expiresAt = get().tokenExpiresAt
        if (!expiresAt) return false
        return Date.now() > expiresAt - 5_000
      },
      isRefreshTokenExpired: () => {
        const expiresAt = get().refreshTokenExpiresAt
        if (!expiresAt) return false
        return Date.now() > expiresAt - 5_000
      },
      hasValidSession: () => {
        const { accessToken, refreshToken } = get()
        return Boolean(accessToken && refreshToken && !get().isTokenExpired())
      },
    }),
    {
      name: 'darna-auth-store',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
        refreshTokenExpiresAt: state.refreshTokenExpiresAt,
        profile: state.profile,
      }),
    },
  ),
)

export function getAccessToken() {
  return useAuthStore.getState().accessToken
}

export function getRefreshToken() {
  return useAuthStore.getState().refreshToken
}

export function setAuthTokens(payload) {
  useAuthStore.getState().setTokens(payload)
}

export function clearAuthSession() {
  useAuthStore.getState().clearSession()
}

export function setAuthProfile(profile) {
  useAuthStore.getState().setProfile(profile)
}
