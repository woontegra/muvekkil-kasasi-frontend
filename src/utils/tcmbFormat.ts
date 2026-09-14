import { formatDateTR, formatDateTimeTR } from './formatters'

/** Europe/Istanbul takvim günü (YYYY-MM-DD). */
export function istanbulTodayYmd(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now)
}

/** Üst bar ve form referans gösterimi — tr-TR, en fazla 4 ondalık. */
export function formatTcmbRateDisplay(value: string | number | null | undefined): string {
  if (value == null || value === '') return '—'
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4
  }).format(n)
}

/** Düzenlenebilir kur alanı — 8 ondalığa kadar. */
export function formatTcmbKurInput(value: string | number | null | undefined): string {
  if (value == null || value === '') return ''
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return ''
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(n)
}

export function parseTcmbKurInput(raw: string): number | null {
  const t = raw.trim()
  if (!t) return null
  const normalized = t.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(normalized)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export { formatDateTR, formatDateTimeTR }
