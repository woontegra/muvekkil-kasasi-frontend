import type { ReactElement, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdminAuth } from '../contexts/AdminAuthContext'

export function AdminAuthGate({ children }: { children: ReactNode }): ReactElement {
  const { loading, isAuthenticated } = useAdminAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-ink-muted">
        Admin oturumu doğrulanıyor…
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
