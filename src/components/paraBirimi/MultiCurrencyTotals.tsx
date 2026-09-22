import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'
import { uiType } from '../../lib/uiDensity'
import {
  formatBalanceImpact,
  formatMoney,
  PARA_BIRIMLERI,
  readCurrencyAmount,
  type ParaBirimi
} from '../../utils/paraBirimi'

type Props = {
  /** Para birimi → tutar (string veya number) */
  amounts: Partial<Record<ParaBirimi, string | number>> | undefined
  className?: string
  /** Yalnızca sıfır olmayanları göster — dönem kartlarında false tutun */
  hideZero?: boolean
  compact?: boolean
  /** Örn. "Bu ay gider" → "Bu ay gider (TRY)" */
  labelPrefix?: string
}

/** Para birimine göre ayrılmış tutar listesi — tek sahte TL toplamı yok. */
export function MultiCurrencyTotals(props: Props): ReactElement {
  const { amounts, className, hideZero = false, compact: _compact = false, labelPrefix } = props
  const rows = PARA_BIRIMLERI.map((pb) => ({
    pb,
    value: readCurrencyAmount(amounts, pb)
  })).filter((r) => !hideZero || r.value !== 0)

  if (rows.length === 0) {
    return <span className={cn('text-ink-muted', className)}>—</span>
  }

  if (rows.length === 1 && !labelPrefix) {
    const r = rows[0]!
    return (
      <span className={cn('font-semibold tabular-nums text-ink', className)}>
        {formatMoney(r.value, r.pb)}
      </span>
    )
  }

  return (
    <div className={cn('space-y-0.5', className)}>
      {rows.map((r) => (
        <div key={r.pb} className={cn('flex items-baseline justify-between gap-2 text-[11px] tabular-nums')}>
          <span className="text-ink-muted">{labelPrefix ? `${labelPrefix} (${r.pb})` : r.pb}</span>
          <span className="font-semibold text-ink">{formatMoney(r.value, r.pb)}</span>
        </div>
      ))}
    </div>
  )
}

type Breakdown = {
  gelir?: string | number
  gider?: string | number
  duzeltme?: string | number
}

type BalanceCardsProps = {
  bakiyeler: Partial<Record<ParaBirimi, string | number>> | undefined
  breakdowns?: Partial<Record<ParaBirimi, Breakdown>>
  className?: string
  titlePrefix?: string
}

/** Güncel net kasa bakiyesi — dönem seçicisinden etkilenmez. */
export function CurrencyBalanceCards(props: BalanceCardsProps): ReactElement {
  const { bakiyeler, breakdowns, className, titlePrefix = 'Güncel Net Kasa Bakiyesi' } = props
  const cardStyles: Record<ParaBirimi, string> = {
    TRY: 'border-sky-400/50 bg-sky-50/90 dark:border-sky-900/45 dark:bg-sky-950/25',
    USD: 'border-emerald-400/50 bg-emerald-50/85 dark:border-emerald-900/45 dark:bg-emerald-950/25',
    EUR: 'border-violet-400/50 bg-violet-50/85 dark:border-violet-900/45 dark:bg-violet-950/25'
  }

  return (
    <div className={cn('grid gap-3 sm:grid-cols-3', className)} data-testid="currency-balance-cards">
      {PARA_BIRIMLERI.map((pb) => {
        const val = readCurrencyAmount(bakiyeler, pb)
        const br = breakdowns?.[pb]
        const gelir = br ? readCurrencyAmount({ [pb]: br.gelir }, pb) : null
        const gider = br ? readCurrencyAmount({ [pb]: br.gider }, pb) : null
        const duz = br ? readCurrencyAmount({ [pb]: br.duzeltme }, pb) : null
        return (
          <div key={pb} className={cn('rounded-lg border px-3 py-2.5 shadow-sm', cardStyles[pb])}>
            <p className={uiType.cardLabel}>
              {titlePrefix} ({pb})
            </p>
            <p className={cn('mt-1', uiType.cardValue)}>{formatMoney(val, pb)}</p>
            {br ? (
              <div className="mt-2 space-y-0.5 border-t border-border/50 pt-1.5 text-[10px] tabular-nums text-ink-muted">
                <div className="flex justify-between gap-2">
                  <span>Toplam gelir</span>
                  <span className="font-medium text-ink">{formatMoney(gelir ?? 0, pb)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Toplam gider</span>
                  <span className="font-medium text-ink">{formatMoney(gider ?? 0, pb)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Düzeltme etkisi</span>
                  <span
                    className={cn(
                      'font-semibold',
                      (duz ?? 0) > 0 && 'text-emerald-700',
                      (duz ?? 0) < 0 && 'text-danger'
                    )}
                  >
                    {formatBalanceImpact(duz ?? 0, pb)}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span>Net bakiye</span>
                  <span className="font-semibold text-ink">{formatMoney(val, pb)}</span>
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
