import type { ReactElement, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, getAccessToken, setAccessToken } from '../api/client'
import type { AuthLoginResponse, AuthSession, MeResponse } from '../types/auth'

type AuthContextValue = {
  session: AuthSession | null
  loading: boolean
  isAuthenticated: boolean
  login: (input: { epostaVeyaKullaniciAdi: string; tenantSlug?: string; sifre: string }) => Promise<void>
  registerOffice: (input: {
    buroAdi: string
    adSoyad: string
    kullaniciAdi: string
    eposta: string
    telefon: string
    sifre: string
  }) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function applyAuthPayload(payload: AuthLoginResponse): void {
  setAccessToken(payload.accessToken)
}

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [session, setSession] = useState<AuthSession | null>(null)
  const [loading, setLoading] = useState(true)

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

  const login = useCallback(async (input: { epostaVeyaKullaniciAdi: string; tenantSlug?: string; sifre: string }) => {
    const raw = input.epostaVeyaKullaniciAdi.trim()
    const isEmail = raw.includes('@')
    const body: Record<string, string> = {
      epostaVeyaKullaniciAdi: raw,
      sifre: input.sifre
    }
    if (!isEmail && input.tenantSlug?.trim()) {
      body.tenantSlug = input.tenantSlug.trim().toLowerCase()
    }
    const r = await apiFetch<AuthLoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(body)
    })
    applyAuthPayload(r)
    setSession({ user: r.user, tenant: r.tenant })
  }, [])

  const registerOffice = useCallback(
    async (input: {
      buroAdi: string
      adSoyad: string
      kullaniciAdi: string
      eposta: string
      telefon: string
      sifre: string
    }) => {
      const r = await apiFetch<AuthLoginResponse>('/api/v1/auth/register-office', {
        method: 'POST',
        body: JSON.stringify(input)
      })
      applyAuthPayload(r)
      setSession({ user: r.user, tenant: r.tenant })
    },
    []
  )

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
      registerOffice,
      logout,
      refreshMe
    }),
    [session, loading, login, registerOffice, logout, refreshMe]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth: AuthProvider eksik')
  return ctx
}
