import type { DosyaDurumuApi, DosyaDto, DosyaTuruApi } from '../types/dosya'

export function dosyaTuruLabel(t: DosyaTuruApi): string {
  switch (t) {
    case 'DAVA':
      return 'Dava'
    case 'ICRA':
      return 'İcra'
    case 'DANISMANLIK':
      return 'Danışmanlık'
    case 'DIGER':
      return 'Diğer'
    default:
      return t
  }
}

export function dosyaDurumuLabel(d: DosyaDurumuApi): string {
  switch (d) {
    case 'AKTIF':
      return 'Aktif'
    case 'PASIF':
      return 'Pasif'
    case 'KAPANDI':
      return 'Kapandı'
    case 'ARSIV':
      return 'Arşiv'
    default:
      return d
  }
}

export function dosyaDurumuBadgeVariant(d: DosyaDurumuApi): 'success' | 'warning' | 'default' | 'accent' {
  if (d === 'AKTIF') return 'success'
  if (d === 'PASIF') return 'warning'
  if (d === 'KAPANDI') return 'default'
  return 'accent'
}

export function mahkemeIcraSatir(dosya: DosyaDto): string {
  const m = dosya.mahkeme?.trim()
  const i = dosya.icraDairesi?.trim()
  if (m && i) return `${m} · ${i}`
  if (m) return m
  if (i) return i
  return '—'
}
