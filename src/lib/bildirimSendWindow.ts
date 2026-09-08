/**
 * Europe/Istanbul — backend sendWindow ile aynı kurallar.
 * Sabit 10:00–20:00 engeli yok; 00:00–23:59 seçilebilir.
 * Öneri (placeholder): 09:00–20:00.
 */

export const BILDIRIM_ONERI_BASLANGIC_DK = 540 // 09:00
export const BILDIRIM_ONERI_BITIS_DK = 1200 // 20:00 hariç

export const BILDIRIM_GUN_BASLANGIC_DK = 0
export const BILDIRIM_GUN_BITIS_EXCLUSIVE_DK = 1440

export const BILDIRIM_GONDERIM_MIN_DK = 0
export const BILDIRIM_GONDERIM_MAX_DK = 1435
export const BILDIRIM_SAAT_ADIM_DK = 5

/** @deprecated → BILDIRIM_GUN_BASLANGIC_DK */
export const BILDIRIM_PENCERE_BASLANGIC_DK = BILDIRIM_GUN_BASLANGIC_DK
/** @deprecated → BILDIRIM_GUN_BITIS_EXCLUSIVE_DK */
export const BILDIRIM_PENCERE_BITIS_DK = BILDIRIM_GUN_BITIS_EXCLUSIVE_DK

export const BILDIRIM_PENCERE_HATA =
  'Gönderim saati Türkiye saatiyle 00:00–23:55 arasında, 5 dakikalık adımlarla seçilmelidir.'

export const BILDIRIM_PENCERE_ARALIK_HATA =
  'Saat aralığı Türkiye saatiyle 00:00–24:00 içinde olmalı ve başlangıç bitişten küçük olmalıdır.'

export function minutesToHHmm(dk: number): string {
  if (dk >= 1440) return '24:00'
  const clamped = Math.max(0, Math.min(1439, Math.floor(dk)))
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0')
  const mm = String(clamped % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

export function hhmmToMinutes(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '24:00') return 1440
  const m = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

export function isDkAktifPencerede(dk: number, basDk: number, bitDk: number): boolean {
  return Number.isInteger(dk) && dk >= basDk && dk < bitDk
}

/** @deprecated Tam gün — isDkAktifPencerede tercih edin. */
export function isGonderimSaatiPencerede(dk: number): boolean {
  return isDkAktifPencerede(dk, BILDIRIM_GUN_BASLANGIC_DK, BILDIRIM_GUN_BITIS_EXCLUSIVE_DK)
}

export function isGonderimSaatiSecilebilir(dk: number): boolean {
  return (
    Number.isInteger(dk) &&
    dk >= BILDIRIM_GONDERIM_MIN_DK &&
    dk <= BILDIRIM_GONDERIM_MAX_DK &&
    dk % BILDIRIM_SAAT_ADIM_DK === 0
  )
}

export function listGonderimSaatiOptions(): Array<{ dk: number; label: string }> {
  const out: Array<{ dk: number; label: string }> = []
  for (let dk = BILDIRIM_GONDERIM_MIN_DK; dk <= BILDIRIM_GONDERIM_MAX_DK; dk += BILDIRIM_SAAT_ADIM_DK) {
    out.push({ dk, label: minutesToHHmm(dk) })
  }
  return out
}

export function snapGonderimSaatiDk(dk: number): number {
  if (!Number.isFinite(dk)) return BILDIRIM_ONERI_BASLANGIC_DK
  const stepped = Math.round(dk / BILDIRIM_SAAT_ADIM_DK) * BILDIRIM_SAAT_ADIM_DK
  return Math.max(BILDIRIM_GONDERIM_MIN_DK, Math.min(BILDIRIM_GONDERIM_MAX_DK, stepped))
}

export function isIzinliAralikGecerli(basDk: number, bitDk: number): boolean {
  if (!Number.isInteger(basDk) || !Number.isInteger(bitDk)) return false
  if (basDk < BILDIRIM_GUN_BASLANGIC_DK || bitDk > BILDIRIM_GUN_BITIS_EXCLUSIVE_DK) return false
  if (basDk >= bitDk) return false
  return true
}
