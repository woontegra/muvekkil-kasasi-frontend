import type { ReactElement, ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { APP_BASE } from '../../config/appPaths'
import { useAuth } from '../../contexts/AuthContext'
import type { AuthUserDto } from '../../types/auth'

type Props = {
  allow: AuthUserDto['role'][]
  children: ReactNode
}

/** Rol tabanlı route koruması — yetkisiz rol doğrudan URL girse bile ana sayfaya yönlenir. */
export function RoleRoute({ allow, children }: Props): ReactElement {
  const { session } = useAuth()
  const role = session?.user.role
  if (!role || !allow.includes(role)) {
    return <Navigate to={APP_BASE} replace />
  }
  return <>{children}</>
}
