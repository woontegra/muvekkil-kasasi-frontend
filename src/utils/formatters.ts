/** Türkiye görüntüleme — masaüstü `formatters.ts` ile uyumlu. */

export function formatDateTR(dateValue: string | null | undefined): string {
  if (!dateValue?.trim()) return '—'
  let s = dateValue.trim()
  const tIdx = s.indexOf('T')
  if (tIdx > 0) s = s.slice(0, tIdx)
  const space = s.indexOf(' ')
  if (space > 0 && /^\d{4}-\d{2}-\d{2}/.test(s)) s = s.slice(0, space)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) {
    const [, y, mo, d] = m
    return `${d}.${mo}.${y}`
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return s
  const dt = new Date(dateValue.trim())
  if (!Number.isNaN(dt.getTime())) {
    const y = dt.getFullYear()
    const mo = String(dt.getMonth() + 1).padStart(2, '0')
    const d = String(dt.getDate()).padStart(2, '0')
    return `${d}.${mo}.${y}`
  }
  return s
}

export function formatCurrencyTR(amount: number): string {
  if (!Number.isFinite(amount)) return '—'
  const s = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
  return `${s} TL`
}
