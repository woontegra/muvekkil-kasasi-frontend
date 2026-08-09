import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getTahsilatBildirimOzet, listTahsilatBildirimIsleri, TAHSILAT_BILDIRIM_QUERY_KEY } from '../api/tahsilatBildirim'
import { friendlyClientErrorMessage } from '../api/client'
import { BildirimJobWhatsAppActions } from '../components/bildirim/BildirimJobWhatsAppActions'
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  tableActionLinkAccentClass,
  tableActionsFlexRow
} from '../components/ui'
import { APP_BASE } from '../config/appPaths'
import { buildMaliKontrolNavigateUrl } from '../lib/maliKontrolNavigation'
import { AnimatedNumber, Stagger, StaggerItem } from '../motion'
import type { BildirimIsDurumu, TahsilatBildirimIsGorunum, TahsilatBildirimIsiDto } from '../types/tahsilatBildirim'
import {
  BILDIRIM_GORUNUM_LABEL,
  bildirimIsDurumLabel,
  bildirimKuralTuruLabel,
  readBildirimOzetCounts
} from '../types/tahsilatBildirim'
import { formatCurrencyTR, formatDateTimeTR, formatDateTR } from '../utils/formatters'

const JOB_TABS: TahsilatBildirimIsGorunum[] = ['GECMIS', 'PLANLANANLAR', 'BUGUN', 'ATLANANLAR']

function durumBadgeVariant(d: BildirimIsDurumu): 'default' | 'success' | 'warning' | 'danger' | 'primary' {
  switch (d) {
    case 'SIMULASYON_TAMAMLANDI':
      return 'warning'
    case 'GONDERILDI':
    case 'TESLIM_EDILDI':
    case 'OKUNDU':
      return 'success'
    case 'PLANLANDI':
    case 'KUYRUKTA':
      return 'primary'
    case 'ATLANDI':
    case 'IPTAL_EDILDI':
      return 'warning'
    case 'BASARISIZ':
      return 'danger'
    default:
      return 'default'
  }
}

function aciklamaText(row: TahsilatBildirimIsiDto): string {
  return row.uygunlukAciklama || row.hataOzeti || row.atlamaNedeni || row.iptalNedeni || '—'
}

function CompactStat(props: { label: string; value: number; loading?: boolean }): ReactElement {
  return (
    <div className="rounded-lg border border-border bg-panel px-3 py-2.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">{props.label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums text-ink">
        {props.loading ? '…' : <AnimatedNumber value={props.value} format={(n) => String(Math.round(n))} />}
      </p>
    </div>
  )
}

export function BildirimMerkeziPage(): ReactElement {
  const navigate = useNavigate()

  const [tab, setTab] = useState<TahsilatBildirimIsGorunum>('GECMIS')
  const [page, setPage] = useState(1)
  const limit = 50

  const listParams = useMemo(
    () => ({
      gorunum: tab,
      page,
      limit
    }),
    [tab, page, limit]
  )

  const ozetQ = useQuery({
    queryKey: [...TAHSILAT_BILDIRIM_QUERY_KEY, 'ozet'],
    queryFn: getTahsilatBildirimOzet,
    staleTime: 30_000
  })

  const listQ = useQuery({
    queryKey: [...TAHSILAT_BILDIRIM_QUERY_KEY, 'isler', listParams],
    queryFn: () => listTahsilatBildirimIsleri(listParams)
  })

  useEffect(() => {
    setPage(1)
  }, [tab])

  const ozetCounts = readBildirimOzetCounts(ozetQ.data?.ozet ?? listQ.data?.ozet)

  const items = listQ.data?.items ?? []
  const total = listQ.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const ozetLoading = ozetQ.isLoading && !ozetQ.data

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Bildirim Merkezi"
        description="Geçmiş WhatsApp hatırlatma kayıtlarını görüntüleyin. Yeni hatırlatma için Tahsilat Merkezi'ni kullanın."
      />

      <AlertBox variant="info" title="WhatsApp hatırlatması">
        Tahsilat Merkezi üzerinden WhatsApp&apos;ta Aç ile hazır mesajı gönderebilirsiniz. Gönderim, sizin WhatsApp
        hesabınız üzerinden tamamlanır.
      </AlertBox>

      <Stagger className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StaggerItem>
          <CompactStat label="Gönderilen" value={ozetQ.data?.ozet.gonderilen ?? 0} loading={ozetLoading} />
        </StaggerItem>
        <StaggerItem>
          <CompactStat label="Bekleyen" value={ozetCounts.gonderilmeyiBekleyen} loading={ozetLoading} />
        </StaggerItem>
        <StaggerItem>
          <CompactStat label="Hatalı" value={ozetCounts.basarisiz + ozetCounts.atlanan} loading={ozetLoading} />
        </StaggerItem>
      </Stagger>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {JOB_TABS.map((g) => (
              <Button
                key={g}
                type="button"
                size="sm"
                variant={tab === g ? 'primary' : 'outline'}
                onClick={() => setTab(g)}
              >
                {BILDIRIM_GORUNUM_LABEL[g]}
              </Button>
            ))}
          </div>

          {listQ.isError ? (
            <AlertBox variant="warning" title="Liste yüklenemedi">
              {friendlyClientErrorMessage(listQ.error, 'Bildirim kayıtları alınamadı.')}
            </AlertBox>
          ) : null}

          {listQ.isLoading ? (
            <p className="text-sm text-ink-muted">Kayıtlar yükleniyor…</p>
          ) : items.length === 0 ? (
            <EmptyState
              title="Kayıt yok"
              description={`${BILDIRIM_GORUNUM_LABEL[tab]} görünümünde kayıt bulunamadı.`}
              action={
                <Link to={`${APP_BASE}/tahsilat-merkezi`} className="text-sm font-semibold text-primary hover:underline">
                  Tahsilat Merkezi&apos;ne git
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Müvekkil</TH>
                    <TH>Dosya</TH>
                    <TH>Taksit</TH>
                    <TH>Kalan</TH>
                    <TH>Hatırlatma</TH>
                    <TH>Kayıt tarihi</TH>
                    <TH>Telefon</TH>
                    <TH>Durum</TH>
                    <TH>Açıklama</TH>
                    <TH className="text-right">İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((row) => (
                    <TR key={row.id}>
                      <TD className="max-w-[140px] truncate font-medium">{row.muvekkilAd ?? '—'}</TD>
                      <TD className="max-w-[160px]">
                        <div className="truncate font-medium">{row.dosyaBaslik ?? '—'}</div>
                        {row.dosyaNo ? (
                          <div className="truncate text-[11px] text-ink-subtle">{row.dosyaNo}</div>
                        ) : null}
                      </TD>
                      <TD className="whitespace-nowrap tabular-nums">
                        {row.taksitNo != null ? `#${row.taksitNo}` : '—'}
                        {row.vadeTarihi ? (
                          <div className="text-[11px] text-ink-subtle">{formatDateTR(row.vadeTarihi)}</div>
                        ) : null}
                      </TD>
                      <TD className="whitespace-nowrap tabular-nums">
                        {formatCurrencyTR(Number(row.kalanTutarSnapshot))}
                      </TD>
                      <TD className="whitespace-nowrap">{bildirimKuralTuruLabel(row.kuralTuru)}</TD>
                      <TD className="whitespace-nowrap text-xs tabular-nums">
                        {formatDateTimeTR(row.planlananAt)}
                      </TD>
                      <TD>{row.telefonMaskeli ?? '—'}</TD>
                      <TD>
                        <Badge variant={durumBadgeVariant(row.durum)}>{bildirimIsDurumLabel(row.durum)}</Badge>
                      </TD>
                      <TD className="max-w-[180px] truncate text-xs text-ink-muted" title={aciklamaText(row)}>
                        {aciklamaText(row)}
                      </TD>
                      <TD className="text-right">
                        <div className={tableActionsFlexRow}>
                          <BildirimJobWhatsAppActions row={row} />
                          <button
                            type="button"
                            className={tableActionLinkAccentClass}
                            onClick={() =>
                              navigate(
                                buildMaliKontrolNavigateUrl({
                                  muvekkilId: row.muvekkilId,
                                  dosyaId: row.dosyaId,
                                  tab: 'vekalet',
                                  taksitId: row.taksitId
                                })
                              )
                            }
                          >
                            Dosyaya Git
                          </button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <p className="text-xs text-ink-muted">
                Toplam {total} kayıt · Sayfa {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1 || listQ.isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Önceki
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages || listQ.isFetching}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}
