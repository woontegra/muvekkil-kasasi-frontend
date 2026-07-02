import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { FirstLoginOnboarding } from '../components/auth/FirstLoginOnboarding'
import { useAuth } from '../contexts/AuthContext'
import { DashboardShell } from './DashboardShell'

export function ProtectedLayout(): ReactElement {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm font-medium text-ink-muted">
        Oturum doğrulanıyor…
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <FirstLoginOnboarding>
      <DashboardShell />
    </FirstLoginOnboarding>
  )
}
