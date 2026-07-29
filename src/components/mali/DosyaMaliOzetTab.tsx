import type { ReactElement } from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDosyaMaliOzet } from '../../api/maliOzet'
import { AlertBox, Button } from '../ui'
import { AnimatedNumber } from '../../motion'
import { formatCurrencyTR } from '../../utils/formatters'
import { cn } from '../../lib/cn'
import type { DosyaMaliOzetPayload } from '../../types/maliOzet'

type Props = { dosyaId: string }

type ViewMode = 'tumZamanlar' | 'buDonem'

function ProgressBar({ value, className }: { value: number; className?: string }): ReactElement {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-muted', className)}>
      <div
        className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

function OzetRow(p: { label: string; value: number; sub?: string; valueClass?: string; indent?: boolean }): ReactElement {
  return (
    <div className={cn('flex items-baseline justify-between gap-2 border-b border-border/60 py-1.5 last:border-b-0', p.indent && 'pl-3')}>
      <div className="min-w-0 shrink-0">
        <span className="text-xs font-medium text-ink-muted">{p.label}</span>
        {p.sub ? <span className="ml-1.5 text-[10px] text-ink-subtle">{p.sub}</span> : null}
      </div>
      <span className={cn('text-sm font-bold tabular-nums text-ink', p.valueClass)}>
        <AnimatedNumber value={p.value} format={formatCurrencyTR} />
      </span>
    </div>
  )
}

function OzetSection(p: { title: string; children: ReactElement | ReactElement[] }): ReactElement {
  return (
    <div className="rounded-lg border border-border bg-panel/50 px-3 py-2">
      <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">{p.title}</h4>
      {p.children}
    </div>
  )
}

function OzetPanel({ data }: { data: DosyaMaliOzetPayload }): ReactElement {
  const kararlastirilan = Number(data.kararlastirilanVekalet)
  const tahsilEdilen = Number(data.tahsilEdilenVekalet)
  const kalanVekalet = Number(data.kalanVekalet)
  const avans = Number(data.alinanMasrafAvansi)
  const masraf = Number(data.toplamMasraf)
  const duzeltme = Number(data.duzeltmeEtkisi)
  const masrafAvansiIadesi = Number(data.masrafAvansiIadesi)
  const kalanAvans = Number(data.kalanMasrafAvansi)
  const buroGider = Number(data.buroKarsiladigiGider)
  const net = Number(data.netKazanc)

  return (
    <div className="space-y-2.5">
      <OzetSection title="Vekalet ücreti">
        <>
          <OzetRow label="Kararlaştırılan" value={kararlastirilan} />
          <OzetRow label="Tahsil edilen" value={tahsilEdilen} valueClass="text-emerald-600" />
          <OzetRow label="Kalan" value={kalanVekalet} valueClass={kalanVekalet > 0 ? 'text-amber-600' : undefined} />
          <div className="mt-1.5 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-medium text-ink-muted">Tahsilat oranı</span>
              <span className="text-xs font-bold tabular-nums text-primary">
                <AnimatedNumber value={data.tahsilatOrani} format={(n) => `${n.toFixed(1)}%`} />
              </span>
            </div>
            <ProgressBar value={data.tahsilatOrani} />
          </div>
        </>
      </OzetSection>

      <OzetSection title="Masraf avansı">
        <>
          <OzetRow label="Alınan avans" value={avans} />
          <OzetRow label="Yapılan masraf" value={masraf} valueClass="text-danger" />
          {duzeltme !== 0 ? <OzetRow label="Düzeltme etkisi" value={duzeltme} /> : null}
          {masrafAvansiIadesi > 0 ? <OzetRow label="Müvekkile iade edilen avans" value={masrafAvansiIadesi} valueClass="text-amber-600" /> : null}
          <OzetRow label="Güncel avans bakiyesi" value={kalanAvans} valueClass={kalanAvans > 0 ? 'text-emerald-600' : undefined} />
        </>
      </OzetSection>

      <OzetSection title="Kârlılık">
        <>
          {buroGider > 0 ? (
            <OzetRow label="Büro karşıladığı gider" value={buroGider} valueClass="text-danger" sub="(masraf > avans)" />
          ) : null}
          <OzetRow
            label="Net kazanç"
            value={net}
            valueClass={cn('text-base', net > 0 ? 'text-emerald-600' : net < 0 ? 'text-danger' : undefined)}
          />
        </>
      </OzetSection>
    </div>
  )
}

export function DosyaMaliOzetTab({ dosyaId }: Props): ReactElement {
  const [view, setView] = useState<ViewMode>('tumZamanlar')

  const query = useQuery({
    queryKey: ['dosya-mali-ozet', dosyaId],
    queryFn: () => getDosyaMaliOzet(dosyaId),
    staleTime: 30_000
  })

  if (query.isLoading) {
    return <p className="py-6 text-center text-sm text-ink-muted">Mali özet yükleniyor…</p>
  }

  if (query.isError) {
    return (
      <AlertBox variant="danger" title="Mali özet">
        {query.error instanceof Error ? query.error.message : 'Yüklenemedi.'}
      </AlertBox>
    )
  }

  const data = query.data
  if (!data) return <p className="py-6 text-center text-sm text-ink-muted">Veri yok.</p>

  const activeData = view === 'buDonem' && data.buDonem ? data.buDonem : data.tumZamanlar

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button" size="sm"
          variant={view === 'tumZamanlar' ? 'secondary' : 'ghost'}
          className={cn(view === 'tumZamanlar' && 'ring-2 ring-primary/25')}
          onClick={() => setView('tumZamanlar')}
        >
          Tüm zamanlar
        </Button>
        {data.buDonem ? (
          <Button
            type="button" size="sm"
            variant={view === 'buDonem' ? 'secondary' : 'ghost'}
            className={cn(view === 'buDonem' && 'ring-2 ring-primary/25')}
            onClick={() => setView('buDonem')}
          >
            {data.donemEtiketi ?? 'Bu dönem'}
          </Button>
        ) : null}
      </div>

      <OzetPanel data={activeData} />

      {view === 'buDonem' ? (
        <p className="text-[10px] text-ink-subtle">
          Dönem görünümünde kararlaştırılan vekalet tutarı gösterilmez; yalnızca dönem içi tahsilatlar ve hareketler hesaplanır.
        </p>
      ) : null}
    </div>
  )
}
