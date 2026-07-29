import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTahsilatBildirimOzet, TAHSILAT_BILDIRIM_QUERY_KEY } from '../../api/tahsilatBildirim'
import { Badge } from '../ui'
import { AnimatedNumber } from '../../motion'
import { cn } from '../../lib/cn'
import { APP_BASE } from '../../config/appPaths'
import { readBildirimOzetCounts } from '../../types/tahsilatBildirim'

export function OtomatikBildirimlerCard(): ReactElement {
  const navigate = useNavigate()

  const ozetQ = useQuery({
    queryKey: [...TAHSILAT_BILDIRIM_QUERY_KEY, 'ozet'],
    queryFn: getTahsilatBildirimOzet,
    staleTime: 60_000,
    retry: 1
  })

  const counts = readBildirimOzetCounts(ozetQ.data?.ozet)
  const testModu = counts.testModu ?? true

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
      onClick={() => navigate(`${APP_BASE}/bildirim-merkezi`)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">Otomatik Bildirimler</p>
          {testModu ? (
            <Badge variant="warning" className="normal-case tracking-normal">
              Test Modu
            </Badge>
          ) : null}
        </div>
        {ozetQ.isLoading ? (
          <p className="mt-1.5 text-sm text-ink-subtle">Yükleniyor…</p>
        ) : (
          <div className="mt-1.5 space-y-1">
            <p className="text-sm font-bold tabular-nums leading-tight text-ink">
              <AnimatedNumber value={counts.bugunPlanlanan} format={(n) => String(Math.round(n))} /> bugün
              planlanan
            </p>
            <p className="text-[10px] text-ink-muted">
              <AnimatedNumber value={counts.atlanan} format={(n) => String(Math.round(n))} /> atlanan · Bildirim
              Merkezi
            </p>
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-center justify-center">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-ink-muted">
          ✉
        </span>
      </div>
    </button>
  )
}
