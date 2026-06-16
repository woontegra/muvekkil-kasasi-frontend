import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertBox,
  Button,
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
  tableActionsFlexRow,
  tableActionButtonShrinkClass,
  tableActionLinkAccentClass
} from '../ui'
import type { SmmBekleyenDto } from '../../types/smm'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'

function dosyaTuruEtiket(t: string): string {
  switch (t) {
    case 'DAVA':
      return 'Dava'
    case 'ICRA':
      return 'İcra'
    case 'DANISMANLIK':
      return 'Danışmanlık'
    case 'DIGER':
      return 'Diğer'
    default:
      return t
  }
}

export type SmmBekleyenHomePanelProps = {
  open: boolean
  onClose: () => void
  loading: boolean
  error: boolean
  items: SmmBekleyenDto[]
  dosyaHref: (muvekkilId: string, dosyaId: string) => string
  onMarkSmm: (row: SmmBekleyenDto) => void
}

export function SmmBekleyenHomePanel(props: SmmBekleyenHomePanelProps): ReactElement | null {
  const { open, onClose, loading, error, items, dosyaHref, onMarkSmm } = props
  if (!open) return null

  return (
    <Card className="border-primary/25 shadow-md">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 border-b border-border">
        <div>
          <CardTitle>SMM Bekleyen Tahsilatlar</CardTitle>
          <p className="mt-1 text-xs text-ink-muted">SMM kesilmemiş vekalet tahsilatları.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Kapat
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-ink-muted">Yükleniyor…</p>
        ) : error ? (
          <div className="px-4 py-6">
            <AlertBox variant="danger" title="Hata">
              SMM bekleyen kayıtlar alınamadı.
            </AlertBox>
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-6">
            <EmptyState title="Kayıt yok" description="SMM bekleyen tahsilat bulunmuyor." />
          </div>
        ) : (
          <Table className="min-w-[1040px]">
            <THead>
              <TR>
                <TH>Tahsilat tarihi</TH>
                <TH>Müvekkil</TH>
                <TH>Dosya</TH>
                <TH>Tahsilat türü</TH>
                <TH className="text-right">Tutar</TH>
                <TH>Ödeme yöntemi</TH>
                <TH>Belge no</TH>
                <TH className="text-center">SMM durumu</TH>
                <TH className="min-w-[240px] w-[240px] whitespace-nowrap text-right align-bottom">İşlem</TH>
              </TR>
            </THead>
            <TBody>
              {items.map((row) => (
                <TR key={row.id}>
                  <TD className="align-middle whitespace-nowrap text-sm">{formatDateTR(row.tahsilatTarihi)}</TD>
                  <TD className="align-middle text-sm font-medium">{row.muvekkilAd}</TD>
                  <TD className="max-w-[220px] align-middle text-sm">
                    <span className="line-clamp-2 font-medium text-ink">{row.dosyaBaslik}</span>
                    <div className="mt-0.5 text-xs text-ink-muted">
                      {row.dosyaNo?.trim() ? (
                        <>
                          No: <span className="font-mono">{row.dosyaNo}</span>
                          {' · '}
                        </>
                      ) : null}
                      {dosyaTuruEtiket(row.dosyaTuru)}
                    </div>
                  </TD>
                  <TD className="align-middle text-sm">{row.tahsilatTuru}</TD>
                  <TD className="align-middle text-right text-sm tabular-nums font-semibold">
                    {formatCurrencyTR(Number(row.tutar))}
                  </TD>
                  <TD className="align-middle text-sm text-ink-muted">{row.odemeYontemi?.trim() || '—'}</TD>
                  <TD className="align-middle font-mono text-sm text-ink-muted">{row.belgeNo?.trim() || '—'}</TD>
                  <TD className="align-middle text-center">
                    <span className="inline-flex rounded-md bg-warning-soft/80 px-2 py-0.5 text-xs font-semibold text-warning-ink">
                      Bekliyor
                    </span>
                  </TD>
                  <TD className="min-w-[240px] w-[240px] align-middle text-right">
                    <div className={tableActionsFlexRow}>
                      <Link
                        to={dosyaHref(row.muvekkilId, row.dosyaId)}
                        className={tableActionLinkAccentClass}
                        title="Dosya detayı ve kasa"
                      >
                        Dosyaya git
                      </Link>
                      <Button
                        type="button"
                        size="sm"
                        className={tableActionButtonShrinkClass}
                        title="Serbest meslek makbuzu kesildi olarak işaretle"
                        onClick={() => onMarkSmm(row)}
                      >
                        SMM kesildi
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </CardBody>
    </Card>
  )
}
