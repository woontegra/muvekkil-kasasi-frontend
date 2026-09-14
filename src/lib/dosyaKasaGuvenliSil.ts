import type { AuthUserDto } from '../types/auth'
import type { KasaHareketTipiApi, KasaOnayDurumuApi } from '../types/kasa'
import { isBuroSahibiRole } from './isBuroSahibi'

export type DosyaKasaGuvenliSilMode = 'AVANS_SIL' | 'MASRAF_SIL'

export function resolveDosyaKasaGuvenliSilMode(
  tip: KasaHareketTipiApi
): DosyaKasaGuvenliSilMode | null {
  if (tip === 'AVANS_GIRISI') return 'AVANS_SIL'
  if (tip === 'MASRAF') return 'MASRAF_SIL'
  return null
}

/** Onaylı avans/masraf — yalnız BURO_SAHIBI güvenli Sil. */
export function canShowDosyaKasaGuvenliSil(opts: {
  role: AuthUserDto['role'] | undefined
  tip: KasaHareketTipiApi
  onayDurumu?: KasaOnayDurumuApi
  deletedAt?: string | null
}): boolean {
  if (!isBuroSahibiRole(opts.role)) return false
  if (opts.deletedAt) return false
  return resolveDosyaKasaGuvenliSilMode(opts.tip) != null
}

export function dosyaKasaGuvenliSilModalTitle(mode: DosyaKasaGuvenliSilMode): string {
  return mode === 'AVANS_SIL' ? 'Avansı sil' : 'Masrafı sil'
}

export function canShowDosyaKasaDuzeltme(opts: {
  onayDurumu: KasaOnayDurumuApi
  tip: KasaHareketTipiApi
}): boolean {
  return opts.onayDurumu === 'ONAYLI' && opts.tip !== 'DUZELTME'
}
