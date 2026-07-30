import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatedNumber } from '../../motion'
import { cn } from '../../lib/cn'
import { APP_BASE } from '../../config/appPaths'
import { formatCurrencyTR } from '../../utils/formatters'
import type { TahsilatMerkeziOzetDto } from '../../types/tahsilatMerkezi'
import { DashboardSummaryCard, dashboardSummaryIconBubble } from './DashboardSummaryCard'

type Props = {
  ozet: TahsilatMerkeziOzetDto | undefined
  loading: boolean
}

export function TahsilatBekleyenlerCard({ ozet, loading }: Props): ReactElement {
  const navigate = useNavigate()
  const hasGecikme = (ozet?.gecikmisAdet ?? 0) > 0

  return (
    <DashboardSummaryCard
      title="Tahsilat Bekleyenler"
      interactive
      tone={hasGecikme ? 'danger' : 'default'}
      onClick={() => navigate(`${APP_BASE}/tahsilat-merkezi`)}
      trailing={dashboardSummaryIconBubble('₺', hasGecikme ? 'danger' : 'default')}
      value={
        loading ? (
          <span className="text-sm text-ink-subtle">Yükleniyor…</span>
        ) : (
          <span className={cn('text-lg font-extrabold tabular-nums leading-none', hasGecikme ? 'text-danger' : 'text-ink')}>
            <AnimatedNumber value={Number(ozet?.gecikmisToplam ?? 0)} format={(n) => formatCurrencyTR(n)} />
          </span>
        )
      }
      meta={
        loading ? null : (
          <p className="line-clamp-2 text-[10px] leading-snug text-ink-muted">
            <AnimatedNumber value={ozet?.gecikmisAdet ?? 0} format={(n) => String(Math.round(n))} /> gecikmiş ·{' '}
            <AnimatedNumber value={ozet?.yaklasanAdet ?? 0} format={(n) => String(Math.round(n))} /> yaklaşan
          </p>
        )
      }
    />
  )
}
