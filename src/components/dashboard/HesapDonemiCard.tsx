import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'
import { AnimatedNumber } from '../../motion'
import { formatCurrencyTR } from '../../utils/formatters'
import type { HesapDonemiOzetResponse } from '../../types/hesapDonemi'
import { DashboardSummaryCard } from './DashboardSummaryCard'

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
    <DashboardSummaryCard
      title="Hesap dönemi"
      interactive
      as="div"
      onClick={onClick}
      meta={
        <div className="space-y-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-ink-subtle">Devreden</span>
            <span className="truncate text-[10px] font-semibold tabular-nums text-ink">
              {loading ? '…' : devredenNum != null ? <AnimatedNumber value={devredenNum} format={formatCurrencyTR} /> : '—'}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] text-ink-subtle">Net sonuç</span>
            <span
              className={cn(
                'truncate text-[10px] font-semibold tabular-nums',
                netNum != null && netNum > 0
                  ? 'text-emerald-600'
                  : netNum != null && netNum < 0
                    ? 'text-danger'
                    : 'text-ink'
              )}
            >
              {loading ? '…' : netNum != null ? <AnimatedNumber value={netNum} format={formatCurrencyTR} /> : '—'}
            </span>
          </div>
          <p className="text-[10px] font-semibold text-primary">Detayları gör</p>
        </div>
      }
    >
      <div className="flex min-w-0 items-center gap-1">
        <button
          type="button"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink-muted transition hover:bg-surface-muted hover:text-ink"
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          aria-label="Önceki dönem"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M7.5 2.5L4 6l3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          aria-label="Sonraki dönem"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M4.5 2.5L8 6l-3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </DashboardSummaryCard>
  )
}
