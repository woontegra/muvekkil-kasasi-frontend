import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTahsilatBildirimOzet, TAHSILAT_BILDIRIM_QUERY_KEY } from '../../api/tahsilatBildirim'
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

  return (
    <DashboardSummaryCard
      title="WhatsApp Hatırlatmaları"
      interactive
      onClick={() => navigate(`${APP_BASE}/bildirim-merkezi`)}
      trailing={dashboardSummaryIconBubble('✉')}
      value={
        ozetQ.isLoading ? (
          <span className="text-sm text-ink-subtle">Yükleniyor…</span>
        ) : (
          <span className="text-lg font-extrabold tabular-nums leading-none text-ink">
            <AnimatedNumber value={counts.gonderilmeyiBekleyen} format={(n) => String(Math.round(n))} />
            <span className="ml-1 text-xs font-semibold text-ink-muted">bekliyor</span>
          </span>
        )
      }
      meta={
        ozetQ.isLoading ? null : (
          <p className="line-clamp-2 text-[10px] leading-snug text-ink-muted">
            {counts.gonderilmeyiBekleyen} gönderilmeyi bekliyor · Bildirim Merkezi
          </p>
        )
      }
    />
  )
}
