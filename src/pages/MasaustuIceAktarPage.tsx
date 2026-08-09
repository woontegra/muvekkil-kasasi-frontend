import type { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'

/** Eski doğrudan URL — Ayarlar → Veri Aktarımı akışına yönlendirir. */
export function MasaustuIceAktarPage(): ReactElement {
  return <Navigate to={`${APP_BASE}/ayarlar?bolum=veri`} replace />
}
