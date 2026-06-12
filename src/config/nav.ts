import type { ReactNode } from 'react'
import { APP_BASE } from './appPaths'

export type NavItem = {
  to: string
  label: string
  icon?: ReactNode
}

/** Ana menü — müvekkil/dosya/kasa akışı ana sayfa ve dosya detayı içindedir. */
export const SIDEBAR_NAV: NavItem[] = [
  { to: APP_BASE, label: 'Ana Sayfa' },
  { to: `${APP_BASE}/ofis-kasasi`, label: 'Ofis Kasası' },
  { to: `${APP_BASE}/raporlar`, label: 'Raporlar' },
  { to: `${APP_BASE}/kullanicilar`, label: 'Kullanıcılar' },
  { to: `${APP_BASE}/ayarlar`, label: 'Ayarlar' }
]
