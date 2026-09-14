/** TRY / USD / EUR — backend `ParaBirimi` ile uyumlu. */

export type ParaBirimi = 'TRY' | 'USD' | 'EUR'

export const PARA_BIRIMLERI: readonly ParaBirimi[] = ['TRY', 'USD', 'EUR'] as const

export const PARA_BIRIMI_SEMBOL: Record<ParaBirimi, string> = {
  TRY: '₺',
  USD: '$',
  EUR: '€'
}

export const PARA_BIRIMI_LABEL: Record<ParaBirimi, string> = {
  TRY: 'Türk Lirası',
  USD: 'ABD Doları',
  EUR: 'Euro'
}

/** Tutar ile ₺ arasında satır kırılmaz boşluk. */
export const MONEY_NBSP = '\u00A0'

export function resolveParaBirimi(raw: unknown): ParaBirimi {
  if (raw == null || raw === '') return 'TRY'
  const s = String(raw).trim().toUpperCase()
  if (s === 'TRY' || s === 'USD' || s === 'EUR') return s
  return 'TRY'
}

/** tr-TR binlik/ondalık rakamlar (işaretsiz). */
export function formatMoneyDigitsTr(absAmount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absAmount)
}

/**
 * Ürün para gösterim sözleşmesi:
 * - TRY: `5.000,00 ₺` (NBSP), negatif `-2.500,00 ₺`
 * - USD: `$1.000,00` / `-$1.000,00`
 * - EUR: `€1.000,00` / `-€1.000,00`
 */
export function formatMoney(amount: number, currency: ParaBirimi = 'TRY'): string {
  if (!Number.isFinite(amount)) return '—'
  const neg = amount < 0
  const digits = formatMoneyDigitsTr(Math.abs(amount))
  const sign = neg ? '-' : ''
  if (currency === 'TRY') {
    return `${sign}${digits}${MONEY_NBSP}₺`
  }
  if (currency === 'USD') {
    return `${sign}$${digits}`
  }
  return `${sign}€${digits}`
}

/** ≈ + tutar — yaklaşık TL karşılığı. */
export function formatApproxTryMoney(amount: number): string {
  if (!Number.isFinite(amount)) return '—'
  return `≈${MONEY_NBSP}${formatMoney(Math.abs(amount), 'TRY')}`
}

/** Sembol + para birimi kodu — tablo / liste için. */
export function formatMoneyWithCode(amount: number, currency: ParaBirimi = 'TRY'): string {
  if (!Number.isFinite(amount)) return '—'
  return `${formatMoney(amount, currency)} ${currency}`
}

export function formatSignedMoney(amount: number, currency: ParaBirimi = 'TRY'): string {
  return formatMoney(amount, currency)
}

/** `1 USD = 48,00000000 TRY` — kod ile; sembol için `formatKurOzetiWithSymbols`. */
export function formatKurOzeti(baz: ParaBirimi, karsi: ParaBirimi, kur: number | string): string {
  const k = typeof kur === 'number' ? kur : Number(kur)
  if (!Number.isFinite(k)) return '—'
  const kurStr = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8
  }).format(k)
  return `1 ${baz} = ${kurStr} ${karsi}`
}

/** Kur satırı sembolle: `1 USD = 48,4305 ₺` (TRY karşı tarafta). */
export function formatKurOzetiWithSymbols(
  baz: ParaBirimi,
  karsi: ParaBirimi,
  kur: number | string,
  maxFrac = 8
): string {
  const k = typeof kur === 'number' ? kur : Number(kur)
  if (!Number.isFinite(k)) return '—'
  let kurStr = k.toFixed(maxFrac).replace(/\.?0+$/, '')
  const [intPart, frac = ''] = kurStr.split('.')
  const intTr = Number(intPart).toLocaleString('tr-TR')
  kurStr = frac ? `${intTr},${frac}` : intTr
  if (karsi === 'TRY') {
    return `1 ${baz} = ${kurStr}${MONEY_NBSP}₺`
  }
  return `1 ${baz} = ${kurStr} ${karsi}`
}

/** API fixed-2 string → ürün para gösterimi (finansal hesap yok). */
export function formatMoneyFixed2(fixed2: string, currency: ParaBirimi = 'TRY'): string {
  const s = String(fixed2 ?? '').trim()
  if (!/^-?\d+(\.\d+)?$/.test(s)) return '—'
  const neg = s.startsWith('-')
  const body = neg ? s.slice(1) : s
  const [intRaw, fracRaw = '00'] = body.split('.')
  const frac = `${fracRaw}00`.slice(0, 2)
  const intFormatted = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const digits = `${intFormatted},${frac}`
  const sign = neg ? '-' : ''
  if (currency === 'TRY') return `${sign}${digits}${MONEY_NBSP}₺`
  if (currency === 'USD') return `${sign}$${digits}`
  return `${sign}€${digits}`
}

export function moneyFixed2NonZero(fixed2: string | null | undefined): boolean {
  if (fixed2 == null || fixed2 === '') return false
  const s = String(fixed2).trim()
  if (!/^-?\d+(\.\d+)?$/.test(s)) return false
  return !/^[-]?0+(?:\.0+)?$/.test(s)
}

export type CurrencyBucket<T> = Record<ParaBirimi, T>

export function emptyCurrencyBucket<T>(fill: T): CurrencyBucket<T> {
  return { TRY: fill, USD: fill, EUR: fill }
}

/** API `byCurrency` / `bakiyeler` alanlarından güvenli okuma. */
export function readCurrencyAmount(
  map: Partial<Record<ParaBirimi, string | number>> | undefined,
  currency: ParaBirimi
): number {
  const raw = map?.[currency]
  if (raw == null || raw === '') return 0
  const n = typeof raw === 'number' ? raw : Number(raw)
  return Number.isFinite(n) ? n : 0
}
