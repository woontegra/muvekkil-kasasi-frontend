import type { ReactElement } from 'react'
import { Badge } from '../ui'
import { formatKademeOzet, hesaplamaTipiLabel, kapsamLabel } from './primLabels'
import type { PrimKuralDto } from '../../types/prim'

type Props = {
  kural: PrimKuralDto | null
}

export function PersonnelRuleCard(props: Props): ReactElement {
  const { kural } = props

  if (!kural) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-muted/20 px-3 py-2.5">
        <p className="text-xs font-semibold text-ink">Uygulanan prim kuralı</p>
        <p className="mt-1 text-[11px] text-ink-muted">Bu personel için aktif prim kuralı tanımlı değil.</p>
      </div>
    )
  }

  const kademeler = [...kural.kademeler].sort((a, b) => a.siraNo - b.siraNo)

  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ink">Uygulanan prim kuralı</p>
        <Badge variant={kural.aktifMi ? 'success' : 'default'}>{kural.aktifMi ? 'Aktif' : 'Pasif'}</Badge>
      </div>
      <p className="mt-1 text-sm font-medium text-ink">{kural.ad}</p>
      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-ink-muted">
        <span>{kapsamLabel(kural.kapsam)}</span>
        <span>·</span>
        <span>{hesaplamaTipiLabel(kural.hesaplamaTipi)}</span>
      </div>
      <ul className="mt-2 space-y-0.5 text-[11px] tabular-nums text-ink">
        {kademeler.map((k) => (
          <li key={k.id ?? `${k.siraNo}-${k.minTutar}`}>
            {formatKademeOzet(k.minTutar, k.maxTutar, k.oranYuzde)}
          </li>
        ))}
      </ul>
    </div>
  )
}
