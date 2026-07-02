import type { PrimHesaplamaTipiApi, PrimKuralKapsamApi } from '../../types/prim'

export const PRIM_AYLAR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık'
] as const

export function primDonemLabel(yil: number, ay: number): string {
  return `${PRIM_AYLAR[ay - 1] ?? ay} ${yil}`
}

export function hesaplamaTipiLabel(t: PrimHesaplamaTipiApi | null | undefined): string {
  if (t === 'TOTAL_BRACKET') return 'Toplam tutara tek oran'
  if (t === 'PROGRESSIVE') return 'Kademeli dilim'
  return '—'
}

export function kapsamLabel(k: PrimKuralKapsamApi): string {
  return k === 'TENANT_DEFAULT' ? 'Büro varsayılan' : 'Personel özel'
}

export function kaynakLabel(k: string): string {
  switch (k) {
    case 'DOSYA_AVANS':
      return 'Dosya avans'
    case 'VEKALET':
      return 'Vekalet tahsilatı'
    case 'OFIS_GELIR':
      return 'Manuel ofis geliri'
    case 'ICRA':
      return 'İcra tahsilatı'
    default:
      return k
  }
}

export function onayDurumuLabel(d: string): string {
  switch (d) {
    case 'ONAYLI':
      return 'Onaylı'
    case 'ONAYSIZ':
      return 'Onay bekliyor'
    case 'REDDEDILDI':
      return 'Reddedildi'
    default:
      return d
  }
}

export function formatKademeOzet(min: string, max: string | null, oran: string): string {
  const minN = Number(min)
  const maxN = max != null ? Number(max) : null
  const minTxt = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(minN)
  if (maxN == null) return `${minTxt}+ = %${Number(oran)}`
  const maxTxt = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(maxN)
  return `${minTxt}–${maxTxt} = %${Number(oran)}`
}
