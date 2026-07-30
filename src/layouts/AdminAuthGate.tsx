import type { ReactElement, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../toast'

/**
 * Ürün akışında /admin/login’e yönlendirmez.
 * Tenant oturumu + linked SuperAdmin varsa sessiz elevate / cookie refresh.
 */
export function AdminAuthGate({ children }: { children: ReactNode }): ReactElement {
  const navigate = useNavigate()
  const toast = useToast()
  const { session, loading: tenantLoading } = useAuth()
  const { admin, loading: adminLoading, elevateFromTenant, isAuthenticated } = useAdminAuth()
  const [resolving, setResolving] = useState(true)
  const triedElevate = useRef(false)

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
    if (triedElevate.current) {
      setResolving(false)
      return
    }
    triedElevate.current = true
    void (async () => {
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
  }, [tenantLoading, adminLoading, isAuthenticated, session, elevateFromTenant, navigate, toast])

  if (tenantLoading || adminLoading || resolving) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-ink-muted">
        Admin oturumu doğrulanıyor…
      </div>
    )
  }

  if (!isAuthenticated || admin?.rol !== 'SUPER_ADMIN') {
    return <Navigate to={APP_BASE} replace />
  }

  return <>{children}</>
}
