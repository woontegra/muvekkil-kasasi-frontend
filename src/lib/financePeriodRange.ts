/**
 * Finans dönem aralığı — Europe/Istanbul (FE). Backend `financePeriodRange` ile aynı sözleşme.
 */

export type FinancePeriodPreset =
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_3_MONTHS'
  | 'LAST_6_MONTHS'
  | 'LAST_12_MONTHS'
  | 'THIS_YEAR'
  | 'ALL_TIME'
  | 'CUSTOM'

export type FinancePeriodRange = {
  preset: FinancePeriodPreset
  bas: string | null
  bit: string | null
  etiket: string
}

const TZ = 'Europe/Istanbul'

export function ymdIstanbul(ref: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(ref)
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function parseYmd(ymd: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec((ymd ?? '').trim().slice(0, 10))
  if (!match) return null
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) }
}

function istanbulParts(ref: Date): { y: number; m: number; d: number; ymd: string } {
  const ymd = ymdIstanbul(ref)
  const p = parseYmd(ymd)!
  return { ...p, ymd }
}

function lastDayOfMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

const LABELS: Record<FinancePeriodPreset, string> = {
  THIS_MONTH: 'Bu Ay',
  LAST_MONTH: 'Geçen Ay',
  LAST_3_MONTHS: 'Son 3 Ay',
  LAST_6_MONTHS: 'Son 6 Ay',
  LAST_12_MONTHS: 'Son 12 Ay',
  THIS_YEAR: 'Bu Yıl',
  ALL_TIME: 'Tüm Zamanlar',
  CUSTOM: 'Özel Tarih'
}

export const FINANCE_PERIOD_OPTIONS: { value: FinancePeriodPreset; label: string }[] = (
  Object.keys(LABELS) as FinancePeriodPreset[]
).map((value) => ({ value, label: LABELS[value] }))

function thisMonth(now: Date): { bas: string; bit: string } {
  const { y, m, ymd } = istanbulParts(now)
  return { bas: `${y}-${pad2(m)}-01`, bit: ymd }
}

function lastMonth(now: Date): { bas: string; bit: string } {
  const { y, m } = istanbulParts(now)
  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 }
  const last = lastDayOfMonth(prev.y, prev.m)
  return {
    bas: `${prev.y}-${pad2(prev.m)}-01`,
    bit: `${prev.y}-${pad2(prev.m)}-${pad2(last)}`
  }
}

function lastNMonths(now: Date, n: number): { bas: string; bit: string } {
  const { y, m, d, ymd } = istanbulParts(now)
  let ty = y
  let tm = m - n
  while (tm <= 0) {
    tm += 12
    ty -= 1
  }
  const day = Math.min(d, lastDayOfMonth(ty, tm))
  return { bas: `${ty}-${pad2(tm)}-${pad2(day)}`, bit: ymd }
}

export function resolveFinancePeriodRange(
  preset: FinancePeriodPreset,
  opts?: { now?: Date; bas?: string | null; bit?: string | null }
): FinancePeriodRange {
  const now = opts?.now ?? new Date()
  if (preset === 'ALL_TIME') {
    return { preset, bas: null, bit: null, etiket: LABELS.ALL_TIME }
  }
  if (preset === 'CUSTOM') {
    return {
      preset,
      bas: opts?.bas?.trim().slice(0, 10) || null,
      bit: opts?.bit?.trim().slice(0, 10) || null,
      etiket: LABELS.CUSTOM
    }
  }
  let range: { bas: string; bit: string }
  switch (preset) {
    case 'THIS_MONTH':
      range = thisMonth(now)
      break
    case 'LAST_MONTH':
      range = lastMonth(now)
      break
    case 'LAST_3_MONTHS':
      range = lastNMonths(now, 3)
      break
    case 'LAST_6_MONTHS':
      range = lastNMonths(now, 6)
      break
    case 'LAST_12_MONTHS':
      range = lastNMonths(now, 12)
      break
    case 'THIS_YEAR': {
      const { y, ymd } = istanbulParts(now)
      range = { bas: `${y}-01-01`, bit: ymd }
      break
    }
    default:
      range = thisMonth(now)
  }
  return { preset, bas: range.bas, bit: range.bit, etiket: LABELS[preset] }
}

export function coercePresetForManualDates(
  bas: string | null | undefined,
  bit: string | null | undefined,
  now: Date = new Date()
): FinancePeriodPreset {
  const b = bas?.trim().slice(0, 10) || null
  const e = bit?.trim().slice(0, 10) || null
  if (!b && !e) return 'ALL_TIME'
  for (const p of [
    'THIS_MONTH',
    'LAST_MONTH',
    'LAST_3_MONTHS',
    'LAST_6_MONTHS',
    'LAST_12_MONTHS',
    'THIS_YEAR'
  ] as FinancePeriodPreset[]) {
    const r = resolveFinancePeriodRange(p, { now })
    if (r.bas === b && r.bit === e) return p
  }
  return 'CUSTOM'
}

export function formatPeriodRangeLabel(range: FinancePeriodRange): string {
  if (!range.bas && !range.bit) return range.etiket
  if (range.bas && range.bit) return `${range.etiket} · ${range.bas} → ${range.bit}`
  if (range.bas) return `${range.etiket} · ${range.bas} → …`
  return `${range.etiket} · … → ${range.bit}`
}
