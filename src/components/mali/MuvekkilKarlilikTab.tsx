import type { ReactElement } from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getMuvekkilKarlilik } from '../../api/maliOzet'
import { AlertBox, Button, Card, CardBody } from '../ui'
import { AnimatedNumber } from '../../motion'
import { formatCurrencyTR } from '../../utils/formatters'
import { cn } from '../../lib/cn'
import { APP_BASE } from '../../config/appPaths'
import type { MuvekkilKarlilikDosya, MuvekkilKarlilikPayload } from '../../types/maliOzet'

type Props = { muvekkilId: string }
type ViewMode = 'tumZamanlar' | 'buDonem'

function StatMini(p: { label: string; value: number; format?: (n: number) => string; valueClass?: string }): ReactElement {
  const fmt = p.format ?? formatCurrencyTR
  return (
    <div className="rounded-lg border border-border bg-panel p-2.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{p.label}</p>
      <p className={cn('mt-0.5 text-sm font-bold tabular-nums text-ink', p.valueClass)}>
        <AnimatedNumber value={p.value} format={fmt} />
      </p>
    </div>
  )
}

function DosyaKazancRow({ d, muvekkilId }: { d: MuvekkilKarlilikDosya; muvekkilId: string }): ReactElement {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <Link
          to={`${APP_BASE}/muvekkil/${muvekkilId}/dosya/${d.dosyaId}`}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {d.konuBasligi}
        </Link>
        {d.dosyaNo ? <span className="ml-1.5 text-[10px] text-ink-subtle">({d.dosyaNo})</span> : null}
      </div>
      <span className={cn(
        'shrink-0 text-xs font-bold tabular-nums',
        d.netKazanc > 0 ? 'text-emerald-600' : d.netKazanc < 0 ? 'text-danger' : 'text-ink'
      )}>
        {formatCurrencyTR(d.netKazanc)}
      </span>
    </div>
  )
}

function KarlilikPanel({ data, muvekkilId }: { data: MuvekkilKarlilikPayload; muvekkilId: string }): ReactElement {
  const net = Number(data.netKazanc)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <StatMini label="Dosya sayısı" value={data.toplamDosya} format={(n) => String(Math.round(n))} />
        <StatMini label="Kararl. vekalet" value={Number(data.kararlastirilanVekalet)} />
        <StatMini label="Tahsil edilen" value={Number(data.tahsilEdilenVekalet)} valueClass="text-emerald-600" />
        <StatMini label="Kalan alacak" value={Number(data.kalanAlacak)} valueClass={Number(data.kalanAlacak) > 0 ? 'text-amber-600' : undefined} />
        <StatMini label="Avans bakiye" value={Number(data.toplamAvansBakiye)} />
        <StatMini label="Toplam masraf" value={Number(data.toplamDosyaMasrafi)} valueClass="text-danger" />
        {Number(data.toplamMasrafAvansiIadesi) > 0 ? (
          <StatMini label="Avans iadesi" value={Number(data.toplamMasrafAvansiIadesi)} valueClass="text-amber-600" />
        ) : null}
        <StatMini
          label="Net kazanç"
          value={net}
          valueClass={cn(net > 0 ? 'text-emerald-600' : net < 0 ? 'text-danger' : undefined)}
        />
      </div>

      {data.enYuksekKazanc || data.enDusukKazanc ? (
        <Card className="shadow-sm">
          <CardBody className="px-3 py-2">
            <h4 className="mb-1 text-[10px] font-bold uppercase tracking-wider text-ink-subtle">Kazanç dağılımı</h4>
            {data.enYuksekKazanc ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-ink-muted">En yüksek:</span>
                <DosyaKazancRow d={data.enYuksekKazanc} muvekkilId={muvekkilId} />
              </div>
            ) : null}
            {data.enDusukKazanc && data.enDusukKazanc.dosyaId !== data.enYuksekKazanc?.dosyaId ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-ink-muted">En düşük:</span>
                <DosyaKazancRow d={data.enDusukKazanc} muvekkilId={muvekkilId} />
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
    </div>
  )
}

export function MuvekkilKarlilikTab({ muvekkilId }: Props): ReactElement {
  const [view, setView] = useState<ViewMode>('tumZamanlar')

  const query = useQuery({
    queryKey: ['muvekkil-karlilik', muvekkilId],
    queryFn: () => getMuvekkilKarlilik(muvekkilId),
    staleTime: 30_000
  })

  if (query.isLoading) {
    return <p className="py-6 text-center text-sm text-ink-muted">Kârlılık analizi yükleniyor…</p>
  }

  if (query.isError) {
    return (
      <AlertBox variant="danger" title="Kârlılık">
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

      <KarlilikPanel data={activeData} muvekkilId={muvekkilId} />

      {view === 'buDonem' ? (
        <p className="text-[10px] text-ink-subtle">
          Dönem görünümünde yalnızca dönem içi tahsilatlar ve hareketler hesaplanır.
        </p>
      ) : null}
    </div>
  )
}
