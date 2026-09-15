import type { ReactElement } from 'react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getMuvekkilKarlilik } from '../../api/maliOzet'
import { AlertBox, Button, Card, CardBody } from '../ui'
import { formatMoneyFixed2, moneyFixed2NonZero, type ParaBirimi } from '../../utils/formatters'
import { cn } from '../../lib/cn'
import { APP_BASE } from '../../config/appPaths'
import type {
  MoneyByCurrency,
  MuvekkilKarlilikDagilim,
  MuvekkilKarlilikDosya,
  MuvekkilKarlilikPayload
} from '../../types/maliOzet'

type Props = { muvekkilId: string }
type ViewMode = 'tumZamanlar' | 'buDonem'

/** Kârlılık kart tonları — pastel, etiket + renk birlikte. */
type StatTone = 'neutral' | 'info' | 'gelir' | 'gider' | 'net-pos' | 'net-neg' | 'net-zero'

const CURRENCIES: ParaBirimi[] = ['TRY', 'USD', 'EUR']

const TONE_BOX: Record<StatTone, string> = {
  neutral: 'border-border bg-panel',
  info: 'border-primary/20 bg-primary-soft/70',
  gelir: 'border-success/30 bg-success-soft',
  gider: 'border-danger/30 bg-danger-soft',
  'net-pos': 'border-success/30 bg-success-soft',
  'net-neg': 'border-danger/30 bg-danger-soft',
  'net-zero': 'border-border bg-surface-muted'
}

const TONE_LABEL: Record<StatTone, string> = {
  neutral: 'text-ink-muted',
  info: 'text-primary/80',
  gelir: 'text-success-ink',
  gider: 'text-danger',
  'net-pos': 'text-success-ink',
  'net-neg': 'text-danger',
  'net-zero': 'text-ink-muted'
}

const TONE_VALUE: Record<StatTone, string> = {
  neutral: 'text-ink',
  info: 'text-ink',
  gelir: 'text-success-ink',
  gider: 'text-danger',
  'net-pos': 'text-success-ink',
  'net-neg': 'text-danger',
  'net-zero': 'text-ink'
}

function netTone(fixed2: string): StatTone {
  if (fixed2.startsWith('-') && moneyFixed2NonZero(fixed2)) return 'net-neg'
  if (moneyFixed2NonZero(fixed2)) return 'net-pos'
  return 'net-zero'
}

function StatMini(p: {
  label: string
  valueText: string
  tone?: StatTone
}): ReactElement {
  const tone = p.tone ?? 'neutral'
  return (
    <div className={cn('min-w-0 rounded-lg border p-2.5 shadow-sm', TONE_BOX[tone])}>
      <p className={cn('text-[10px] font-bold uppercase tracking-wide', TONE_LABEL[tone])}>
        {p.label}
      </p>
      <p className={cn('mt-0.5 break-words text-sm font-bold tabular-nums', TONE_VALUE[tone])}>
        {p.valueText}
      </p>
    </div>
  )
}

function moneyCards(
  labelPrefix: string,
  map: MoneyByCurrency,
  tone: StatTone = 'neutral'
): ReactElement[] {
  return CURRENCIES.flatMap((c) => {
    if (!moneyFixed2NonZero(map[c])) return []
    return [
      <StatMini
        key={`${labelPrefix}-${c}`}
        label={`${labelPrefix} (${c})`}
        valueText={formatMoneyFixed2(map[c], c)}
        tone={tone}
      />
    ]
  })
}

function hasCurrencyActivity(data: MuvekkilKarlilikPayload, c: ParaBirimi): boolean {
  if (moneyFixed2NonZero(data.netKazanc[c])) return true
  if (moneyFixed2NonZero(data.ofisGeliri[c])) return true
  if (moneyFixed2NonZero(data.gider?.[c] ?? '0')) return true
  if (moneyFixed2NonZero(data.kararlastirilanVekalet[c])) return true
  if (moneyFixed2NonZero(data.tahsilEdilenVekalet[c])) return true
  if (moneyFixed2NonZero(data.kalanAlacak[c])) return true
  if (c === 'TRY') {
    return (
      moneyFixed2NonZero(data.toplamAvansBakiye) ||
      moneyFixed2NonZero(data.toplamDosyaMasrafi) ||
      moneyFixed2NonZero(data.toplamMasrafAvansiIadesi)
    )
  }
  return false
}

function DosyaKazancRow({
  d,
  muvekkilId
}: {
  d: MuvekkilKarlilikDosya
  muvekkilId: string
}): ReactElement {
  const tone = netTone(d.netKazanc)
  return (
    <div className="flex min-w-0 items-center justify-between gap-2 border-b border-border/50 py-1.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <Link
          to={`${APP_BASE}/muvekkil/${muvekkilId}/dosya/${d.dosyaId}`}
          className="text-xs font-semibold text-primary hover:underline"
        >
          {d.konuBasligi}
        </Link>
        {d.dosyaNo ? <span className="ml-1.5 text-[10px] text-ink-subtle">({d.dosyaNo})</span> : null}
      </div>
      <span className={cn('shrink-0 text-xs font-bold tabular-nums', TONE_VALUE[tone])}>
        {formatMoneyFixed2(d.netKazanc, d.paraBirimi)}
      </span>
    </div>
  )
}

function DagilimBlock({
  currency,
  dagilim,
  muvekkilId
}: {
  currency: ParaBirimi
  dagilim: MuvekkilKarlilikDagilim
  muvekkilId: string
}): ReactElement {
  return (
    <div className="space-y-1">
      <h5 className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{currency}</h5>
      {dagilim.enYuksekKazanc ? (
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-[10px] font-medium text-ink-muted">En yüksek:</span>
          <div className="min-w-0 flex-1">
            <DosyaKazancRow d={dagilim.enYuksekKazanc} muvekkilId={muvekkilId} />
          </div>
        </div>
      ) : null}
      {dagilim.enDusukKazanc &&
      dagilim.enDusukKazanc.dosyaId !== dagilim.enYuksekKazanc?.dosyaId ? (
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-[10px] font-medium text-ink-muted">En düşük:</span>
          <div className="min-w-0 flex-1">
            <DosyaKazancRow d={dagilim.enDusukKazanc} muvekkilId={muvekkilId} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function KarlilikPanel({ data, muvekkilId }: { data: MuvekkilKarlilikPayload; muvekkilId: string }): ReactElement {
  const netCards = CURRENCIES.flatMap((c) => {
    if (!hasCurrencyActivity(data, c)) return []
    const v = data.netKazanc[c]
    return [
      <StatMini
        key={`net-${c}`}
        label={`Net Kazanç (${c})`}
        valueText={formatMoneyFixed2(v, c)}
        tone={netTone(v)}
      />
    ]
  })

  const dagilimEntries = CURRENCIES.flatMap((c) => {
    const d = data.kazancDagilimi?.[c]
    if (!d?.enYuksekKazanc && !d?.enDusukKazanc) return []
    return [{ currency: c, dagilim: d! }]
  })

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <StatMini label="Dosya sayısı" valueText={String(data.toplamDosya)} tone="info" />
        {moneyCards('Kararl. vekalet', data.kararlastirilanVekalet, 'info')}
        {moneyCards('Tahsil edilen', data.tahsilEdilenVekalet, 'info')}
        {moneyCards('Kalan alacak', data.kalanAlacak, 'info')}
        {moneyFixed2NonZero(data.toplamAvansBakiye) || hasCurrencyActivity(data, 'TRY') ? (
          <StatMini
            label="Avans bakiye (TRY)"
            valueText={formatMoneyFixed2(data.toplamAvansBakiye, 'TRY')}
            tone="info"
          />
        ) : null}
        {moneyFixed2NonZero(data.toplamDosyaMasrafi) ? (
          <StatMini
            label="Toplam masraf (TRY)"
            valueText={formatMoneyFixed2(data.toplamDosyaMasrafi, 'TRY')}
            tone="info"
          />
        ) : null}
        {moneyFixed2NonZero(data.toplamMasrafAvansiIadesi) ? (
          <StatMini
            label="Avans iadesi (TRY)"
            valueText={formatMoneyFixed2(data.toplamMasrafAvansiIadesi, 'TRY')}
            tone="info"
          />
        ) : null}
        {moneyCards('Gelir', data.ofisGeliri, 'gelir')}
        {moneyCards('Gider', data.gider ?? { TRY: '0.00', USD: '0.00', EUR: '0.00' }, 'gider')}
        {netCards}
      </div>

      {dagilimEntries.length > 0 ? (
        <Card className="shadow-sm">
          <CardBody className="space-y-3 px-3 py-2">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">
              Kazanç dağılımı
            </h4>
            <p className="text-[10px] text-ink-subtle">
              Para birimleri birbirleriyle kıyaslanmaz; her döviz kendi içinde sıralanır.
            </p>
            {dagilimEntries.map(({ currency, dagilim }) => (
              <DagilimBlock
                key={currency}
                currency={currency}
                dagilim={dagilim}
                muvekkilId={muvekkilId}
              />
            ))}
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
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={view === 'tumZamanlar' ? 'secondary' : 'ghost'}
          className={cn(view === 'tumZamanlar' && 'ring-2 ring-primary/25')}
          onClick={() => setView('tumZamanlar')}
        >
          Tüm zamanlar
        </Button>
        {data.buDonem ? (
          <Button
            type="button"
            size="sm"
            variant={view === 'buDonem' ? 'secondary' : 'ghost'}
            className={cn(view === 'buDonem' && 'ring-2 ring-primary/25')}
            onClick={() => setView('buDonem')}
          >
            {data.donemEtiketi ?? 'Bu dönem'}
          </Button>
        ) : null}
      </div>

      <KarlilikPanel data={activeData} muvekkilId={muvekkilId} />

      <p className="text-[10px] text-ink-subtle">
        Tutarlar para birimine göre ayrıdır; TRY, USD ve EUR ham sayılarla birleştirilmez. Avans ve
        masraf şu an yalnız TRY&apos;dir. Net kazanç = ilgili para birimindeki gelir − aynı para
        birimindeki gider.
      </p>

      {view === 'buDonem' ? (
        <p className="text-[10px] text-ink-subtle">
          Dönem görünümünde yalnızca dönem içi tahsilatlar ve hareketler hesaplanır.
        </p>
      ) : null}
    </div>
  )
}
