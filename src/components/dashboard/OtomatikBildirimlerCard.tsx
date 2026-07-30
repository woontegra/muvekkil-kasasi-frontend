import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTahsilatBildirimOzet, TAHSILAT_BILDIRIM_QUERY_KEY } from '../../api/tahsilatBildirim'
import { Badge } from '../ui'
import { AnimatedNumber } from '../../motion'
import { APP_BASE } from '../../config/appPaths'
import { readBildirimOzetCounts } from '../../types/tahsilatBildirim'
import { DashboardSummaryCard, dashboardSummaryIconBubble } from './DashboardSummaryCard'

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
    <DashboardSummaryCard
      title="Otomatik Bildirimler"
      interactive
      onClick={() => navigate(`${APP_BASE}/bildirim-merkezi`)}
      titleBadge={
        testModu ? (
          <Badge variant="warning" className="!px-1.5 !py-0 text-[9px] normal-case tracking-normal">
            Test Modu
          </Badge>
        ) : null
      }
      trailing={dashboardSummaryIconBubble('✉')}
      value={
        ozetQ.isLoading ? (
          <span className="text-sm text-ink-subtle">Yükleniyor…</span>
        ) : (
          <span className="text-lg font-extrabold tabular-nums leading-none text-ink">
            <AnimatedNumber value={counts.bugunPlanlanan} format={(n) => String(Math.round(n))} />
            <span className="ml-1 text-xs font-semibold text-ink-muted">bugün</span>
          </span>
        )
      }
      meta={
        ozetQ.isLoading ? null : (
          <p className="line-clamp-2 text-[10px] leading-snug text-ink-muted">
            <AnimatedNumber value={counts.atlanan} format={(n) => String(Math.round(n))} /> atlanan · Bildirim Merkezi
          </p>
        )
      }
    />
  )
}
