import type { ReactNode } from 'react'
import type { AuthUserDto } from '../types/auth'
import { NavIcons } from '../components/shell/navIcons'
import { APP_BASE, HOME_PAGE_LABEL } from './appPaths'

export type NavGroupId = 'kasa' | 'tahsilat' | 'yonetim'

export type NavItem = {
  to: string
  label: string
  icon?: ReactNode
  group?: NavGroupId
  /** Tanımlıysa yalnızca bu roller menüde görür; yoksa herkes. */
  roles?: AuthUserDto['role'][]
}

export const NAV_GROUP_LABELS: Record<NavGroupId, string> = {
  kasa: 'Kasa & Müvekkil',
  tahsilat: 'Tahsilat',
  yonetim: 'Yönetim'
}

/** Ana menü — müvekkil/dosya/kasa akışı ana sayfa ve dosya detayı içindedir. */
export const SIDEBAR_NAV: NavItem[] = [
  { to: APP_BASE, label: HOME_PAGE_LABEL, icon: NavIcons.muvekkil(), group: 'kasa' },
  { to: `${APP_BASE}/randevular`, label: 'Randevular', icon: NavIcons.randevu(), group: 'kasa' },
  { to: `${APP_BASE}/ofis-kasasi`, label: 'Ofis Kasası', icon: NavIcons.ofis(), group: 'kasa' },
  { to: `${APP_BASE}/icra-tahsilat`, label: 'İcra Tahsilat', icon: NavIcons.icra(), group: 'tahsilat' },
  { to: `${APP_BASE}/tahsilat-merkezi`, label: 'Tahsilat Takibi', icon: NavIcons.tahsilat(), group: 'tahsilat' },
  { to: `${APP_BASE}/bildirim-merkezi`, label: 'Bildirim Merkezi', icon: NavIcons.bildirim(), group: 'tahsilat' },
  { to: `${APP_BASE}/primler`, label: 'Primler', icon: NavIcons.prim(), group: 'yonetim', roles: ['BURO_SAHIBI'] },
  { to: `${APP_BASE}/raporlar`, label: 'Raporlar', icon: NavIcons.rapor(), group: 'yonetim' },
  {
    to: `${APP_BASE}/kullanicilar`,
    label: 'Kullanıcılar',
    icon: NavIcons.kullanici(),
    group: 'yonetim',
    roles: ['BURO_SAHIBI', 'AVUKAT_YONETICI']
  },
  { to: `${APP_BASE}/ayarlar`, label: 'Ayarlar', icon: NavIcons.ayar(), group: 'yonetim' }
]

/** Primler yalnızca büro sahibine açıktır (menü + route guard). İcra Tahsilat tüm rollere açıktır. */
export const BURO_SAHIBI_ONLY_PATHS: string[] = [`${APP_BASE}/primler`]

export function sidebarNavForRole(role: AuthUserDto['role'] | undefined): NavItem[] {
  if (!role) return SIDEBAR_NAV
  return SIDEBAR_NAV.filter((item) => !item.roles || item.roles.includes(role))
}
