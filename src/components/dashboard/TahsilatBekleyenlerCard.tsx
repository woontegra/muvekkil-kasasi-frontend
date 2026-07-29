import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedNumber } from '../../motion'
import { cn } from '../../lib/cn'
import { APP_BASE } from '../../config/appPaths'
import { formatCurrencyTR } from '../../utils/formatters'
import type { TahsilatMerkeziOzetDto } from '../../types/tahsilatMerkezi'

type Props = {
  ozet: TahsilatMerkeziOzetDto | undefined
  loading: boolean
}

export function TahsilatBekleyenlerCard({ ozet, loading }: Props): ReactElement {
  const navigate = useNavigate()
  const hasGecikme = (ozet?.gecikmisAdet ?? 0) > 0

  return (
    <button
      type="button"
      className={cn(
        'motion-card-in rounded-xl border bg-panel p-3.5 shadow-card',
        'flex w-full cursor-pointer gap-3 text-left',
        'transition-[transform,box-shadow,border-color,background-color] duration-150',
        'hover:-translate-y-0.5 hover:shadow-md',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
        'motion-reduce:hover:translate-y-0',
        hasGecikme
          ? 'border-danger/35 hover:border-danger/55 hover:bg-danger/5'
          : 'border-border hover:border-primary/35 hover:bg-primary-soft/20'
      )}
      onClick={() => navigate(`${APP_BASE}/tahsilat-merkezi`)}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Tahsilat Bekleyenler</p>
        {loading ? (
          <p className="mt-1.5 text-sm text-ink-subtle">Yükleniyor…</p>
        ) : (
          <div className="mt-1.5 space-y-1">
            <p className={cn('text-sm font-bold tabular-nums leading-tight', hasGecikme ? 'text-danger' : 'text-ink')}>
              <AnimatedNumber value={Number(ozet?.gecikmisToplam ?? 0)} format={(n) => formatCurrencyTR(n)} />
            </p>
            <p className="text-[10px] text-ink-muted">
              <AnimatedNumber value={ozet?.gecikmisAdet ?? 0} format={(n) => String(Math.round(n))} /> gecikmiş ·{' '}
              <AnimatedNumber value={ozet?.yaklasanAdet ?? 0} format={(n) => String(Math.round(n))} /> yaklaşan
            </p>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-center justify-center">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full text-base',
            hasGecikme ? 'bg-danger/15 text-danger' : 'bg-surface-muted text-ink-muted'
          )}
        >
          ₺
        </span>
      </div>
    </button>
  )
}
