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

export function formatDateTimeTR(dateValue: string | null | undefined): string {
  if (!dateValue?.trim()) return '—'
  const dt = new Date(dateValue.trim())
  if (Number.isNaN(dt.getTime())) return formatDateTR(dateValue)
  return dt.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatCurrencyTR(amount: number): string {
  if (!Number.isFinite(amount)) return '—'
  const s = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
  return `${s} ₺`
}

/**
 * Türk para girişi → sayı.
 * "100000" | "100.000" | "100.000,50" | "100000,50" | "100,50"
 * Boş / geçersiz → null
 */
export function parseCurrencyInputTR(raw: string): number | null {
  let t = raw.trim()
  if (!t) return null

  t = t.replace(/\s/g, '').replace(/₺/g, '').replace(/TL/gi, '')
  if (!t || t === '-' || t === ',' || t === '.') return null

  const negative = t.startsWith('-')
  if (negative) t = t.slice(1)

  let normalized: string
  if (t.includes(',')) {
    normalized = t.replace(/\./g, '').replace(',', '.')
  } else if (/\.\d{3}(\.|$)/.test(t) || (t.match(/\./g) ?? []).length > 1) {
    normalized = t.replace(/\./g, '')
  } else if (/^\d+\.\d{1,2}$/.test(t)) {
    normalized = t
  } else {
    normalized = t.replace(/\./g, '')
  }

  if (!normalized || normalized === '.') return null
  const n = Number(normalized)
  if (!Number.isFinite(n)) return null
  const rounded = Math.round(n * 100) / 100
  return negative ? -rounded : rounded
}

/** Blur / kayıt gösterimi: 100000 → "100.000,00" (₺ yok) */
export function formatCurrencyInputTR(n: number): string {
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/** API sayı/string → MoneyInput başlangıç değeri */
export function moneyInputFromAmount(value: number | string | null | undefined): string {
  if (value == null || value === '') return ''
  const n = typeof value === 'number' ? value : parseCurrencyInputTR(String(value).replace('.', ',')) ?? Number(value)
  if (!Number.isFinite(n) || n === 0) return ''
  return formatCurrencyInputTR(n)
}

export function moneySignificantCount(s: string, caret: number): number {
  let n = 0
  const end = Math.max(0, Math.min(caret, s.length))
  for (let i = 0; i < end; i++) {
    const c = s[i]
    // Baştaki eksi düzeltme tutarlarında caret hesabına dahil edilmeli
    if ((c >= '0' && c <= '9') || c === ',' || (c === '-' && i === 0)) n += 1
  }
  return n
}

export function moneyCaretFromSignificant(s: string, significant: number): number {
  if (significant <= 0) return 0
  let seen = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if ((c >= '0' && c <= '9') || c === ',' || (c === '-' && i === 0)) {
      seen += 1
      if (seen === significant) return i + 1
    }
  }
  return s.length
}

/**
 * Yazarken canlı TR para formatı (₺ yok).
 * Binlik ayırıcı noktalar her zaman temizlenir; ondalık yalnızca virgül.
 * Not: "100.00" ara silme hali ondalık sanılmaz (100.000 → sil → 100.00 → 100).
 * İngilizce yapıştırma için `normalizeMoneyPasteTR` kullanın.
 */
export function formatMoneyTypingTR(raw: string): string {
  let t = raw.replace(/\s/g, '').replace(/₺/g, '').replace(/TL/gi, '')
  if (!t) return ''

  const negative = t.startsWith('-')
  if (negative) t = t.slice(1)

  let integerRaw: string
  let decimalDigits: string | null = null
  let trailingComma = false

  if (t.includes(',')) {
    const idx = t.indexOf(',')
    integerRaw = t.slice(0, idx)
    decimalDigits = t
      .slice(idx + 1)
      .replace(/[^\d]/g, '')
      .slice(0, 2)
    trailingComma = t.endsWith(',') && decimalDigits.length === 0
  } else {
    integerRaw = t
  }

  const intDigits = integerRaw.replace(/[^\d]/g, '')
  const sign = negative ? '-' : ''

  if (!intDigits) {
    if (trailingComma) return `${sign}0,`
    if (decimalDigits != null && decimalDigits.length > 0) return `${sign}0,${decimalDigits}`
    return negative ? '-' : ''
  }

  const formattedInt = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  if (trailingComma) return `${sign}${formattedInt},`
  if (decimalDigits != null) return `${sign}${formattedInt},${decimalDigits}`
  return `${sign}${formattedInt}`
}

/** Yapıştırma: 1234.56 / 1,234.56 → TR yazım formatı */
export function normalizeMoneyPasteTR(raw: string): string {
  let t = raw.replace(/\s/g, '').replace(/₺/g, '').replace(/TL/gi, '')
  if (!t) return ''
  const negative = t.startsWith('-')
  if (negative) t = t.slice(1)

  if (!t.includes(',') && /^\d+\.\d{1,2}$/.test(t)) {
    t = t.replace('.', ',')
  } else if (!t.includes(',') && /^\d{1,3}(,\d{3})*\.\d{1,2}$/.test(t)) {
    t = t.replace(/,/g, '').replace('.', ',')
  }

  return formatMoneyTypingTR(negative ? `-${t}` : t)
}

/** Pozitif tutar (kaydetme). Boş veya ≤0 → null. */
export function parsePosTutar(raw: string): number | null {
  const n = parseCurrencyInputTR(raw)
  if (n == null || n <= 0) return null
  return n
}
