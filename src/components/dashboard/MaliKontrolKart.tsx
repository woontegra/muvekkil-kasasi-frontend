import type { ReactElement } from 'react'
import { AnimatedNumber } from '../../motion'
import { cn } from '../../lib/cn'
import type { MaliKontrolResponse } from '../../types/maliKontrol'

type Props = {
  data: MaliKontrolResponse | undefined
  loading: boolean
  onClick: () => void
}

export function MaliKontrolKart({ data, loading, onClick }: Props): ReactElement {
  const kritik = data?.kritikUyari ?? 0
  const toplam = data?.toplamUyari ?? 0
  const hasKritik = kritik > 0

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
        hasKritik
          ? 'border-danger/35 hover:border-danger/55 hover:bg-danger/5'
          : 'border-border hover:border-primary/35 hover:bg-primary-soft/20'
      )}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Mali Kontrol</p>

        {loading ? (
          <p className="mt-1.5 text-sm text-ink-subtle">Yükleniyor…</p>
        ) : (
          <div className="mt-1.5 flex items-end gap-3">
            <div>
              <p className={cn('text-xl font-extrabold tabular-nums leading-none', hasKritik ? 'text-danger' : 'text-ink')}>
                <AnimatedNumber value={toplam} format={(n) => String(Math.round(n))} />
              </p>
              <p className="mt-0.5 text-[10px] text-ink-muted">Açık kontrol</p>
            </div>
            {hasKritik ? (
              <div className="pb-0.5">
                <p className="text-sm font-bold tabular-nums leading-none text-danger">
                  <AnimatedNumber value={kritik} format={(n) => String(Math.round(n))} />
                  <span className="ml-0.5 text-[10px] font-semibold"> kritik</span>
                </p>
              </div>
            ) : toplam === 0 ? (
              <p className="pb-0.5 text-[10px] text-emerald-600 font-semibold">Temiz ✓</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center justify-center">
        <span className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full text-base',
          hasKritik ? 'bg-danger/15 text-danger' : 'bg-surface-muted text-ink-muted'
        )}>
          {hasKritik ? '⚠' : '✓'}
        </span>
      </div>
    </button>
  )
}
