/** Masaüstü `vekalet.ts` taksit planı yardımcılarıyla uyumlu. */

export const TAKSIT_PLANI_TOLERANS = 0.005

export function yuvarlaTaksitToplam(tutarlar: number[]): number {
  return Math.round(tutarlar.reduce((s, t) => s + t, 0) * 100) / 100
}

export function hesaplaSabitTaksitPlani(taksitTutari: number, adet: number): number[] | null {
  if (!Number.isFinite(taksitTutari) || taksitTutari <= 0) return null
  if (!Number.isFinite(adet) || adet < 1 || adet > 120) return null
  const tutar = Math.round(taksitTutari * 100) / 100
  return Array.from({ length: adet }, () => tutar)
}

export type TaksitPlaniToplamDurum = 'UYGUN' | 'ASIYOR' | 'EKSIK' | 'GECERSIZ'

export function taksitPlaniToplamDurumu(kalan: number, toplam: number): TaksitPlaniToplamDurum {
  if (!Number.isFinite(toplam) || toplam <= 0) return 'GECERSIZ'
  const fark = Math.round((toplam - kalan) * 100) / 100
  if (fark > TAKSIT_PLANI_TOLERANS) return 'ASIYOR'
  if (fark < -TAKSIT_PLANI_TOLERANS) return 'EKSIK'
  return 'UYGUN'
}

export function taksitPlaniToplamMesaj(durum: TaksitPlaniToplamDurum): string | null {
  switch (durum) {
    case 'ASIYOR':
      return 'Yeni taksitlerin toplamı, taksitlendirilebilir kalan tutarı aşamaz.'
    case 'EKSIK':
      return 'Taksit toplamı kalan vekalet tutarından eksik.'
    case 'GECERSIZ':
      return 'Taksit toplamı kalan vekalet tutarıyla eşleşmiyor.'
    default:
      return null
  }
}

/** Kalan tutarı eşit taksitlere böler; yuvarlama farkı son taksite eklenir. */
export function bolKalanTaksitlereEsit(kalanTutar: number, adet: number): number[] | null {
  if (!Number.isFinite(kalanTutar) || kalanTutar <= 0) return null
  if (!Number.isFinite(adet) || adet < 1 || adet > 120) return null
  const baz = Math.floor((kalanTutar / adet) * 100) / 100
  const tutarlar = Array.from({ length: adet }, () => baz)
  const farkKurus = Math.round((kalanTutar - yuvarlaTaksitToplam(tutarlar)) * 100) / 100
  if (tutarlar.length > 0) {
    tutarlar[tutarlar.length - 1] = Math.round((tutarlar[tutarlar.length - 1] + farkKurus) * 100) / 100
  }
  return tutarlar
}

export function vadeEkleAyYmd(ymd: string, ay: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return ymd
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCMonth(dt.getUTCMonth() + ay)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function kurusBuyuktur(a: number, b: number): boolean {
  return Math.round(a * 100) > Math.round(b * 100)
}
