export type AyarlarSectionId =
  | 'buro'
  | 'hesap-donemi'
  | 'kullanici'
  | 'veri'
  | 'denetim'
  | 'lisans'
  | 'sistem'

export type AyarlarNavItem = { id: AyarlarSectionId; label: string }

export function buildAyarlarNavItems(opts: {
  isBuroSahibi: boolean
  isYonetici: boolean
  canViewAudit: boolean
}): AyarlarNavItem[] {
  const items: AyarlarNavItem[] = [
    { id: 'buro', label: 'Büro Bilgileri' }
  ]

  if (opts.isYonetici) {
    items.push({ id: 'hesap-donemi', label: 'Hesap Dönemi' })
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

export function isAyarlarSectionAllowed(
  id: AyarlarSectionId,
  opts: { isBuroSahibi: boolean; isYonetici: boolean; canViewAudit: boolean }
): boolean {
  if (id === 'hesap-donemi') return opts.isYonetici
  if (id === 'veri') return opts.isBuroSahibi
  if (id === 'denetim') return opts.canViewAudit
  return true
}

export function firstAllowedSection(opts: {
  isBuroSahibi: boolean
  isYonetici: boolean
  canViewAudit: boolean
}): AyarlarSectionId {
  const items = buildAyarlarNavItems(opts)
  return items[0]?.id ?? 'buro'
}
