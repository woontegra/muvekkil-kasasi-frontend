import type { AuthUserDto } from '../../types/auth'
import { isBuroSahibiRole } from '../../lib/isBuroSahibi'
import { isYoneticiRole } from '../../lib/isYonetici'

export type AyarlarSectionId =
  | 'buro'
  | 'hesap-donemi'
  | 'whatsapp'
  | 'kullanici'
  | 'veri'
  | 'denetim'
  | 'lisans'
  | 'sistem'

export type AyarlarNavItem = { id: AyarlarSectionId; label: string }

/**
 * Ayarlar erişimi yalnızca tenant `user.role` üzerinden hesaplanır.
 * Platform SUPER_ADMIN / admin oturumu bu seti daraltmaz veya genişletmez.
 */
export type AyarlarAccess = {
  isBuroSahibi: boolean
  isYonetici: boolean
  canViewAudit: boolean
  /** Tüm tenant rollerinde WhatsApp sekmesi görünür (KATIP salt okunur). */
  canViewWhatsApp: boolean
  /** Bağlantı / Embedded Signup yönetimi. */
  canManageWhatsApp: boolean
}

export function isTenantUserRole(role: string | undefined | null): role is AuthUserDto['role'] {
  return role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI' || role === 'KATIP_PERSONEL'
}

/** Tek kaynak: tenant rolü. Admin/platform rolü parametre olarak alınmaz. */
export function resolveAyarlarAccess(tenantRole: AuthUserDto['role'] | undefined): AyarlarAccess {
  const isBuroSahibi = isBuroSahibiRole(tenantRole)
  const isYonetici = isYoneticiRole(tenantRole)
  const canViewWhatsApp = isTenantUserRole(tenantRole)
  return {
    isBuroSahibi,
    isYonetici,
    canViewAudit: isYonetici,
    canViewWhatsApp,
    canManageWhatsApp: isYonetici
  }
}

export function buildAyarlarNavItems(opts: AyarlarAccess): AyarlarNavItem[] {
  const items: AyarlarNavItem[] = [{ id: 'buro', label: 'Büro Bilgileri' }]

  if (opts.isYonetici) {
    items.push({ id: 'hesap-donemi', label: 'Hesap Dönemi' })
  }

  // Platform admin bayrağı yok — yalnızca tenant WhatsApp görünürlüğü.
  if (opts.canViewWhatsApp) {
    items.push({ id: 'whatsapp', label: 'WhatsApp' })
  }

  items.push({ id: 'kullanici', label: 'Kullanıcı & Güvenlik' })

  if (opts.isBuroSahibi) {
    items.push({ id: 'veri', label: 'Veri Aktarımı' })
  }

  if (opts.canViewAudit) {
    items.push({ id: 'denetim', label: 'Denetim Kayıtları' })
  }

  items.push(
    { id: 'lisans', label: 'Lisans & Kullanım' },
    { id: 'sistem', label: 'Sistem Bilgisi' }
  )

  return items
}

export function isAyarlarSectionAllowed(id: AyarlarSectionId, opts: AyarlarAccess): boolean {
  if (id === 'hesap-donemi') return opts.isYonetici
  if (id === 'whatsapp') return opts.canViewWhatsApp
  if (id === 'veri') return opts.isBuroSahibi
  if (id === 'denetim') return opts.canViewAudit
  return true
}

export function firstAllowedSection(opts: AyarlarAccess): AyarlarSectionId {
  const items = buildAyarlarNavItems(opts)
  return items[0]?.id ?? 'buro'
}
