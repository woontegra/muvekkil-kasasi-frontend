import type { ReactElement, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { isSuperAdminRole } from '../../lib/adminRoles'

export function AdminSuperRoute({ children }: { children: ReactNode }): ReactElement {
  const { admin, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-ink-muted">
        Yükleniyor…
      </div>
    )
  }

  if (!isSuperAdminRole(admin?.rol)) {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
