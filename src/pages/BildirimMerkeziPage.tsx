import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  getTahsilatBildirimAyarlar,
  getTahsilatBildirimOzet,
  invalidateTahsilatBildirim,
  listTahsilatBildirimIsleri,
  simuleTahsilatBildirimleri,
  TAHSILAT_BILDIRIM_QUERY_KEY
} from '../api/tahsilatBildirim'
import { friendlyClientErrorMessage } from '../api/client'
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
import { useAuth } from '../contexts/AuthContext'
import { buildMaliKontrolNavigateUrl } from '../lib/maliKontrolNavigation'
import { isYoneticiRole } from '../lib/isYonetici'
import { AnimatedNumber, Stagger, StaggerItem } from '../motion'
import { useToast } from '../toast'
import type {
  BildirimIsDurumu,
  TahsilatBildirimIsGorunum,
  TahsilatBildirimIsiDto,
  TahsilatBildirimSimulasyonOzetDto
} from '../types/tahsilatBildirim'
import {
  BILDIRIM_GORUNUM_LABEL,
  bildirimIsDurumLabel,
  bildirimKuralTuruLabel,
  readBildirimOzetCounts
} from '../types/tahsilatBildirim'
import { formatCurrencyTR, formatDateTimeTR, formatDateTR } from '../utils/formatters'

type PageTab = TahsilatBildirimIsGorunum | 'KURALLAR'

const JOB_TABS: TahsilatBildirimIsGorunum[] = ['PLANLANANLAR', 'BUGUN', 'GECMIS', 'ATLANANLAR']

function durumBadgeVariant(d: BildirimIsDurumu): 'default' | 'success' | 'warning' | 'danger' | 'primary' {
  switch (d) {
    case 'SIMULASYON_TAMAMLANDI':
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
  return row.hataOzeti || row.atlamaNedeni || row.iptalNedeni || '—'
}

function minutesToHHmm(dk: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.floor(dk)))
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0')
  const mm = String(clamped % 60).padStart(2, '0')
  return `${hh}:${mm}`
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
  const { session } = useAuth()
  const toast = useToast()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const isYonetici = isYoneticiRole(session?.user.role)

  const [tab, setTab] = useState<PageTab>('PLANLANANLAR')
  const [page, setPage] = useState(1)
  const [simOzet, setSimOzet] = useState<TahsilatBildirimSimulasyonOzetDto | null>(null)
  const limit = 50

  const gorunum: TahsilatBildirimIsGorunum | null = tab === 'KURALLAR' ? null : tab

  const listParams = useMemo(
    () => ({
      gorunum: gorunum ?? undefined,
      page,
      limit
    }),
    [gorunum, page, limit]
  )

  const ozetQ = useQuery({
    queryKey: [...TAHSILAT_BILDIRIM_QUERY_KEY, 'ozet'],
    queryFn: getTahsilatBildirimOzet,
    staleTime: 30_000
  })

  const ayarlarQ = useQuery({
    queryKey: [...TAHSILAT_BILDIRIM_QUERY_KEY, 'ayarlar'],
    queryFn: getTahsilatBildirimAyarlar,
    staleTime: 30_000
  })

  const listQ = useQuery({
    queryKey: [...TAHSILAT_BILDIRIM_QUERY_KEY, 'isler', listParams],
    queryFn: () => listTahsilatBildirimIsleri(listParams),
    enabled: tab !== 'KURALLAR'
  })

  useEffect(() => {
    setPage(1)
  }, [tab])

  const ozetCounts = readBildirimOzetCounts(ozetQ.data?.ozet ?? listQ.data?.ozet)
  const testModu = ozetCounts.testModu ?? ayarlarQ.data?.ayar.testModu ?? false

  const simuleMu = useMutation({
    mutationFn: simuleTahsilatBildirimleri,
    onSuccess: (res) => {
      setSimOzet(res.ozet)
      invalidateTahsilatBildirim(qc)
      toast.success('Bugünkü bildirimler simüle edildi.')
    },
    onError: (err) => {
      toast.error(friendlyClientErrorMessage(err, 'Simülasyon tamamlanamadı.'))
    }
  })

  const items = listQ.data?.items ?? []
  const total = listQ.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const kurallar = ayarlarQ.data?.kurallar ?? []
  const ozetLoading = ozetQ.isLoading && !ozetQ.data

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Bildirim Merkezi"
        description="Otomatik tahsilat bildirim planları, simülasyon sonuçları ve kural özeti."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {testModu ? (
              <Badge variant="warning" className="normal-case tracking-normal">
                Test modu
              </Badge>
            ) : null}
            {isYonetici ? (
              <Button
                type="button"
                size="sm"
                disabled={simuleMu.isPending}
                onClick={() => simuleMu.mutate()}
              >
                {simuleMu.isPending ? 'Simüle ediliyor…' : 'Bugünkü bildirimleri simüle et'}
              </Button>
            ) : null}
          </div>
        }
      />

      {simOzet ? (
        <AlertBox variant="info" title="Simülasyon özeti">
          İşlenen: {simOzet.processed} · Simülasyon: {simOzet.simulasyon} · Telefon atlandı:{' '}
          {simOzet.atlananTelefon} · İzin atlandı: {simOzet.atlananIzin} · Dosya atlandı:{' '}
          {simOzet.atlananDosya} · Şablon atlandı: {simOzet.atlananSablon} · Başarısız:{' '}
          {simOzet.basarisiz}
        </AlertBox>
      ) : null}

      <Stagger className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <StaggerItem>
          <CompactStat label="Bugün planlanan" value={ozetCounts.bugunPlanlanan} loading={ozetLoading} />
        </StaggerItem>
        <StaggerItem>
          <CompactStat label="Yaklaşan" value={ozetCounts.yaklasan} loading={ozetLoading} />
        </StaggerItem>
        <StaggerItem>
          <CompactStat label="Simülasyon" value={ozetCounts.simulasyon} loading={ozetLoading} />
        </StaggerItem>
        <StaggerItem>
          <CompactStat label="Atlanan" value={ozetCounts.atlanan} loading={ozetLoading} />
        </StaggerItem>
        <StaggerItem>
          <CompactStat label="Başarısız" value={ozetCounts.basarisiz} loading={ozetLoading} />
        </StaggerItem>
        <StaggerItem>
          <CompactStat label="İptal" value={ozetCounts.iptalEdilen} loading={ozetLoading} />
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
            <Button
              type="button"
              size="sm"
              variant={tab === 'KURALLAR' ? 'primary' : 'outline'}
              onClick={() => setTab('KURALLAR')}
            >
              Kurallar
            </Button>
          </div>

          {tab === 'KURALLAR' ? (
            <div className="space-y-3">
              {ayarlarQ.isLoading ? <p className="text-sm text-ink-muted">Kurallar yükleniyor…</p> : null}
              {ayarlarQ.isError ? (
                <AlertBox variant="warning" title="Kurallar yüklenemedi">
                  {friendlyClientErrorMessage(ayarlarQ.error, 'Bildirim ayarları alınamadı.')}
                </AlertBox>
              ) : null}
              {kurallar.length === 0 && !ayarlarQ.isLoading ? (
                <EmptyState
                  title="Kural bulunamadı"
                  description="Bildirim kuralları henüz oluşturulmamış."
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Kural</TH>
                        <TH>Durum</TH>
                        <TH>Zamanlama</TH>
                        <TH>Mesaj saati</TH>
                        <TH>Kanal</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {kurallar.map((k) => (
                        <TR key={k.id}>
                          <TD>{bildirimKuralTuruLabel(k.kuralTuru)}</TD>
                          <TD>
                            <Badge variant={k.aktifMi ? 'success' : 'default'}>
                              {k.aktifMi ? 'Açık' : 'Kapalı'}
                            </Badge>
                          </TD>
                          <TD>
                            {k.kuralTuru === 'VADE_GUNU'
                              ? 'Vade günü'
                              : k.kuralTuru === 'VADEDEN_ONCE'
                                ? `${k.gunOffset} gün önce`
                                : `${k.gunOffset} gün sonra`}
                          </TD>
                          <TD className="tabular-nums">{minutesToHHmm(k.gonderimSaatiDk)}</TD>
                          <TD>{k.kanal}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
              <p className="text-sm text-ink-muted">
                Kural ve şablon düzenleme için{' '}
                <Link to={`${APP_BASE}/ayarlar`} className="font-semibold text-primary hover:underline">
                  Ayarlar
                </Link>{' '}
                sayfasındaki Otomatik Tahsilat Bildirimleri kartını kullanın.
              </p>
            </div>
          ) : (
            <>
              {listQ.isError ? (
                <AlertBox variant="warning" title="Liste yüklenemedi">
                  {friendlyClientErrorMessage(listQ.error, 'Bildirim işleri alınamadı.')}
                </AlertBox>
              ) : null}

              {listQ.isLoading ? (
                <p className="text-sm text-ink-muted">Bildirimler yükleniyor…</p>
              ) : items.length === 0 ? (
                <EmptyState
                  title="Kayıt yok"
                  description={`${BILDIRIM_GORUNUM_LABEL[tab as TahsilatBildirimIsGorunum]} görünümünde bildirim işi bulunamadı.`}
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
                        <TH>Kural</TH>
                        <TH>Planlanan</TH>
                        <TH>Kanal</TH>
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
                          <TD>{row.kanal}</TD>
                          <TD>
                            <Badge variant={durumBadgeVariant(row.durum)}>{bildirimIsDurumLabel(row.durum)}</Badge>
                          </TD>
                          <TD className="max-w-[180px] truncate text-xs text-ink-muted" title={aciklamaText(row)}>
                            {aciklamaText(row)}
                          </TD>
                          <TD className="text-right">
                            <div className={tableActionsFlexRow}>
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
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
