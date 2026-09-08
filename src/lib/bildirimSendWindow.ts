/** Europe/Istanbul gönderim penceresi — backend worker ile aynı: [600, 1200). */
export const BILDIRIM_PENCERE_BASLANGIC_DK = 600 // 10:00
export const BILDIRIM_PENCERE_BITIS_DK = 1200 // 20:00 (hariç)

/** Kural saati en geç 19:55 (5 dk adım). */
export const BILDIRIM_GONDERIM_MAX_DK = 1195 // 19:55
export const BILDIRIM_SAAT_ADIM_DK = 5

export const BILDIRIM_PENCERE_HATA =
  'Gönderim saati Türkiye saatiyle 10:00–19:55 arasında, 5 dakikalık adımlarla seçilmelidir.'

export const BILDIRIM_PENCERE_ARALIK_HATA =
  'İzinli gönderim aralığı Türkiye saatiyle 10:00–20:00 içinde olmalıdır.'

export function minutesToHHmm(dk: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.floor(dk)))
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0')
  const mm = String(clamped % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

export function hhmmToMinutes(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

/** Worker penceresi: 10:00 dahil, 20:00 hariç. */
export function isGonderimSaatiPencerede(dk: number): boolean {
  return Number.isInteger(dk) && dk >= BILDIRIM_PENCERE_BASLANGIC_DK && dk < BILDIRIM_PENCERE_BITIS_DK
}

/** UI/kural seçimi: 10:00–19:55, 5 dk adım. */
export function isGonderimSaatiSecilebilir(dk: number): boolean {
  return (
    Number.isInteger(dk) &&
    dk >= BILDIRIM_PENCERE_BASLANGIC_DK &&
    dk <= BILDIRIM_GONDERIM_MAX_DK &&
    dk % BILDIRIM_SAAT_ADIM_DK === 0
  )
}

export function listGonderimSaatiOptions(): Array<{ dk: number; label: string }> {
  const out: Array<{ dk: number; label: string }> = []
  for (let dk = BILDIRIM_PENCERE_BASLANGIC_DK; dk <= BILDIRIM_GONDERIM_MAX_DK; dk += BILDIRIM_SAAT_ADIM_DK) {
    out.push({ dk, label: minutesToHHmm(dk) })
  }
  return out
}

/** En yakın geçerli seçilebilir saate yuvarla (aşırıysa 19:55). */
export function snapGonderimSaatiDk(dk: number): number {
  if (!Number.isFinite(dk)) return BILDIRIM_PENCERE_BASLANGIC_DK
  const stepped = Math.round(dk / BILDIRIM_SAAT_ADIM_DK) * BILDIRIM_SAAT_ADIM_DK
  return Math.max(BILDIRIM_PENCERE_BASLANGIC_DK, Math.min(BILDIRIM_GONDERIM_MAX_DK, stepped))
}

export function isIzinliAralikGecerli(basDk: number, bitDk: number): boolean {
  if (!Number.isInteger(basDk) || !Number.isInteger(bitDk)) return false
  if (basDk < BILDIRIM_PENCERE_BASLANGIC_DK || bitDk > BILDIRIM_PENCERE_BITIS_DK) return false
  if (basDk >= bitDk) return false
  return true
}
