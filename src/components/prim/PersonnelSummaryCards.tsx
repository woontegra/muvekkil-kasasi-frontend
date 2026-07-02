import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'
import { formatCurrencyTR } from '../../utils/formatters'
import type { PersonelPrimPanelDto } from '../../types/prim'

type Props = {
  ozet: PersonelPrimPanelDto['ozet']
  loading?: boolean
}

function MiniStat(props: { label: string; value: string; highlight?: boolean }): ReactElement {
  return (
    <div className={cn('rounded-lg border border-border bg-panel px-2.5 py-2 shadow-sm')}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{props.label}</p>
      <p
        className={cn(
          'mt-0.5 truncate text-sm font-bold tabular-nums',
          props.highlight ? 'text-primary' : 'text-ink'
        )}
      >
        {props.value}
      </p>
    </div>
  )
}

export function PersonnelSummaryCards(props: Props): ReactElement {
  const { ozet, loading } = props
  const dash = '—'

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      <MiniStat
        label="Bu ay toplam prim tahsilatı"
        value={loading ? dash : formatCurrencyTR(Number(ozet.toplamTahsilatBuAy))}
      />
      <MiniStat
        label="Prim hesabına giren"
        value={loading ? dash : formatCurrencyTR(Number(ozet.primDahilTahsilat))}
      />
      <MiniStat
        label="Tahmini prim"
        value={loading ? dash : formatCurrencyTR(Number(ozet.tahminiPrim))}
        highlight
      />
      <MiniStat
        label="Ödenmiş prim"
        value={loading ? dash : formatCurrencyTR(Number(ozet.odenmisPrim))}
      />
      <MiniStat
        label="Aktif prim kuralı"
        value={loading ? dash : ozet.uygulananKuralAd ?? 'Kural yok'}
      />
      <MiniStat label="Tahsilat adedi" value={loading ? dash : String(ozet.tahsilatAdedi)} />
    </div>
  )
}
