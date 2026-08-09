import type { ReactElement } from 'react'
import { Outlet } from 'react-router-dom'
import { PremiumAuthHero } from '../components/auth/PremiumAuthHero'

export function PublicAuthLayout(): ReactElement {
  return (
    <div className="pm-auth-page pm-auth-page--enter">
      <PremiumAuthHero />
      <div className="pm-auth-form-panel">
        <div className="pm-auth-form-wrap">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
