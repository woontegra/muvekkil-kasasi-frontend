import type { ReactElement, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, getAccessToken, setAccessToken } from '../api/client'
import type { AuthLoginResponse, AuthOnboardingState, AuthSession, MeResponse } from '../types/auth'

type AuthContextValue = {
  session: AuthSession | null
  onboarding: AuthOnboardingState
  loading: boolean
  isAuthenticated: boolean
  login: (input: { identifier: string; sifre: string }) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
  applyOnboardingSession: (payload: MeResponse | AuthLoginResponse) => void
}

const defaultOnboarding: AuthOnboardingState = {
  requiresLicenseActivation: false,
  mustChangePassword: false
}

const AuthContext = createContext<AuthContextValue | null>(null)

function extractOnboarding(payload: AuthOnboardingState): AuthOnboardingState {
  return {
    requiresLicenseActivation: payload.requiresLicenseActivation === true,
    mustChangePassword: payload.mustChangePassword === true
  }
}

function applyAuthPayload(payload: AuthLoginResponse): void {
  setAccessToken(payload.accessToken)
}

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [onboarding, setOnboarding] = useState<AuthOnboardingState>(defaultOnboarding)
  /** Yalnızca kayıtlı token varken /me beklenirken true; token yoksa ilk pikselden false (public auth flicker olmaz). */
  const [loading, setLoading] = useState(() => !!getAccessToken())

  const applyOnboardingSession = useCallback((payload: MeResponse | AuthLoginResponse) => {
    setSession({ user: payload.user, tenant: payload.tenant })
    setOnboarding(extractOnboarding(payload))
  }, [])

  const refreshMe = useCallback(async () => {
    const r = await apiFetch<MeResponse>('/api/v1/me')
    if (r.ok) {
      applyOnboardingSession(r)
    }
  }, [applyOnboardingSession])

  useEffect(() => {
    let cancelled = false
    async function bootstrap(): Promise<void> {
      const token = getAccessToken()
      if (!token) {
        if (!cancelled) setLoading(false)
        return
      }
      try {
        const r = await apiFetch<MeResponse>('/api/v1/me')
        if (!cancelled && r.ok) {
          applyOnboardingSession(r)
        }
      } catch {
        setAccessToken(null)
        if (!cancelled) {
          setSession(null)
          setOnboarding(defaultOnboarding)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [applyOnboardingSession])

  const login = useCallback(
    async (input: { identifier: string; sifre: string }) => {
      const r = await apiFetch<AuthLoginResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: input.identifier.trim(),
          sifre: input.sifre
        })
      })
      applyAuthPayload(r)
      applyOnboardingSession(r)
    },
    [applyOnboardingSession]
  )

  const logout = useCallback(() => {
    void apiFetch<{ ok: boolean }>('/api/v1/auth/logout', { method: 'POST' })
      .catch(() => undefined)
      .finally(() => {
        setAccessToken(null)
        setSession(null)
        setOnboarding(defaultOnboarding)
      })
  }, [])

  const value = useMemo(
    () => ({
      session,
      onboarding,
      loading,
      isAuthenticated: !!session,
      login,
      logout,
      refreshMe,
      applyOnboardingSession
    }),
    [session, onboarding, loading, login, logout, refreshMe, applyOnboardingSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth: AuthProvider eksik')
  return ctx
}
