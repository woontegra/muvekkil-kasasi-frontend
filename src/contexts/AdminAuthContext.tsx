import type { ReactElement, ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { adminLoginRequest, adminMeRequest } from '../api/adminApi'
import { adminApiFetch, getAdminAccessToken, setAdminAccessToken } from '../api/adminClient'
import type { AdminUserDto } from '../types/admin'

type AdminAuthContextValue = {
  admin: AdminUserDto | null
  loading: boolean
  isAuthenticated: boolean
  login: (identifier: string, sifre: string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [admin, setAdmin] = useState<AdminUserDto | null>(null)
  const [loading, setLoading] = useState(() => !!getAdminAccessToken())

  const refreshMe = useCallback(async () => {
    const r = await adminMeRequest()
    setAdmin(r.adminUser)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot(): Promise<void> {
      const t = getAdminAccessToken()
      if (!t) {
        if (!cancelled) setLoading(false)
        return
      }
      try {
        const r = await adminMeRequest()
        if (!cancelled) setAdmin(r.adminUser)
      } catch {
        setAdminAccessToken(null)
        if (!cancelled) setAdmin(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void boot()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (identifier: string, sifre: string) => {
    const r = await adminLoginRequest(identifier, sifre)
    setAdminAccessToken(r.adminAccessToken)
    setAdmin(r.adminUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await adminApiFetch('/api/v1/admin/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    setAdminAccessToken(null)
    setAdmin(null)
  }, [])

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      admin,
      loading,
      isAuthenticated: !!admin,
      login,
      logout,
      refreshMe
    }),
    [admin, loading, login, logout, refreshMe]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth: AdminAuthProvider eksik')
  return ctx
}
