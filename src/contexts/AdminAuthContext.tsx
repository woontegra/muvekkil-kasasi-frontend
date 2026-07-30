import type { ReactElement, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { adminLoginRequest, adminMeRequest } from '../api/adminApi'
import {
  adminApiFetch,
  getAdminAccessToken,
  purgeLegacyAdminAccessTokenStorage,
  setAdminAccessToken
} from '../api/adminClient'
import { getAccessToken } from '../api/accessTokenMemory'
import { joinApiUrl } from '../api/apiBase'
import { refreshAdminAccessTokenOnce } from '../api/refreshAdminAccess'
import type { AdminUserDto } from '../types/admin'
import { useAuth } from './AuthContext'
import { subscribeAdminSessionEvents } from './adminSessionEvents'

type AdminAuthContextValue = {
  admin: AdminUserDto | null
  loading: boolean
  isAuthenticated: boolean
  login: (identifier: string, sifre: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
  /** Tenant oturumu + linkedUserId ile admin oturumu aç (parolasız). */
  elevateFromTenant: () => Promise<boolean>
  applyAdminSession: (adminAccessToken: string, adminUser: AdminUserDto) => void
  clearAdminSession: () => void
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }): ReactElement {
  const { isAuthenticated: tenantAuthed, loading: tenantLoading } = useAuth()
  const [admin, setAdmin] = useState<AdminUserDto | null>(null)
  const [loading, setLoading] = useState(true)

  const clearAdminSession = useCallback(() => {
    setAdminAccessToken(null)
    setAdmin(null)
  }, [])

  const applyAdminSession = useCallback((adminAccessToken: string, adminUser: AdminUserDto) => {
    setAdminAccessToken(adminAccessToken)
    setAdmin(adminUser)
  }, [])

  const refreshMe = useCallback(async () => {
    const r = await adminMeRequest()
    setAdmin(r.adminUser)
  }, [])

  const elevateFromTenant = useCallback(async (): Promise<boolean> => {
    const tenantToken = getAccessToken()
    if (!tenantToken) return false
    try {
      const res = await fetch(joinApiUrl('/api/v1/admin/auth/elevate-from-tenant'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tenantToken}`
        }
      })
      if (!res.ok) return false
      const body = (await res.json()) as { adminAccessToken?: string; adminUser?: AdminUserDto }
      if (!body.adminAccessToken || !body.adminUser || body.adminUser.rol !== 'SUPER_ADMIN') {
        return false
      }
      applyAdminSession(body.adminAccessToken, body.adminUser)
      return true
    } catch {
      return false
    }
  }, [applyAdminSession])

  useEffect(() => {
    return subscribeAdminSessionEvents({
      onApply: (token, user) => {
        if (user.rol === 'SUPER_ADMIN' && user.aktifMi) applyAdminSession(token, user)
        else clearAdminSession()
      },
      onClear: () => clearAdminSession()
    })
  }, [applyAdminSession, clearAdminSession])

  useEffect(() => {
    purgeLegacyAdminAccessTokenStorage()
    let cancelled = false
    async function boot(): Promise<void> {
      try {
        if (!getAdminAccessToken()) {
          const token = await refreshAdminAccessTokenOnce()
          if (!token) {
            if (getAccessToken()) {
              const ok = await elevateFromTenant()
              if (!cancelled && !ok) setAdmin(null)
            } else if (!cancelled) {
              setAdmin(null)
            }
            if (!cancelled) setLoading(false)
            return
          }
        }
        const r = await adminMeRequest()
        if (!cancelled) {
          if (r.adminUser.rol === 'SUPER_ADMIN' && r.adminUser.aktifMi) {
            setAdmin(r.adminUser)
          } else {
            clearAdminSession()
          }
        }
      } catch {
        if (getAccessToken()) {
          const ok = await elevateFromTenant()
          if (!cancelled && !ok) clearAdminSession()
        } else if (!cancelled) {
          clearAdminSession()
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [clearAdminSession, elevateFromTenant])

  // Sayfa yenilemede tenant oturumu admin’den sonra hazır olursa sessiz elevate.
  useEffect(() => {
    if (tenantLoading || loading) return
    if (!tenantAuthed) return
    if (admin?.rol === 'SUPER_ADMIN' && admin.aktifMi) return
    void elevateFromTenant()
  }, [tenantLoading, loading, tenantAuthed, admin, elevateFromTenant])

  const login = useCallback(async (identifier: string, sifre: string) => {
    const r = await adminLoginRequest(identifier, sifre)
    if (r.adminUser.rol !== 'SUPER_ADMIN') {
      clearAdminSession()
      throw new Error('Yalnızca SUPER_ADMIN platform paneline girebilir.')
    }
    applyAdminSession(r.adminAccessToken, r.adminUser)
  }, [applyAdminSession, clearAdminSession])

  const logout = useCallback(() => {
    void adminApiFetch('/api/v1/admin/auth/logout', { method: 'POST' })
      .catch(() => undefined)
      .finally(() => {
        clearAdminSession()
      })
  }, [clearAdminSession])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      admin,
      loading,
      isAuthenticated: !!admin && admin.rol === 'SUPER_ADMIN',
      login,
      logout,
      refreshMe,
      elevateFromTenant,
      applyAdminSession,
      clearAdminSession
    }),
    [admin, loading, login, logout, refreshMe, elevateFromTenant, applyAdminSession, clearAdminSession]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth: AdminAuthProvider eksik')
  return ctx
}
