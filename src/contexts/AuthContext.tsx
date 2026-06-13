import type { ReactElement, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, getAccessToken, setAccessToken } from '../api/client'
import type { AuthLoginResponse, AuthSession, MeResponse } from '../types/auth'

type AuthContextValue = {
  session: AuthSession | null
  loading: boolean
  isAuthenticated: boolean
  login: (input: { identifier: string; sifre: string }) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applyAuthPayload(payload: AuthLoginResponse): void {
  setAccessToken(payload.accessToken)
}

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [session, setSession] = useState<AuthSession | null>(null)
  /** Yalnızca kayıtlı token varken /me beklenirken true; token yoksa ilk pikselden false (public auth flicker olmaz). */
  const [loading, setLoading] = useState(() => !!getAccessToken())

  const refreshMe = useCallback(async () => {
    const r = await apiFetch<MeResponse>('/api/v1/me')
    if (r.ok) {
      setSession({ user: r.user, tenant: r.tenant })
    }
  }, [])

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
          setSession({ user: r.user, tenant: r.tenant })
        }
      } catch {
        setAccessToken(null)
        if (!cancelled) setSession(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (input: { identifier: string; sifre: string }) => {
    const r = await apiFetch<AuthLoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: input.identifier.trim(),
        sifre: input.sifre
      })
    })
    applyAuthPayload(r)
    setSession({ user: r.user, tenant: r.tenant })
  }, [])

  const logout = useCallback(() => {
    void apiFetch<{ ok: boolean }>('/api/v1/auth/logout', { method: 'POST' })
      .catch(() => undefined)
      .finally(() => {
        setAccessToken(null)
        setSession(null)
      })
  }, [])

  const value = useMemo(
    () => ({
      session,
      loading,
      isAuthenticated: !!session,
      login,
      logout,
      refreshMe
    }),
    [session, loading, login, logout, refreshMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth: AuthProvider eksik')
  return ctx
}
