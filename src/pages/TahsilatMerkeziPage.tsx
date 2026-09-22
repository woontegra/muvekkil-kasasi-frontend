import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listMuvekkilDosyalari } from '../api/dosyalar'
import { listMuvekkiller } from '../api/muvekkiller'
import { invalidateFinancialQueries } from '../lib/financialQueryInvalidation'
import {
  invalidateTahsilatMerkezi,
  listTahsilatMerkezi,
  TAKSILAT_MERKEZI_QUERY_KEY
} from '../api/tahsilatMerkezi'
import { createVekaletTaksitOdeme } from '../api/vekalet'
import { resolveOdemeApiError } from '../api/client'
import { TahsilatiYapanPersonelSelect } from '../components/prim/TahsilatiYapanPersonelSelect'
import { WhatsAppHatirlatModal } from '../components/tahsilat/WhatsAppHatirlatModal'
import { VekaletTaksitOdemeModal } from '../components/vekalet/VekaletTaksitOdemeModal'
import {
  MobileActionBar,
  MobileFilterPanel,
  MobileRecordCard,
  ResponsiveDataView
} from '../components/responsive'
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  ClampTooltipText,
  EmptyState,
  Input,
  PageHeader,
  StatCard,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  tableActionButtonShrinkClass,
  tableActionColMultiClass,
  tableActionsFlexRow
} from '../components/ui'
import { buildMaliKontrolNavigateUrl } from '../lib/maliKontrolNavigation'
import { formControlClass, uiType } from '../lib/uiDensity'
import { AnimatedNumber, Stagger, StaggerItem } from '../motion'
import { useToast } from '../toast'
import type { CreateVekaletTaksitOdemePayload, TaksitComputedDurumApi, VekaletTaksitiDto } from '../types/vekalet'
import type { TahsilatMerkeziGorunumFilter, TahsilatMerkeziSatirDto } from '../types/tahsilatMerkezi'
import { TAKSILAT_MERKEZI_GORUNUM_LABEL as GORUNUM_LABEL } from '../types/tahsilatMerkezi'
import { formatDateTR, formatMoney, resolveParaBirimi } from '../utils/formatters'
import { gunFarkiLabel } from './tahsilatMerkeziLabels'

const GORUNUM_TABS: TahsilatMerkeziGorunumFilter[] = [
  'GECIKENLER',
  'BUGUN',
  'YAKLASANLAR',
  'KISMI_ODENENLER',
  'TUMU'
]

const DURUM_OPTIONS: { value: '' | TaksitComputedDurumApi; label: string }[] = [
  { value: '', label: 'Tüm durumlar' },
  { value: 'GECIKTI', label: 'Gecikti' },
  { value: 'ODENMEDI', label: 'Ödenmedi' },
  { value: 'KISMI_ODENDI', label: 'Kısmi ödendi' }
]

function durumBadge(d: TaksitComputedDurumApi): 'default' | 'success' | 'warning' | 'danger' {
  if (d === 'ODENDI') return 'success'
  if (d === 'GECIKTI') return 'danger'
  if (d === 'KISMI_ODENDI') return 'warning'
  return 'default'
}

function durumLabel(d: TaksitComputedDurumApi): string {
  switch (d) {
    case 'GECIKTI':
      return 'Gecikti'
    case 'KISMI_ODENDI':
      return 'Kısmi ödendi'
    case 'ODENMEDI':
      return 'Ödenmedi'
    case 'ODENDI':
      return 'Ödendi'
    default:
      return d
  }
}

export function TahsilatMerkeziPage(): ReactElement {
  const toast = useToast()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [gorunum, setGorunum] = useState<TahsilatMerkeziGorunumFilter>('YAKLASANLAR')
  const [q, setQ] = useState('')
  const [muvekkilId, setMuvekkilId] = useState('')
  const [dosyaId, setDosyaId] = useState('')
  const [durum, setDurum] = useState<'' | TaksitComputedDurumApi>('')
  const [personelId, setPersonelId] = useState('')
  const [vadeBas, setVadeBas] = useState('')
  const [vadeBit, setVadeBit] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const [odemeRow, setOdemeRow] = useState<TahsilatMerkeziSatirDto | null>(null)
  const [whatsappRow, setWhatsappRow] = useState<TahsilatMerkeziSatirDto | null>(null)

  const listParams = useMemo(
    () => ({
      gorunum,
      q: q.trim() || undefined,
      muvekkilId: muvekkilId || undefined,
      dosyaId: dosyaId || undefined,
      durum: durum || undefined,
      personelId: personelId || undefined,
      vadeBas: vadeBas || undefined,
      vadeBit: vadeBit || undefined,
      page,
      limit
    }),
    [gorunum, q, muvekkilId, dosyaId, durum, personelId, vadeBas, vadeBit, page, limit]
  )

  const listQ = useQuery({
    queryKey: [...TAKSILAT_MERKEZI_QUERY_KEY, 'liste', listParams],
    queryFn: () => listTahsilatMerkezi(listParams)
  })

  const muvekkillerQ = useQuery({
    queryKey: ['muvekkiller', 'all'],
    queryFn: () => listMuvekkiller({ page: 1, limit: 500 })
  })
  const dosyalarQ = useQuery({
    queryKey: ['muvekkil-dosyalar', muvekkilId],
    queryFn: () => listMuvekkilDosyalari(muvekkilId, { page: 1, limit: 200 }),
    enabled: Boolean(muvekkilId)
  })

  useEffect(() => {
    setPage(1)
  }, [gorunum, q, muvekkilId, dosyaId, durum, personelId, vadeBas, vadeBit])

  useEffect(() => {
    setDosyaId('')
  }, [muvekkilId])

  const invalidateAll = (dosyaIdForVekalet?: string): void => {
    invalidateTahsilatMerkezi(qc)
    invalidateFinancialQueries(qc, {
      dosyaId: dosyaIdForVekalet,
      ofisKasa: true,
      vekalet: Boolean(dosyaIdForVekalet),
      kasa: Boolean(dosyaIdForVekalet),
      karlilik: true,
      dashboard: true,
      maliKontrol: true
    })
    if (dosyaIdForVekalet) {
      void qc.invalidateQueries({ queryKey: ['prim'] })
    }
  }

  const odemeMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateVekaletTaksitOdemePayload }) =>
      createVekaletTaksitOdeme(id, body),
    onSuccess: (res) => {
      const kalan = Number(res.taksit.kalanTutar ?? 0)
      invalidateAll(res.taksit.dosyaId)
      setOdemeRow(null)
      toast.success('Tahsilat kaydedildi.')
      if (kalan <= 0.001) {
        toast.success('Taksit tamamen kapandı.')
      }
    },
    onError: () => {
      toast.error('Tahsilat kaydedilemedi.')
    }
  })

  const ozet = listQ.data?.ozet
  const items = listQ.data?.items ?? []
  const total = listQ.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Tahsilat Takibi"
        description="Vadesi yaklaşan, bugün vadesi gelen, gecikmiş ve kısmi ödenmiş vekalet taksitleri."
      />

      <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Gecikmiş taksit"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={ozet?.gecikmisAdet ?? 0} format={(n) => String(Math.round(n))} />
              )
            }
            sub="Tutarlar listede para birimine göre"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Bugün vadesi gelen"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={ozet?.bugunAdet ?? 0} format={(n) => String(Math.round(n))} />
              )
            }
            sub="taksit"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Önümüzdeki 7 gün"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={ozet?.yakin7GunAdet ?? 0} format={(n) => String(Math.round(n))} />
              )
            }
            sub="taksit"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Kısmi ödenmiş"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={ozet?.kismiAdet ?? 0} format={(n) => String(Math.round(n))} />
              )
            }
            sub="taksit · kalan tutar listede"
          />
        </StaggerItem>
      </Stagger>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {GORUNUM_TABS.map((g) => (
              <Button
                key={g}
                type="button"
                size="sm"
                variant={gorunum === g ? 'primary' : 'outline'}
                onClick={() => setGorunum(g)}
              >
                {GORUNUM_LABEL[g]}
              </Button>
            ))}
          </div>

          <MobileFilterPanel
            activeCount={[q, muvekkilId, dosyaId, durum, personelId, vadeBas, vadeBit].filter(Boolean).length}
            onApply={() => setPage(1)}
            onReset={() => {
              setQ('')
              setMuvekkilId('')
              setDosyaId('')
              setDurum('')
              setPersonelId('')
              setVadeBas('')
              setVadeBit('')
              setPage(1)
            }}
            primary={<Input label="Ara" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Müvekkil, dosya…" />}
          >
            <div>
              <label className={uiType.label}>Müvekkil</label>
              <select
                className={formControlClass}
                value={muvekkilId}
                onChange={(e) => setMuvekkilId(e.target.value)}
              >
                <option value="">Tümü</option>
                {(muvekkillerQ.data?.items ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.gorunenAd}
                  </option>
                ))}
              </select>
            </div>
            <DosyaSelect
              dosyaId={dosyaId}
              onChange={setDosyaId}
              dosyalar={dosyalarQ.data?.items ?? []}
              disabled={!muvekkilId}
            />
            <div>
              <label className={uiType.label}>Ödeme durumu</label>
              <select
                className={formControlClass}
                value={durum}
                onChange={(e) => setDurum(e.target.value as '' | TaksitComputedDurumApi)}
              >
                {DURUM_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Vade başlangıç"
              type="date"
              value={vadeBas}
              onChange={(e) => setVadeBas(e.target.value)}
              placeholder="Tarih seçin"
            />
            <Input
              label="Vade bitiş"
              type="date"
              value={vadeBit}
              onChange={(e) => setVadeBit(e.target.value)}
              placeholder="Tarih seçin"
            />
            <div className="md:col-span-2">
              <TahsilatiYapanPersonelSelect value={personelId} onChange={setPersonelId} />
            </div>
          </MobileFilterPanel>

          {listQ.isError ? (
            <AlertBox variant="danger" title="Liste yüklenemedi">
              {listQ.error instanceof Error ? listQ.error.message : 'Bilinmeyen hata'}
            </AlertBox>
          ) : null}

          <ResponsiveDataView
            isLoading={listQ.isLoading}
            loading={<p className="py-6 text-[11px] text-ink-muted">Tahsilat bekleyenler yükleniyor…</p>}
            isEmpty={!listQ.isLoading && items.length === 0}
            empty={
              <EmptyState
                title="Kayıt yok"
                description="Seçili görünüm ve filtrelere uygun açık taksit bulunamadı."
              />
            }
            table={
              <div className="min-w-0 max-w-full">
                <Table data-testid="tahsilat-merkezi-table">
                  <THead>
                    <TR>
                      <TH className="min-w-0">Müvekkil</TH>
                      <TH className="min-w-0">Dosya</TH>
                      <TH className="min-w-0">Taksit</TH>
                      <TH className="whitespace-nowrap text-right">Tutar</TH>
                      <TH className="whitespace-nowrap text-right">Ödenen</TH>
                      <TH className="whitespace-nowrap text-right">Kalan</TH>
                      <TH className="whitespace-nowrap">Vade</TH>
                      <TH className="whitespace-nowrap">Süre</TH>
                      <TH className="whitespace-nowrap">Durum</TH>
                      <TH className={tableActionColMultiClass}>İşlem</TH>
                    </TR>
                  </THead>
                  <TBody>
                    <AnimatePresence initial={false}>
                      {items.map((row) => (
                        <ListeSatir
                          key={row.id}
                          row={row}
                          onOdeme={() => {
                            odemeMu.reset()
                            setOdemeRow(row)
                          }}
                          onWhatsapp={() => setWhatsappRow(row)}
                          onEkstreAc={() =>
                            navigate(
                              buildMaliKontrolNavigateUrl({
                                muvekkilId: row.muvekkilId,
                                dosyaId: row.dosyaId,
                                tab: 'ekstre'
                              })
                            )
                          }
                          onDosya={() =>
                            navigate(
                              buildMaliKontrolNavigateUrl({
                                muvekkilId: row.muvekkilId,
                                dosyaId: row.dosyaId,
                                tab: 'vekalet',
                                taksitId: row.id
                              })
                            )
                          }
                        />
                      ))}
                    </AnimatePresence>
                  </TBody>
                </Table>
              </div>
            }
            cards={
              <>
                {items.map((row) => {
                  const taksitLabel = row.taksitAciklama?.trim()
                    ? `#${row.taksitNo} - ${row.taksitAciklama}`
                    : `Taksit #${row.taksitNo}`
                  return (
                    <MobileRecordCard
                      key={row.id}
                      title={row.muvekkilAd}
                      subtitle={
                        <>
                          {row.dosyaBaslik}
                          {row.dosyaNo ? ` · ${row.dosyaNo}` : ''}
                        </>
                      }
                      badge={<Badge variant={durumBadge(row.durum)}>{durumLabel(row.durum)}</Badge>}
                      fields={[
                        { label: 'Taksit', value: taksitLabel, full: true },
                        {
                          label: 'Tutar',
                          value: formatMoney(Number(row.taksitTutari), resolveParaBirimi(row.taksit.paraBirimi)),
                          numeric: true
                        },
                        {
                          label: 'Ödenen',
                          value: formatMoney(Number(row.odenenToplam), resolveParaBirimi(row.taksit.paraBirimi)),
                          numeric: true
                        },
                        {
                          label: 'Kalan',
                          value: formatMoney(Number(row.kalanTutar), resolveParaBirimi(row.taksit.paraBirimi)),
                          numeric: true
                        },
                        { label: 'Vade', value: formatDateTR(`${row.vadeTarihi}T12:00:00.000Z`) },
                        {
                          label: 'Süre',
                          value: (
                            <span className={row.gunFarki < 0 ? 'font-medium text-danger' : undefined}>
                              {gunFarkiLabel(row.gunFarki)}
                            </span>
                          )
                        }
                      ]}
                      actions={
                        <MobileActionBar
                          items={[
                            {
                              key: 'odeme',
                              label: 'Ödeme Al',
                              primary: true,
                              onClick: () => {
                                odemeMu.reset()
                                setOdemeRow(row)
                              }
                            },
                            {
                              key: 'wa',
                              label: 'WhatsApp’tan Gönder',
                              primary: true,
                              variant: 'outline',
                              onClick: () => setWhatsappRow(row)
                            },
                            {
                              key: 'ekstre',
                              label: 'Ekstre Aç',
                              variant: 'outline',
                              onClick: () =>
                                navigate(
                                  buildMaliKontrolNavigateUrl({
                                    muvekkilId: row.muvekkilId,
                                    dosyaId: row.dosyaId,
                                    tab: 'ekstre'
                                  })
                                )
                            },
                            {
                              key: 'dosya',
                              label: 'Dosyaya Git',
                              variant: 'outline',
                              onClick: () =>
                                navigate(
                                  buildMaliKontrolNavigateUrl({
                                    muvekkilId: row.muvekkilId,
                                    dosyaId: row.dosyaId,
                                    tab: 'vekalet',
                                    taksitId: row.id
                                  })
                                )
                            }
                          ]}
                        />
                      }
                    />
                  )
                })}
              </>
            }
          />

          {total > limit ? (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink-muted">
                Toplam {total} kayıt · Sayfa {page}/{totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Önceki
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {odemeRow ? (
        <VekaletTaksitOdemeModal
          key={odemeRow.id}
          taksit={odemeRow.taksit as VekaletTaksitiDto}
          dosyaId={odemeRow.dosyaId}
          onClose={() => {
            odemeMu.reset()
            setOdemeRow(null)
          }}
          loading={odemeMu.isPending}
          error={resolveOdemeApiError(odemeMu.error)}
          onSubmit={(body) => odemeMu.mutate({ id: odemeRow.id, body })}
          onStaleSummary={() => invalidateAll(odemeRow.dosyaId)}
        />
      ) : null}

      {whatsappRow ? <WhatsAppHatirlatModal row={whatsappRow} onClose={() => setWhatsappRow(null)} /> : null}
    </div>
  )
}

function DosyaSelect(props: {
  dosyaId: string
  onChange: (v: string) => void
  dosyalar: { id: string; konuBasligi: string; dosyaNo: string | null }[]
  disabled: boolean
}): ReactElement {
  return (
    <div>
      <label className={uiType.label}>Dosya</label>
      <select
        className={formControlClass}
        value={props.dosyaId}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
      >
        <option value="">Tümü</option>
        {props.dosyalar.map((d) => (
          <option key={d.id} value={d.id}>
            {d.konuBasligi}
            {d.dosyaNo ? ` (${d.dosyaNo})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

function ListeSatir(props: {
  row: TahsilatMerkeziSatirDto
  onOdeme: () => void
  onWhatsapp: () => void
  onEkstreAc: () => void
  onDosya: () => void
}): ReactElement {
  const { row, onOdeme, onWhatsapp, onEkstreAc, onDosya } = props
  const taksitLabel = row.taksitAciklama?.trim()
    ? `#${row.taksitNo} - ${row.taksitAciklama}`
    : `Taksit #${row.taksitNo}`
  const rowPb = resolveParaBirimi(row.taksit.paraBirimi)

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ duration: 0.2 }}
      className="border-b border-border"
      data-testid="tahsilat-merkezi-row"
    >
      <TD className="min-w-0 font-medium">
        <ClampTooltipText text={row.muvekkilAd} lines={1} />
      </TD>
      <TD className="min-w-0">
        <ClampTooltipText text={row.dosyaBaslik} lines={1} />
        {row.dosyaNo ? (
          <div className="truncate text-xs text-ink-muted" title={row.dosyaNo}>
            {row.dosyaNo}
          </div>
        ) : null}
      </TD>
      <TD className="min-w-0">
        <ClampTooltipText text={taksitLabel} lines={1} />
      </TD>
      <TD className="whitespace-nowrap text-right tabular-nums">
        {formatMoney(Number(row.taksitTutari), rowPb)}
      </TD>
      <TD className="whitespace-nowrap text-right tabular-nums">
        {formatMoney(Number(row.odenenToplam), rowPb)}
      </TD>
      <TD className="whitespace-nowrap text-right tabular-nums font-semibold">
        {formatMoney(Number(row.kalanTutar), rowPb)}
      </TD>
      <TD className="whitespace-nowrap">{formatDateTR(`${row.vadeTarihi}T12:00:00.000Z`)}</TD>
      <TD
        className={
          row.gunFarki < 0
            ? 'whitespace-nowrap font-medium text-danger'
            : 'whitespace-nowrap text-ink-muted'
        }
      >
        {gunFarkiLabel(row.gunFarki)}
      </TD>
      <TD className="whitespace-nowrap">
        <Badge variant={durumBadge(row.durum)}>{durumLabel(row.durum)}</Badge>
      </TD>
      <TD className={tableActionColMultiClass} data-testid="tahsilat-merkezi-islem-cell">
        <div className={tableActionsFlexRow} data-testid="tahsilat-merkezi-islem-actions">
          <Button type="button" size="table" className={tableActionButtonShrinkClass} onClick={onOdeme}>
            Ödeme Al
          </Button>
          <Button
            type="button"
            size="table"
            variant="outline"
            className={tableActionButtonShrinkClass}
            onClick={onWhatsapp}
          >
            WhatsApp'tan Gönder
          </Button>
          <Button
            type="button"
            size="table"
            variant="outline"
            className={tableActionButtonShrinkClass}
            onClick={onEkstreAc}
          >
            Ekstre Aç
          </Button>
          <Button
            type="button"
            size="table"
            variant="outline"
            className={tableActionButtonShrinkClass}
            onClick={onDosya}
          >
            Dosyaya Git
          </Button>
        </div>
      </TD>
    </motion.tr>
  )
}
