import type { ReactNode } from 'react'
import type { AuthUserDto } from '../types/auth'
import { APP_BASE, HOME_PAGE_LABEL } from './appPaths'

export type NavItem = {
  to: string
  label: string
  icon?: ReactNode
  /** Tanımlıysa yalnızca bu roller menüde görür; yoksa herkes. */
  roles?: AuthUserDto['role'][]
}

/** Ana menü — müvekkil/dosya/kasa akışı ana sayfa ve dosya detayı içindedir. */
export const SIDEBAR_NAV: NavItem[] = [
  { to: APP_BASE, label: HOME_PAGE_LABEL },
  { to: `${APP_BASE}/ofis-kasasi`, label: 'Ofis Kasası' },
  { to: `${APP_BASE}/icra-tahsilat`, label: 'İcra Tahsilat' },
  { to: `${APP_BASE}/primler`, label: 'Primler', roles: ['BURO_SAHIBI'] },
  { to: `${APP_BASE}/raporlar`, label: 'Raporlar' },
  {
    to: `${APP_BASE}/kullanicilar`,
    label: 'Kullanıcılar',
    roles: ['BURO_SAHIBI', 'AVUKAT_YONETICI']
  },
  { to: `${APP_BASE}/ayarlar`, label: 'Ayarlar' }
]

/** Primler yalnızca büro sahibine açıktır (menü + route guard). İcra Tahsilat tüm rollere açıktır. */
export const BURO_SAHIBI_ONLY_PATHS: string[] = [
  `${APP_BASE}/primler`
]

export function sidebarNavForRole(role: AuthUserDto['role'] | undefined): NavItem[] {
  if (!role) return SIDEBAR_NAV
  return SIDEBAR_NAV.filter((item) => !item.roles || item.roles.includes(role))
}
