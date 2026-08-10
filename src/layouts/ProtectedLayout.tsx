import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { FirstLoginOnboarding } from '../components/auth/FirstLoginOnboarding'
import { useAuth } from '../contexts/AuthContext'
import { DashboardShell } from './DashboardShell'

export function ProtectedLayout(): ReactElement {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm font-medium text-ink-muted">
        Oturum doğrulanıyor…
      </div>
    )
  }

  if (!session) {
    const returnTo = `${location.pathname}${location.search}`
    return <Navigate to={`/login?return=${encodeURIComponent(returnTo)}`} replace />
  }

  return (
    <FirstLoginOnboarding>
      <DashboardShell />
    </FirstLoginOnboarding>
  )
}
