import type { ReactNode } from 'react'
import type { AuthUserDto } from '../types/auth'
import { APP_BASE } from './appPaths'

export type NavItem = {
  to: string
  label: string
  icon?: ReactNode
  /** Tanımlıysa yalnızca bu roller menüde görür; yoksa herkes. */
  roles?: AuthUserDto['role'][]
}

/** Ana menü — müvekkil/dosya/kasa akışı ana sayfa ve dosya detayı içindedir. */
export const SIDEBAR_NAV: NavItem[] = [
  { to: APP_BASE, label: 'Ana Sayfa' },
  { to: `${APP_BASE}/ofis-kasasi`, label: 'Ofis Kasası' },
  { to: `${APP_BASE}/raporlar`, label: 'Raporlar' },
  {
    to: `${APP_BASE}/kullanicilar`,
    label: 'Kullanıcılar',
    roles: ['BURO_SAHIBI', 'AVUKAT_YONETICI']
  },
  { to: `${APP_BASE}/ayarlar`, label: 'Ayarlar' }
]

export function sidebarNavForRole(role: AuthUserDto['role'] | undefined): NavItem[] {
  if (!role) return SIDEBAR_NAV
  return SIDEBAR_NAV.filter((item) => !item.roles || item.roles.includes(role))
}
