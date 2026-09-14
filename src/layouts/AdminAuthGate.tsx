import type { ReactElement, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { refreshAdminAccessTokenOnce } from '../api/refreshAdminAccess'
import { adminMeRequest } from '../api/adminApi'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { isPlatformAdminRole } from '../lib/adminRoles'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../toast'

/**
 * Ürün akışında /admin/login’e yönlendirmez.
 * Tenant oturumu + linked SuperAdmin varsa: önce cookie refresh, sonra elevate.
 * Normal BURO_SAHIBI için elevate 403 → ana uygulamaya dönüş (beklenen).
 */
export function AdminAuthGate({ children }: { children: ReactNode }): ReactElement {
  const navigate = useNavigate()
  const toast = useToast()
  const { session, loading: tenantLoading } = useAuth()
  const { admin, loading: adminLoading, elevateFromTenant, isAuthenticated, applyAdminSession, clearAdminSession } =
    useAdminAuth()
  const [resolving, setResolving] = useState(true)
  const tried = useRef(false)

  useEffect(() => {
    if (tenantLoading || adminLoading) return
    if (isAuthenticated) {
      setResolving(false)
      return
    }
    if (!session) {
      setResolving(false)
      return
    }
    if (tried.current) {
      setResolving(false)
      return
    }
    tried.current = true
    void (async () => {
      const refreshed = await refreshAdminAccessTokenOnce()
      if (refreshed) {
        try {
          const me = await adminMeRequest()
          if (me.adminUser?.aktifMi && isPlatformAdminRole(me.adminUser.rol)) {
            applyAdminSession(refreshed, me.adminUser)
            setResolving(false)
            return
          }
        } catch {
          clearAdminSession()
        }
      }
      const ok = await elevateFromTenant()
      if (!ok) {
        toast.error({
          title: 'Admin oturumunuz doğrulanamadı',
          description: 'Platform yönetim paneline erişim için yetkiniz yok veya oturum açılamadı.'
        })
        navigate(APP_BASE, { replace: true })
      }
      setResolving(false)
    })()
  }, [
    tenantLoading,
    adminLoading,
    isAuthenticated,
    session,
    elevateFromTenant,
    applyAdminSession,
    clearAdminSession,
    navigate,
    toast
  ])

  if (tenantLoading || adminLoading || resolving) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-ink-muted">
        Admin oturumu doğrulanıyor…
      </div>
    )
  }

  if (!isAuthenticated || !admin?.aktifMi || !isPlatformAdminRole(admin.rol)) {
    return <Navigate to={APP_BASE} replace />
  }

  return <>{children}</>
}
