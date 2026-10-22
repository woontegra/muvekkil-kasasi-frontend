import type { ReactElement } from 'react'
import { AnimatedNumber } from '../../motion'
import { cn } from '../../lib/cn'
import type { MaliKontrolResponse } from '../../types/maliKontrol'
import { HomeIconBubble, HomeIcons } from '../home/HomeIcons'
import { DashboardSummaryCard } from './DashboardSummaryCard'

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
    <DashboardSummaryCard
      title="Mali Kontrol"
      interactive
      tone={hasKritik ? 'danger' : 'default'}
      onClick={onClick}
      className={cn('hp-value-tone', hasKritik ? 'hp-tone-red' : toplam === 0 ? 'hp-tone-green' : 'hp-tone-amber')}
      leading={
        <HomeIconBubble tone={hasKritik ? 'red' : toplam === 0 ? 'green' : 'amber'}>
          {hasKritik || toplam > 0 ? HomeIcons.warning() : HomeIcons.checkCircle()}
        </HomeIconBubble>
      }
      value={
        loading ? (
          <span className="text-sm text-ink-subtle">Yükleniyor…</span>
        ) : (
          <span className={cn('text-lg font-extrabold tabular-nums leading-none', hasKritik ? 'text-danger' : 'text-ink')}>
            <AnimatedNumber value={toplam} format={(n) => String(Math.round(n))} />
          </span>
        )
      }
      meta={
        loading ? null : hasKritik ? (
          <p className="line-clamp-1 text-[10px] font-semibold text-danger">
            <AnimatedNumber value={kritik} format={(n) => String(Math.round(n))} /> kritik uyarı
          </p>
        ) : toplam === 0 ? (
          <p className="line-clamp-1 text-[10px] font-semibold text-emerald-700">Temiz · Açık kontrol yok</p>
        ) : (
          <p className="line-clamp-1 text-[10px] text-ink-muted">Açık kontrol</p>
        )
      }
    />
  )
}
