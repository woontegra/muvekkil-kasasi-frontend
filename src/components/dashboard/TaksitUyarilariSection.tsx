import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { APP_BASE } from '../../config/appPaths'
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  tableActionLinkAccentClass
} from '../ui'
import type { TaksitUyariListeSatir, TaksitUyarilariResponse } from '../../types/taksitUyari'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'

function rowHref(row: TaksitUyariListeSatir): string {
  if (row.muvekkilId && row.dosyaId) {
    return `${APP_BASE}/muvekkil/${row.muvekkilId}/dosya/${row.dosyaId}`
  }
  return `${APP_BASE}/icra-tahsilat`
}

export type TaksitUyarilariSectionProps = {
  loading: boolean
  error: boolean
  data: TaksitUyarilariResponse | undefined
  onOpenSmm?: () => void
}

function MetricCard(props: {
  label: string
  value: number | string
  sub: string
  tone: 'danger' | 'warning' | 'info'
}): ReactElement {
  const { label, value, sub, tone } = props
  const toneClass =
    tone === 'danger'
      ? 'border-red-200 bg-red-50/80 dark:border-red-900/50 dark:bg-red-950/30'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/30'
        : 'border-sky-200 bg-sky-50/80 dark:border-sky-900/50 dark:bg-sky-950/30'
  const pillClass =
    tone === 'danger'
      ? 'bg-red-100 text-red-900 dark:bg-red-900/50 dark:text-red-100'
      : tone === 'warning'
        ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-100'
        : 'bg-sky-100 text-sky-900 dark:bg-sky-900/50 dark:text-sky-100'

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${toneClass}`}>
      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${pillClass}`}>
        {label}
      </span>
      <p className="mt-1.5 text-2xl font-bold tabular-nums text-ink">{value}</p>
      <p className="text-[11px] text-ink-muted">{sub}</p>
    </div>
  )
}

export function TaksitUyarilariSection(props: TaksitUyarilariSectionProps): ReactElement {
  const { loading, error, data, onOpenSmm } = props

  const vadesiGecmis = loading ? '…' : String(data?.vadesiGecmisCount ?? 0)
  const bugun = loading ? '…' : String(data?.bugunOdenecekCount ?? 0)
  const odenmemis = loading ? '…' : String(data?.odenmemisCount ?? 0)
  const smm = loading ? '…' : String(data?.smmBekleyenCount ?? 0)
  const liste = data?.vadesiGecmisListe ?? []

  return (
    <Card>
      <CardHeader className="border-b border-border py-3">
        <CardTitle className="text-base">Taksit uyarıları</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3 px-3 py-3 sm:px-4">
        {error ? (
          <p className="text-sm text-danger">Taksit uyarıları yüklenemedi.</p>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-3">
          <MetricCard label="Vadesi geçmiş" value={vadesiGecmis} sub="Gecikmiş taksit" tone="danger" />
          <MetricCard label="Bugün ödenecek" value={bugun} sub="Vadesi bugün" tone="warning" />
          <MetricCard label="Ödenmemiş" value={odenmemis} sub="Toplam bekleyen" tone="info" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted/40 px-3 py-2">
          <span className="text-xs font-semibold text-ink">SMM bekleyen tahsilatlar</span>
          {onOpenSmm && Number(data?.smmBekleyenCount ?? 0) > 0 ? (
            <button
              type="button"
              className="text-xl font-bold tabular-nums text-primary underline-offset-2 hover:underline"
              onClick={onOpenSmm}
            >
              {smm}
            </button>
          ) : (
            <span className="text-xl font-bold tabular-nums text-ink">{smm}</span>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-xs font-semibold text-ink-muted">Vadesi geçmiş taksitler</p>
          {loading ? (
            <p className="py-4 text-center text-sm text-ink-muted">Yükleniyor…</p>
          ) : liste.length === 0 ? (
            <EmptyState title="Henüz vadesi geçmiş taksit yok" description="Açık taksitler vadesinde veya gelecekte." />
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table className="text-xs">
                <THead>
                  <TR>
                    <TH>Müvekkil</TH>
                    <TH>Dosya</TH>
                    <TH className="text-center">Taksit</TH>
                    <TH className="text-center">Vade</TH>
                    <TH className="text-right">Tutar</TH>
                    <TH className="text-right">Ödenen</TH>
                    <TH className="text-right">Kalan</TH>
                    <TH className="text-center">Durum</TH>
                    <TH className="w-[1%] text-center">İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {liste.map((row) => (
                    <TR key={`${row.kaynak}-${row.id}`}>
                      <TD className="max-w-[8rem] truncate font-medium" title={row.muvekkilAd}>
                        {row.muvekkilAd}
                      </TD>
                      <TD className="max-w-[10rem] truncate text-ink-muted" title={row.dosyaBaslik}>
                        {row.dosyaBaslik}
                        {row.kaynak === 'ICRA' ? (
                          <span className="ml-1 text-[10px] text-ink-subtle">(İcra)</span>
                        ) : null}
                      </TD>
                      <TD className="text-center tabular-nums">{row.taksitEtiket}</TD>
                      <TD className="text-center tabular-nums">{formatDateTR(row.vadeTarihi)}</TD>
                      <TD className="text-right tabular-nums">{formatCurrencyTR(Number(row.tutar))}</TD>
                      <TD className="text-right tabular-nums">{formatCurrencyTR(Number(row.odenen))}</TD>
                      <TD className="text-right font-semibold tabular-nums">{formatCurrencyTR(Number(row.kalan))}</TD>
                      <TD className="text-center">
                        <Badge variant="danger" className="!normal-case">
                          Gecikti
                        </Badge>
                      </TD>
                      <TD className="text-center">
                        <Link
                          to={rowHref(row)}
                          className={tableActionLinkAccentClass}
                          title="Aç"
                          aria-label={`${row.muvekkilAd} — dosyayı aç`}
                        >
                          ↗
                        </Link>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
