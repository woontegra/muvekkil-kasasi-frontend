/** Admin / büro listelerinde bitiş satırı: DEMO+demoMu iken demo bitişi öncelikli. */
export function tenantEffectiveLisansBitisTarihi(
  lisansBitisTarihi: string | null | undefined,
  lisansDurumu: string,
  demoMu: boolean,
  demoBitisTarihi: string | null | undefined
): string | null {
  if (lisansDurumu === 'DEMO' && demoMu && demoBitisTarihi) return demoBitisTarihi
  return lisansBitisTarihi ?? null
}

function dayStart(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Takvim günü farkı (bitiş günü başı − bugün başı). */
export function kalanGunFromIsoEnd(iso: string | null | undefined): number | null {
  if (!iso) return null
  const end = dayStart(new Date(iso))
  const today = dayStart(new Date())
  return Math.round((end.getTime() - today.getTime()) / 86_400_000)
}

export function lisansDurumuTr(d: string): string {
  switch (d) {
    case 'AKTIF':
      return 'Aktif'
    case 'DEMO':
      return 'Demo'
    case 'SURESI_DOLDU':
      return 'Süresi doldu'
    case 'PASIF':
      return 'Pasif'
    default:
      return d
  }
}

/** `YYYY-MM-DD` → o günün UTC gün sonu (ISO). API `bitisTarihi` ile uyumlu. */
export function dateInputToUtcEndOfDayIso(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return ymd
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999)).toISOString()
}
