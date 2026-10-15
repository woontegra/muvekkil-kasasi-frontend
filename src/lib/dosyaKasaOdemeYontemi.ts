import type { OdemeYontemiApi } from '../types/kasa'

/** Dosya kasası Masraf Girişi ödeme yöntemleri; Barokart yalnız burada seçilebilir. */
export const MASRAF_ODEME_OPTIONS: { value: OdemeYontemiApi; label: string }[] = [
  { value: 'NAKIT', label: 'Nakit' },
  { value: 'BANKA', label: 'Banka' },
  { value: 'KREDI_KARTI', label: 'Kredi kartı' },
  { value: 'BAROKART', label: 'Barokart' },
  { value: 'DIGER', label: 'Diğer' }
]

export function dosyaKasaOdemeLabel(v: OdemeYontemiApi | null): string {
  if (!v) return '—'
  return MASRAF_ODEME_OPTIONS.find((o) => o.value === v)?.label ?? v
}
