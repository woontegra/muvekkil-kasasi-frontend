import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'
import { AnimatedNumber } from '../../motion'
import { formatCurrencyTR } from '../../utils/formatters'
import type { HesapDonemiOzetResponse } from '../../types/hesapDonemi'

type Props = {
  data: HesapDonemiOzetResponse | undefined
  loading: boolean
  onPrev: () => void
  onNext: () => void
  onClick: () => void
}

export function HesapDonemiCard({ data, loading, onPrev, onNext, onClick }: Props): ReactElement {
  const etiket = data?.period.etiket ?? '—'
  const canGoNext = data?.canGoNext ?? false

  const devredenNum = data ? Number(data.devredenBakiye) : null
  const netNum = data ? Number(data.donemNetSonucu) : null

  return (
    <button
      type="button"
      className={cn(
        'motion-card-in rounded-xl border border-border bg-panel p-3.5 shadow-card',
        'flex w-full cursor-pointer gap-3 text-left',
        'transition-[transform,box-shadow,border-color,background-color] duration-150',
        'hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary-soft/20 hover:shadow-md',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        'motion-reduce:hover:translate-y-0'
      )}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Hesap dönemi</p>

        <div className="mt-1 flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink-muted transition hover:bg-surface-muted hover:text-ink"
            onClick={(e) => { e.stopPropagation(); onPrev() }}
            aria-label="Önceki dönem"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5L4 6l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="truncate text-sm font-bold text-ink">{loading ? '…' : etiket}</span>
          <button
            type="button"
            className={cn(
              'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded transition',
              canGoNext
                ? 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                : 'cursor-not-allowed text-ink-subtle/30'
            )}
            disabled={!canGoNext}
            onClick={(e) => { e.stopPropagation(); onNext() }}
            aria-label="Sonraki dönem"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        <div className="mt-1.5 space-y-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-ink-subtle">Devreden</span>
            <span className="text-xs font-semibold tabular-nums text-ink">
              {loading ? '…' : devredenNum != null ? <AnimatedNumber value={devredenNum} format={formatCurrencyTR} /> : '—'}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-ink-subtle">Net sonuç</span>
            <span className={cn(
              'text-xs font-semibold tabular-nums',
              netNum != null && netNum > 0 ? 'text-emerald-600' : netNum != null && netNum < 0 ? 'text-danger' : 'text-ink'
            )}>
              {loading ? '…' : netNum != null ? <AnimatedNumber value={netNum} format={formatCurrencyTR} /> : '—'}
            </span>
          </div>
        </div>

        <p className="mt-1 text-[10px] font-semibold text-primary">Detayları gör</p>
      </div>
    </button>
  )
}
