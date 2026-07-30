import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { invalidateDashboardSummary } from '../api/dashboard'
import { listMuvekkilDosyalari } from '../api/dosyalar'
import { listMuvekkiller } from '../api/muvekkiller'
import { invalidateSmmBekleyen } from '../api/smm'
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
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  StatCard,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  tableActionButtonShrinkClass,
  tableActionsFlexRow
} from '../components/ui'
import { buildMaliKontrolNavigateUrl } from '../lib/maliKontrolNavigation'
import { AnimatedNumber, Stagger, StaggerItem } from '../motion'
import { useToast } from '../toast'
import type { CreateVekaletTaksitOdemePayload, TaksitComputedDurumApi, VekaletTaksitiDto } from '../types/vekalet'
import type { TahsilatMerkeziGorunumFilter, TahsilatMerkeziSatirDto } from '../types/tahsilatMerkezi'
import { TAKSILAT_MERKEZI_GORUNUM_LABEL as GORUNUM_LABEL } from '../types/tahsilatMerkezi'
import { formatCurrencyTR, formatDateTR } from '../utils/formatters'

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

function gunFarkiLabel(gun: number): string {
  if (gun < 0) return `${Math.abs(gun)} gün gecikti`
  if (gun === 0) return 'Bugün'
  return `${gun} gün kaldı`
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
    invalidateDashboardSummary(qc)
    invalidateSmmBekleyen(qc)
    if (dosyaIdForVekalet) {
      void qc.invalidateQueries({ queryKey: ['vekalet', dosyaIdForVekalet] })
      void qc.invalidateQueries({ queryKey: ['ofis-kasa'] })
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
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">Tahsilat Merkezi</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Vadesi yaklaşan, bugün vadesi gelen, gecikmiş ve kısmi ödenmiş vekalet taksitleri.
        </p>
      </div>

      <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Gecikmiş alacak"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={Number(ozet?.gecikmisToplam ?? 0)} format={(n) => formatCurrencyTR(n)} />
              )
            }
            sub={ozet ? `${ozet.gecikmisAdet} taksit` : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Bugün tahsilat"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={Number(ozet?.bugunToplam ?? 0)} format={(n) => formatCurrencyTR(n)} />
              )
            }
            sub={ozet ? `${ozet.bugunAdet} taksit` : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Önümüzdeki 7 gün"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={Number(ozet?.yakin7GunToplam ?? 0)} format={(n) => formatCurrencyTR(n)} />
              )
            }
            sub={ozet ? `${ozet.yakin7GunAdet} taksit` : undefined}
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Kısmi ödenmiş kalan"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={Number(ozet?.kismiToplam ?? 0)} format={(n) => formatCurrencyTR(n)} />
              )
            }
            sub={ozet ? `${ozet.kismiAdet} taksit` : undefined}
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

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input label="Ara" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Müvekkil, dosya…" />
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Müvekkil</label>
              <select
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
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
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme durumu</label>
              <select
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
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
          </div>

          {listQ.isError ? (
            <AlertBox variant="danger" title="Liste yüklenemedi">
              {listQ.error instanceof Error ? listQ.error.message : 'Bilinmeyen hata'}
            </AlertBox>
          ) : null}

          {listQ.isLoading ? (
            <p className="py-6 text-sm text-ink-muted">Tahsilat bekleyenler yükleniyor…</p>
          ) : items.length === 0 ? (
            <EmptyState
              title="Kayıt yok"
              description="Seçili görünüm ve filtrelere uygun açık taksit bulunamadı."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Müvekkil</TH>
                    <TH>Dosya</TH>
                    <TH>Taksit</TH>
                    <TH className="text-right">Tutar</TH>
                    <TH className="text-right">Ödenen</TH>
                    <TH className="text-right">Kalan</TH>
                    <TH>Vade</TH>
                    <TH>Süre</TH>
                    <TH>Durum</TH>
                    <TH>İşlem</TH>
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
          )}

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
          onClose={() => {
            odemeMu.reset()
            setOdemeRow(null)
          }}
          loading={odemeMu.isPending}
          error={resolveOdemeApiError(odemeMu.error)}
          onSubmit={(body) => odemeMu.mutate({ id: odemeRow.id, body })}
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
      <label className="mb-1 block text-xs font-semibold text-ink-muted">Dosya</label>
      <select
        className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm disabled:opacity-50 dark:bg-surface-elevated"
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

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ duration: 0.2 }}
      className="border-b border-border"
    >
      <TD className="text-sm font-medium">{row.muvekkilAd}</TD>
      <TD className="text-sm">
        <div>{row.dosyaBaslik}</div>
        {row.dosyaNo ? <div className="text-xs text-ink-muted">{row.dosyaNo}</div> : null}
      </TD>
      <TD className="text-sm">{taksitLabel}</TD>
      <TD className="text-right tabular-nums text-sm">{formatCurrencyTR(Number(row.taksitTutari))}</TD>
      <TD className="text-right tabular-nums text-sm">{formatCurrencyTR(Number(row.odenenToplam))}</TD>
      <TD className="text-right tabular-nums text-sm font-semibold">{formatCurrencyTR(Number(row.kalanTutar))}</TD>
      <TD className="whitespace-nowrap text-sm">{formatDateTR(`${row.vadeTarihi}T12:00:00.000Z`)}</TD>
      <TD className={row.gunFarki < 0 ? 'text-sm font-medium text-danger' : 'text-sm text-ink-muted'}>
        {gunFarkiLabel(row.gunFarki)}
      </TD>
      <TD>
        <Badge variant={durumBadge(row.durum)}>{durumLabel(row.durum)}</Badge>
      </TD>
      <TD>
        <div className={tableActionsFlexRow}>
          <Button type="button" size="sm" className={tableActionButtonShrinkClass} onClick={onOdeme}>
            Ödeme Al
          </Button>
          <Button type="button" size="sm" variant="outline" className={tableActionButtonShrinkClass} onClick={onWhatsapp}>
            WhatsApp’tan Gönder
          </Button>
          <Button type="button" size="sm" variant="outline" className={tableActionButtonShrinkClass} onClick={onEkstreAc}>
            Ekstre Aç
          </Button>
          <Button type="button" size="sm" variant="outline" className={tableActionButtonShrinkClass} onClick={onDosya}>
            Dosyaya Git
          </Button>
        </div>
      </TD>
    </motion.tr>
  )
}
