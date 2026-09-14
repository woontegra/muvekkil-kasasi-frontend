import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { invalidateDashboardSummary } from '../api/dashboard'
import {
  approveOfisKasaHareketi,
  createOfisKasaDovizDonusum,
  createOfisKasaDuzeltme,
  createOfisKasaHareketi,
  deleteOfisKasaDovizDonusum,
  deleteOfisKasaHareketi,
  getOfisKasaOzet,
  guvenliOfisGiderSil,
  listOfisKasaHareketleri,
  rejectOfisKasaHareketi
} from '../api/ofisKasasi'
import { MasrafGuvenliSilModal } from '../components/kasa/MasrafGuvenliSilModal'
import { OfisKasaHareketTableRow } from '../components/ofisKasa/OfisKasaHareketTableRow'
import { OfisKasaIslemTipiCell } from '../components/ofisKasa/OfisKasaIslemTipiCell'
import { ofisHareketAciklamaOzet, resolveOfisGuvenliIslemMode } from '../lib/ofisKasaGuvenliSil'
import {
  isOfisDuzeltmeTipi,
  OFIS_DUZELTME_MOBILE_CARD_CLASS,
  OFIS_DUZELTME_TUTAR_CLASS
} from '../lib/ofisKasaDuzeltmeStil'
import { isBuroSahibiRole } from '../lib/isBuroSahibi'
import { MuvekkilOptionalSelect } from '../components/muvekkil/MuvekkilOptionalSelect'
import { TahsilatiYapanPersonelSelect } from '../components/prim/TahsilatiYapanPersonelSelect'
import { useAuth } from '../contexts/AuthContext'
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  MoneyInput,
  PageHeader,
  StatCard,
  Table,
  TBody,
  TH,
  THead,
  TR,
  useConfirm,
  DraggablePanel,
  tableActionColClass
} from '../components/ui'
import {
  MobileActionBar,
  MobileFilterPanel,
  MobileRecordCard,
  ResponsiveDataView
} from '../components/responsive'
import { useToast } from '../toast'
import { cn } from '../lib/cn'
import { formControlClass, uiType } from '../lib/uiDensity'

import type {
  OfisKasaHareketiDto,
  OfisKasaIslemTipiApi,
  OfisKasaOdemeYontemiApi,
  OfisKasaOnayDurumuApi
} from '../types/ofisKasasi'
import { CurrencyBalanceCards, MultiCurrencyTotals } from '../components/paraBirimi/MultiCurrencyTotals'
import { ParaBirimiFilterSelect, ParaBirimiSelect } from '../components/paraBirimi/ParaBirimiSelect'
import { previewDovizDonusumKur } from '../lib/crossCurrencyPayment'
import { TcmbCrossRatePanel } from '../components/kurlar/TcmbCrossRatePanel'
import { useCrossCurrencyTcmb } from '../hooks/useCrossCurrencyTcmb'
import {
  finansKalemleriQueryKey,
  listFinansKalemleri
} from '../api/finansKalemleri'
import {
  isDigerGelirKalemAd,
  isDigerGiderKalemAd,
  OFIS_KASA_SYSTEM_FILTER_LABELS
} from '../types/finansKalemi'
import {
  type CreateOfisKasaDovizDonusumPayload,
  type CreateOfisKasaHareketiPayload
} from '../types/ofisKasasi'
import {
  formatDateTR,
  formatSignedMoney,
  parseCurrencyInputTR,
  parsePosTutar,
  resolveParaBirimi,
  type ParaBirimi
} from '../utils/formatters'

const ODEME_OPTIONS: { value: OfisKasaOdemeYontemiApi; label: string }[] = [
  { value: 'NAKIT', label: 'Nakit' },
  { value: 'BANKA', label: 'Banka' },
  { value: 'KREDI_KARTI', label: 'Kredi kartı' },
  { value: 'DIGER', label: 'Diğer' }
]

function todayInputDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function dateInputToIsoUtcNoon(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`
}

function tipLabel(t: OfisKasaIslemTipiApi): string {
  switch (t) {
    case 'GELIR':
      return 'Gelir'
    case 'GIDER':
      return 'Gider'
    case 'DUZELTME':
      return 'Düzeltme'
    case 'DOVIZ_CIKIS':
      return 'Döviz çıkış'
    case 'DOVIZ_GIRIS':
      return 'Döviz giriş'
    default:
      return t
  }
}

function hareketParaBirimi(h: OfisKasaHareketiDto): ParaBirimi {
  return resolveParaBirimi(h.paraBirimi)
}

function onayLabel(o: OfisKasaOnayDurumuApi): string {
  switch (o) {
    case 'ONAYSIZ':
      return 'Onaysız'
    case 'ONAYLI':
      return 'Onaylı'
    case 'REDDEDILDI':
      return 'Reddedildi'
    default:
      return o
  }
}

function odemeLabel(v: OfisKasaOdemeYontemiApi): string {
  return ODEME_OPTIONS.find((x) => x.value === v)?.label ?? v
}

function signedTutar(h: OfisKasaHareketiDto): number {
  const v = Number(h.tutar)
  if (h.islemTipi === 'GIDER') return -v
  return v
}

function isYonetici(role: string | undefined): boolean {
  return role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI'
}

function canCreateHareket(role: string | undefined): boolean {
  return role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI' || role === 'KATIP_PERSONEL'
}

function muvekkilAdiFromHareket(h: OfisKasaHareketiDto): string {
  const ad = h.muvekkil?.gorunenAd?.trim() || h.muvekkilAdiSnapshot?.trim()
  if (!ad) return '—'
  if (h.muvekkil?.aktifMi === false) return `${ad} (pasif)`
  return ad
}

export function OfisKasasiPage(): ReactElement {
  const { session } = useAuth()
  const role = session?.user.role
  const queryClient = useQueryClient()
  const toast = useToast()
  const { confirm } = useConfirm()
  const yonetici = isYonetici(role)
  const olusturabilir = canCreateHareket(role)

  const [q, setQ] = useState('')
  const [filterMuvekkilId, setFilterMuvekkilId] = useState('')
  const [filterMuvekkilLabel, setFilterMuvekkilLabel] = useState('')
  const [islemTipi, setIslemTipi] = useState<'' | OfisKasaIslemTipiApi>('')
  const [onayDurumu, setOnayDurumu] = useState<'' | OfisKasaOnayDurumuApi>('')
  const [kategori, setKategori] = useState('')
  const [filterParaBirimi, setFilterParaBirimi] = useState<'' | ParaBirimi>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const listParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      muvekkilId: filterMuvekkilId || undefined,
      islemTipi: islemTipi || undefined,
      onayDurumu: onayDurumu || undefined,
      kategori: kategori.trim() || undefined,
      paraBirimi: filterParaBirimi || undefined,
      startDate: startDate ? dateInputToIsoUtcNoon(startDate) : undefined,
      endDate: endDate ? dateInputToIsoUtcNoon(endDate) : undefined,
      page,
      limit
    }),
    [q, filterMuvekkilId, islemTipi, onayDurumu, kategori, filterParaBirimi, startDate, endDate, page, limit]
  )

  const ozetQuery = useQuery({
    queryKey: ['ofis-kasasi-ozet'],
    queryFn: getOfisKasaOzet
  })

  const gelirKalemleriQuery = useQuery({
    queryKey: finansKalemleriQueryKey({ tur: 'GELIR', aktif: 'true' }),
    queryFn: () => listFinansKalemleri({ tur: 'GELIR', aktif: 'true' }),
    staleTime: 60_000
  })

  const giderKalemleriQuery = useQuery({
    queryKey: finansKalemleriQueryKey({ tur: 'GIDER', aktif: 'true' }),
    queryFn: () => listFinansKalemleri({ tur: 'GIDER', aktif: 'true' }),
    staleTime: 60_000
  })

  const listQuery = useQuery({
    queryKey: ['ofis-kasasi-hareketleri', listParams],
    queryFn: () => listOfisKasaHareketleri(listParams)
  })

  const invalidateAll = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['ofis-kasasi-ozet'] })
    void queryClient.invalidateQueries({ queryKey: ['ofis-kasasi-hareketleri'] })
    void queryClient.invalidateQueries({ queryKey: ['muvekkil-karlilik'] })
    invalidateDashboardSummary(queryClient)
  }

  const approveMu = useMutation({
    mutationFn: (id: string) => approveOfisKasaHareketi(id),
    onSuccess: () => {
      invalidateAll()
      toast.success('Kayıt onaylandı.')
    }
  })
  const rejectMu = useMutation({
    mutationFn: ({ id, redSebebi }: { id: string; redSebebi: string }) => rejectOfisKasaHareketi(id, redSebebi),
    onSuccess: () => {
      invalidateAll()
      toast.warning('Kayıt reddedildi.')
    }
  })
  const deleteMu = useMutation({
    mutationFn: (id: string) => deleteOfisKasaHareketi(id),
    onSuccess: () => {
      invalidateAll()
      toast.success('Kayıt silindi.')
    }
  })
  const guvenliSilMu = useMutation({
    mutationFn: ({
      id,
      sifre,
      deleteReason
    }: {
      id: string
      sifre: string
      deleteReason: string
    }) => guvenliOfisGiderSil(id, { sifre, deleteReason }),
    onSuccess: (res) => {
      invalidateAll()
      setGuvenliSilFor(null)
      toast.success(res.message || 'Masraf silindi ve denetim kaydı oluşturuldu')
    }
  })
  const duzeltmeMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { tarih: string; tutar: number; aciklama: string; odemeYontemi: OfisKasaOdemeYontemiApi } }) =>
      createOfisKasaDuzeltme(id, body),
    onSuccess: () => {
      invalidateAll()
      toast.success('Düzeltme oluşturuldu.')
    }
  })
  const createMu = useMutation({
    mutationFn: (body: CreateOfisKasaHareketiPayload) => createOfisKasaHareketi(body),
    onSuccess: () => {
      invalidateAll()
      toast.success('Ofis kasa hareketi kaydedildi.')
    }
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [dovizOpen, setDovizOpen] = useState(false)
  const [rejectFor, setRejectFor] = useState<OfisKasaHareketiDto | null>(null)
  const [duzeltFor, setDuzeltFor] = useState<OfisKasaHareketiDto | null>(null)
  const [guvenliSilFor, setGuvenliSilFor] = useState<OfisKasaHareketiDto | null>(null)

  const dovizDeleteMu = useMutation({
    mutationFn: (dovizDonusumId: string) => deleteOfisKasaDovizDonusum(dovizDonusumId),
    onSuccess: () => {
      invalidateAll()
      toast.success('Döviz dönüşümü silindi.')
    }
  })
  const dovizCreateMu = useMutation({
    mutationFn: (body: CreateOfisKasaDovizDonusumPayload) => createOfisKasaDovizDonusum(body),
    onSuccess: () => {
      invalidateAll()
      toast.success('Döviz dönüşümü kaydedildi (onay bekliyor).')
    }
  })

  const ozet = ozetQuery.data?.ozet
  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const kategoriFilterOptions = useMemo(() => {
    const s = new Set<string>(OFIS_KASA_SYSTEM_FILTER_LABELS)
    for (const k of gelirKalemleriQuery.data?.items ?? []) s.add(k.ad)
    for (const k of giderKalemleriQuery.data?.items ?? []) s.add(k.ad)
    for (const h of items) {
      if (h.kategori?.trim()) s.add(h.kategori.trim())
    }
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [gelirKalemleriQuery.data?.items, giderKalemleriQuery.data?.items, items])

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Ofis Kasası"
        description="Büronun dosya dışı gelir ve giderleri. Müvekkil dosya kasasından tamamen ayrıdır; yalnızca onaylı kayıtlar bakiyeye yansır."
      />

      {ozetQuery.isError ? (
        <AlertBox variant="danger" title="Özet yüklenemedi">
          {ozetQuery.error instanceof Error ? ozetQuery.error.message : 'Hata'}
        </AlertBox>
      ) : null}
      {listQuery.isError ? (
        <AlertBox variant="danger" title="Liste yüklenemedi">
          {listQuery.error instanceof Error ? listQuery.error.message : 'Hata'}
        </AlertBox>
      ) : null}

      <CurrencyBalanceCards bakiyeler={ozet?.bakiyeler} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Bu ay gelir (onaylı)"
          value={
            ozet?.byCurrency ? (
              <MultiCurrencyTotals
                amounts={{
                  TRY: ozet.byCurrency.TRY.buAyGelir,
                  USD: ozet.byCurrency.USD.buAyGelir,
                  EUR: ozet.byCurrency.EUR.buAyGelir
                }}
                compact
              />
            ) : (
              '—'
            )
          }
          sub="Para birimine göre ayrı"
          className="border border-emerald-300/60 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/25"
        />
        <StatCard
          label="Bu ay gider (onaylı)"
          value={
            ozet?.byCurrency ? (
              <MultiCurrencyTotals
                amounts={{
                  TRY: ozet.byCurrency.TRY.buAyGider,
                  USD: ozet.byCurrency.USD.buAyGider,
                  EUR: ozet.byCurrency.EUR.buAyGider
                }}
                compact
              />
            ) : (
              '—'
            )
          }
          sub="Giderler yalnızca TRY"
          className="border border-orange-400/50 bg-orange-50/85 dark:border-orange-900/45 dark:bg-orange-950/25"
        />
        <StatCard
          label="Onaysız işlem"
          value={ozet ? String(ozet.onaysizIslemSayisi) : '—'}
          sub="Onay bekliyor"
          className="border border-amber-400/55 bg-amber-50/90 dark:border-amber-900/45 dark:bg-amber-950/25"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Hareketler</CardTitle>
            <p className="mt-1 text-xs text-ink-muted">Filtreleyin; yeni kayıt varsayılan olarak onaysızdır.</p>
          </div>
          {olusturabilir ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                Yeni Ofis Kasa Hareketi
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setDovizOpen(true)}>
                Döviz dönüşümü
              </Button>
            </div>
          ) : (
            <p className="text-xs text-ink-muted">Hareket eklemek için yetkiniz yok.</p>
          )}
        </CardHeader>
        <CardBody className="space-y-4 p-4">
          <MobileFilterPanel
            className="min-w-0 max-w-full overflow-x-clip"
            desktopInlineToolbar
            activeCount={[q, filterMuvekkilId, islemTipi, kategori, filterParaBirimi, onayDurumu, startDate, endDate].filter(Boolean).length}
            onApply={() => setPage(1)}
            onReset={() => {
              setQ('')
              setFilterMuvekkilId('')
              setFilterMuvekkilLabel('')
              setIslemTipi('')
              setOnayDurumu('')
              setKategori('')
              setFilterParaBirimi('')
              setStartDate('')
              setEndDate('')
              setPage(1)
            }}
            desktopFiltersClassName="!mt-0"
            mobileFiltersClassName="grid w-full grid-cols-1 gap-3"
            primary={
              <div className="w-full md:w-[260px] md:shrink-0">
                <Input
                  label="Arama"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Belge, açıklama…"
                />
              </div>
            }
          >
            <div className="w-full md:w-[180px] md:shrink-0">
              <MuvekkilOptionalSelect
                label="Müvekkil"
                valueId={filterMuvekkilId}
                valueLabel={filterMuvekkilLabel}
                placeholder="Müvekkil seçin"
                onChange={(next) => {
                  setFilterMuvekkilId(next?.id ?? '')
                  setFilterMuvekkilLabel(next?.gorunenAd ?? '')
                  setPage(1)
                }}
              />
            </div>
            <div className="w-full md:w-[135px] md:shrink-0">
              <label className={uiType.label}>İşlem tipi</label>
              <select
                className={formControlClass}
                value={islemTipi}
                onChange={(e) => setIslemTipi(e.target.value as '' | OfisKasaIslemTipiApi)}
              >
                <option value="">Tümü</option>
                <option value="GELIR">Gelir</option>
                <option value="GIDER">Gider</option>
                <option value="DUZELTME">Düzeltme</option>
              </select>
            </div>
            <div className="w-full md:w-[170px] md:shrink-0">
              <label className={uiType.label}>Kategori</label>
              <select
                className={formControlClass}
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
              >
                <option value="">Tümü</option>
                {kategoriFilterOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full md:w-[140px] md:shrink-0">
              <ParaBirimiFilterSelect
                label="Para birimi"
                value={filterParaBirimi}
                onChange={(v) => {
                  setFilterParaBirimi(v)
                  setPage(1)
                }}
              />
            </div>
            <div className="w-full md:w-[115px] md:shrink-0">
              <label className={uiType.label}>Onay</label>
              <select
                className={formControlClass}
                value={onayDurumu}
                onChange={(e) => setOnayDurumu(e.target.value as '' | OfisKasaOnayDurumuApi)}
              >
                <option value="">Tümü</option>
                <option value="ONAYSIZ">Onaysız</option>
                <option value="ONAYLI">Onaylı</option>
                <option value="REDDEDILDI">Reddedildi</option>
              </select>
            </div>
            <div
              className="ofis-kasa-date-range flex w-full shrink-0 gap-2 md:w-auto"
              data-testid="ofis-kasa-date-range"
            >
              <div className="min-w-0 flex-1 md:w-[142px] md:flex-none">
                <Input
                  label="Başlangıç"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="min-w-0 flex-1 md:w-[142px] md:flex-none">
                <Input
                  label="Bitiş"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </MobileFilterPanel>

          <ResponsiveDataView
            isLoading={listQuery.isLoading}
            loading={<p className="py-6 text-center text-sm text-ink-muted">Yükleniyor…</p>}
            isEmpty={!listQuery.isLoading && items.length === 0}
            empty={<p className="py-6 text-center text-sm text-ink-muted">Kayıt yok.</p>}
            table={
              <Table data-testid="ofis-hareket-table">
                <colgroup>
                  {/* PB yok — tutar sembolü yeterli; dar viewport’ta Ödeme/Belge col gizlenir */}
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '9%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '11%' }} />
                  <col className="hidden xl:[display:table-column]" style={{ width: '5%' }} />
                  <col className="hidden xl:[display:table-column]" style={{ width: '7%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <THead>
                  <TR>
                    <TH className="whitespace-nowrap">Tarih</TH>
                    <TH className="whitespace-nowrap">Tip</TH>
                    <TH className="hidden whitespace-nowrap md:table-cell">Müvekkil</TH>
                    <TH className="whitespace-nowrap">Kategori</TH>
                    <TH>Açıklama</TH>
                    <TH className="whitespace-nowrap text-right">Tutar</TH>
                    <TH className="hidden whitespace-nowrap xl:table-cell">Ödeme</TH>
                    <TH className="hidden whitespace-nowrap xl:table-cell">Belge no</TH>
                    <TH className="whitespace-nowrap">Onay</TH>
                    <TH className={cn(tableActionColClass)}>İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.map((h) => {
                    const signed = signedTutar(h)
                    return (
                      <OfisKasaHareketTableRow
                        key={h.id}
                        hareket={h}
                        role={role}
                        yonetici={yonetici}
                        muvekkilAdi={muvekkilAdiFromHareket(h)}
                        signed={signed}
                        paraBirimi={hareketParaBirimi(h)}
                        formatSignedMoney={formatSignedMoney}
                        odemeLabel={odemeLabel}
                        onayLabel={onayLabel}
                        approvePending={approveMu.isPending}
                        deletePending={deleteMu.isPending}
                        dovizDeletePending={dovizDeleteMu.isPending}
                        guvenliSilPending={guvenliSilMu.isPending}
                        onApprove={() => approveMu.mutate(h.id)}
                        onReject={() => setRejectFor(h)}
                        onHardDelete={() => {
                          void confirm({
                            title: 'Kayıt silinsin mi?',
                            message: 'Bu onaysız kaydı silmek istiyor musunuz?',
                            confirmLabel: 'Sil',
                            danger: true
                          }).then((ok) => {
                            if (ok) deleteMu.mutate(h.id)
                          })
                        }}
                        onDuzeltme={() => setDuzeltFor(h)}
                        onDovizDelete={() => {
                          void confirm({
                            title: 'Döviz dönüşümü silinsin mi?',
                            message: 'Kaynak ve hedef hareket birlikte silinir.',
                            confirmLabel: 'Sil',
                            danger: true
                          }).then((ok) => {
                            if (ok && h.dovizDonusumId) dovizDeleteMu.mutate(h.dovizDonusumId)
                          })
                        }}
                        onGuvenliSil={() => setGuvenliSilFor(h)}
                      />
                    )
                  })}
                </TBody>
              </Table>
            }
            cards={
              <>
                {items.map((h) => {
                  const onaysiz = h.onayDurumu === 'ONAYSIZ'
                  const onayli = h.onayDurumu === 'ONAYLI'
                  const reddedildi = h.onayDurumu === 'REDDEDILDI'
                  const signed = signedTutar(h)
                  const isDuz = isOfisDuzeltmeTipi(h.islemTipi)
                  const actions = []
                  if (onaysiz && yonetici) {
                    actions.push(
                      {
                        key: 'onay',
                        label: 'Onayla',
                        primary: true,
                        variant: 'secondary' as const,
                        disabled: approveMu.isPending,
                        onClick: () => approveMu.mutate(h.id)
                      },
                      {
                        key: 'red',
                        label: 'Reddet',
                        primary: true,
                        variant: 'outline' as const,
                        onClick: () => setRejectFor(h)
                      }
                    )
                    if (h.islemTipi !== 'GIDER') {
                      actions.push({
                        key: 'sil',
                        label: 'Sil',
                        danger: true,
                        disabled: deleteMu.isPending,
                        onClick: () => {
                          void confirm({
                            title: 'Kayıt silinsin mi?',
                            message: 'Bu onaysız kaydı silmek istiyor musunuz?',
                            confirmLabel: 'Sil',
                            danger: true
                          }).then((ok) => {
                            if (ok) deleteMu.mutate(h.id)
                          })
                        }
                      })
                    }
                  }
                  if (onayli && h.islemTipi !== 'DUZELTME' && h.islemTipi !== 'DOVIZ_CIKIS' && h.islemTipi !== 'DOVIZ_GIRIS') {
                    actions.push({
                      key: 'duzelt',
                      label: 'Düzeltme',
                      primary: true,
                      variant: 'outline' as const,
                      onClick: () => setDuzeltFor(h)
                    })
                  }
                  const guvenliMode = resolveOfisGuvenliIslemMode(h)
                  if (isBuroSahibiRole(role) && guvenliMode) {
                    actions.push({
                      key: `guvenli-${guvenliMode}`,
                      label: 'Sil',
                      danger: true,
                      disabled: guvenliSilMu.isPending,
                      onClick: () => setGuvenliSilFor(h)
                    })
                  }
                  return (
                    <MobileRecordCard
                      key={h.id}
                      className={cn(isDuz && OFIS_DUZELTME_MOBILE_CARD_CLASS, isDuz && 'ofis-duzeltme-mobile')}
                      title={h.belgeNo}
                      subtitle={h.aciklama?.trim() || tipLabel(h.islemTipi)}
                      badge={
                        <div className="flex flex-col items-end gap-1">
                          {isDuz ? <OfisKasaIslemTipiCell islemTipi={h.islemTipi} /> : null}
                          <Badge
                            variant={onayli ? 'success' : reddedildi ? 'danger' : onaysiz ? 'warning' : 'default'}
                            className="!normal-case"
                          >
                            {onayLabel(h.onayDurumu)}
                          </Badge>
                        </div>
                      }
                      fields={[
                        { label: 'Tarih', value: formatDateTR(h.tarih) },
                        {
                          label: 'Tip',
                          value: tipLabel(h.islemTipi)
                        },
                        { label: 'Müvekkil', value: muvekkilAdiFromHareket(h), full: true },
                        {
                          label: 'Kategori',
                          value: h.ozelKategoriAdi?.trim() ? `${h.kategori} (${h.ozelKategoriAdi})` : h.kategori,
                          full: true
                        },
                        {
                          label: 'Açıklama',
                          value: h.aciklama?.trim() || '—',
                          full: true
                        },
                        {
                          label: 'Tutar',
                          value: (
                            <span
                              className={
                                isDuz ? OFIS_DUZELTME_TUTAR_CLASS : signed < 0 ? 'text-danger' : undefined
                              }
                            >
                              {formatSignedMoney(signed, hareketParaBirimi(h))}
                            </span>
                          ),
                          numeric: true
                        },
                        { label: 'Ödeme', value: odemeLabel(h.odemeYontemi) },
                        { label: 'Belge no', value: h.belgeNo },
                        {
                          label: 'Onay',
                          value: onayLabel(h.onayDurumu)
                        }
                      ]}
                      actions={
                        actions.length > 0 ? (
                          <MobileActionBar items={actions} />
                        ) : reddedildi && h.redSebebi?.trim() ? (
                          <p className="text-xs text-danger">{h.redSebebi}</p>
                        ) : null
                      }
                    />
                  )
                })}
              </>
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
            <span>
              Toplam <strong>{total}</strong> kayıt · sayfa {page}/{totalPages}
            </span>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button type="button" size="sm" variant="outline" className="flex-1 sm:flex-none" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Önceki
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="flex-1 sm:flex-none"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Sonraki
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {createOpen ? (
        <CreateOfisHareketModal
          onClose={() => setCreateOpen(false)}
          loading={createMu.isPending}
          error={createMu.error instanceof Error ? createMu.error.message : null}
          onSubmit={(payload) => createMu.mutate(payload, { onSuccess: () => setCreateOpen(false) })}
        />
      ) : null}

      {dovizOpen ? (
        <DovizDonusumModal
          onClose={() => setDovizOpen(false)}
          loading={dovizCreateMu.isPending}
          error={dovizCreateMu.error instanceof Error ? dovizCreateMu.error.message : null}
          onSubmit={(payload) => dovizCreateMu.mutate(payload, { onSuccess: () => setDovizOpen(false) })}
        />
      ) : null}

      {rejectFor ? (
        <RejectOfisModal
          belgeNo={rejectFor.belgeNo}
          onClose={() => setRejectFor(null)}
          loading={rejectMu.isPending}
          error={rejectMu.error instanceof Error ? rejectMu.error.message : null}
          onSubmit={(red) => rejectMu.mutate({ id: rejectFor.id, redSebebi: red }, { onSuccess: () => setRejectFor(null) })}
        />
      ) : null}

      {duzeltFor ? (
        <DuzeltOfisModal
          belgeNo={duzeltFor.belgeNo}
          onClose={() => setDuzeltFor(null)}
          loading={duzeltmeMu.isPending}
          error={duzeltmeMu.error instanceof Error ? duzeltmeMu.error.message : null}
          onSubmit={(body) =>
            duzeltmeMu.mutate(
              { id: duzeltFor.id, body },
              {
                onSuccess: () => setDuzeltFor(null)
              }
            )
          }
        />
      ) : null}

      {guvenliSilFor ? (
        <MasrafGuvenliSilModal
          ozet={{
            id: guvenliSilFor.id,
            tarih: guvenliSilFor.tarih,
            aciklama: ofisHareketAciklamaOzet(guvenliSilFor),
            tutar: guvenliSilFor.tutar,
            odemeYontemiLabel: odemeLabel(guvenliSilFor.odemeYontemi),
            belgeNo: guvenliSilFor.belgeNo,
            mode: resolveOfisGuvenliIslemMode(guvenliSilFor) ?? 'GIDER_SIL',
            muvekkilAdi: muvekkilAdiFromHareket(guvenliSilFor),
            kategori: guvenliSilFor.ozelKategoriAdi?.trim()
              ? `${guvenliSilFor.kategori} (${guvenliSilFor.ozelKategoriAdi})`
              : guvenliSilFor.kategori,
            paraBirimi: hareketParaBirimi(guvenliSilFor)
          }}
          onClose={() => setGuvenliSilFor(null)}
          loading={guvenliSilMu.isPending}
          error={guvenliSilMu.error instanceof Error ? guvenliSilMu.error.message : null}
          onSubmit={(payload) =>
            guvenliSilMu.mutate({ id: guvenliSilFor.id, ...payload })
          }
        />
      ) : null}
    </div>
  )
}

function CreateOfisHareketModal(props: {
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (p: CreateOfisKasaHareketiPayload) => void
}): ReactElement {
  const { onClose, loading, error, onSubmit } = props
  const [islemTipi, setIslemTipi] = useState<'GELIR' | 'GIDER'>('GELIR')
  const [tarih, setTarih] = useState(todayInputDate())
  const [kalemId, setKalemId] = useState('')
  const [ozel, setOzel] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [tutar, setTutar] = useState('')
  const [paraBirimi, setParaBirimi] = useState<ParaBirimi>('TRY')
  const [odeme, setOdeme] = useState<OfisKasaOdemeYontemiApi>('NAKIT')
  const [tahsilatiYapanPersonelId, setTahsilatiYapanPersonelId] = useState('')
  const [muvekkilId, setMuvekkilId] = useState('')
  const [muvekkilLabel, setMuvekkilLabel] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const gelirKalemleriQuery = useQuery({
    queryKey: finansKalemleriQueryKey({ tur: 'GELIR', aktif: 'true' }),
    queryFn: () => listFinansKalemleri({ tur: 'GELIR', aktif: 'true' }),
    staleTime: 60_000
  })

  const giderKalemleriQuery = useQuery({
    queryKey: finansKalemleriQueryKey({ tur: 'GIDER', aktif: 'true' }),
    queryFn: () => listFinansKalemleri({ tur: 'GIDER', aktif: 'true' }),
    staleTime: 60_000
  })

  const kalemList =
    islemTipi === 'GELIR' ? (gelirKalemleriQuery.data?.items ?? []) : (giderKalemleriQuery.data?.items ?? [])

  const effectiveKalemId = kalemId || kalemList[0]?.id || ''
  const selectedKalem = kalemList.find((k) => k.id === effectiveKalemId) ?? null

  const submit = (): void => {
    setLocalErr(null)
    if (!effectiveKalemId) {
      setLocalErr('Kalem listesi yüklenemedi veya boş.')
      return
    }
    const kalemAd = selectedKalem?.ad ?? kalemList.find((k) => k.id === effectiveKalemId)?.ad ?? ''
    const digerGelir = islemTipi === 'GELIR' && isDigerGelirKalemAd(kalemAd)
    const digerGider = islemTipi === 'GIDER' && isDigerGiderKalemAd(kalemAd)
    if ((digerGelir || digerGider) && ozel.trim().length < 2) {
      setLocalErr('Diğer gelir/gider için özel kategori adı zorunludur.')
      return
    }
    const n = parsePosTutar(tutar)
    if (n == null) {
      setLocalErr('Tutar pozitif sayı olmalıdır.')
      return
    }
    onSubmit({
      islemTipi,
      tarih: dateInputToIsoUtcNoon(tarih),
      kalemId: effectiveKalemId,
      ozelKategoriAdi: digerGelir || digerGider ? ozel.trim() : null,
      aciklama: aciklama.trim() || null,
      tutar: n,
      odemeYontemi: odeme,
      paraBirimi: islemTipi === 'GIDER' ? 'TRY' : paraBirimi,
      ...(islemTipi === 'GELIR'
        ? {
            tahsilatiYapanPersonelId: tahsilatiYapanPersonelId || null,
            muvekkilId: muvekkilId || null
          }
        : {})
    })
  }

  return (
    <ModalShell title="Yeni ofis kasa hareketi" onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <div>
          <label className={uiType.label}>İşlem tipi</label>
          <select
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
            value={islemTipi}
            onChange={(e) => {
              const t = e.target.value as 'GELIR' | 'GIDER'
              setIslemTipi(t)
              setKalemId('')
              setOzel('')
              if (t === 'GIDER') {
                setMuvekkilId('')
                setMuvekkilLabel('')
                setParaBirimi('TRY')
              }
            }}
          >
            <option value="GELIR">Gelir</option>
            <option value="GIDER">Gider</option>
          </select>
        </div>
        {islemTipi === 'GELIR' ? (
          <ParaBirimiSelect label="Para birimi" value={paraBirimi} onChange={setParaBirimi} disabled={loading} />
        ) : (
          <ParaBirimiSelect label="Para birimi" value="TRY" onChange={() => undefined} tryOnly disabled={loading} />
        )}
        <Input label="Tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        <div>
          <label className={uiType.label}>Kalem</label>
          {(() => {
            const q = islemTipi === 'GELIR' ? gelirKalemleriQuery : giderKalemleriQuery
            if (q.isError) {
              return (
                <div className="space-y-2">
                  <AlertBox variant="danger" title="Kalemler yüklenemedi">
                    Liste alınamadı. Bağlantıyı kontrol edip yeniden deneyin.
                  </AlertBox>
                  <Button type="button" size="sm" variant="outline" onClick={() => void q.refetch()}>
                    Yeniden dene
                  </Button>
                </div>
              )
            }
            if (q.isLoading) {
              return <p className="text-xs text-ink-muted">Kalemler yükleniyor…</p>
            }
            if (kalemList.length === 0) {
              return (
                <p className="text-xs text-ink-muted">
                  Aktif kalem yok. Büro sahibi Ayarlar → Gelir ve Gider Kalemleri’nden ekleyebilir.
                </p>
              )
            }
            return (
              <select
                className={formControlClass}
                value={effectiveKalemId}
                disabled={loading}
                onChange={(e) => setKalemId(e.target.value)}
              >
                {kalemList.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ad}
                  </option>
                ))}
              </select>
            )
          })()}
        </div>
        {(islemTipi === 'GELIR' && selectedKalem && isDigerGelirKalemAd(selectedKalem.ad)) ||
        (islemTipi === 'GIDER' && selectedKalem && isDigerGiderKalemAd(selectedKalem.ad)) ? (
          <Input label="Özel kategori adı" value={ozel} onChange={(e) => setOzel(e.target.value)} />
        ) : null}
        <Input label="Açıklama (isteğe bağlı)" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <MoneyInput
          label={islemTipi === 'GIDER' ? 'Tutar (TRY)' : `Tutar (${paraBirimi})`}
          value={tutar}
          onChange={setTutar}
        />
        <div>
          <label className={uiType.label}>Ödeme yöntemi</label>
          <select
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
            value={odeme}
            onChange={(e) => setOdeme(e.target.value as OfisKasaOdemeYontemiApi)}
          >
            {ODEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {islemTipi === 'GELIR' ? (
          <>
            <MuvekkilOptionalSelect
              valueId={muvekkilId}
              valueLabel={muvekkilLabel}
              disabled={loading}
              onChange={(next) => {
                setMuvekkilId(next?.id ?? '')
                setMuvekkilLabel(next?.gorunenAd ?? '')
              }}
            />
            <TahsilatiYapanPersonelSelect value={tahsilatiYapanPersonelId} onChange={setTahsilatiYapanPersonelId} />
          </>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function RejectOfisModal(props: {
  belgeNo: string
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (red: string) => void
}): ReactElement {
  const { belgeNo, onClose, loading, error, onSubmit } = props
  const [red, setRed] = useState('')
  return (
    <ModalShell title={`Red — ${belgeNo}`} onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        <Input label="Red sebebi" value={red} onChange={(e) => setRed(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="button" variant="secondary" onClick={() => onSubmit(red)} disabled={loading || red.trim().length < 3}>
            Reddet
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function DuzeltOfisModal(props: {
  belgeNo: string
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: { tarih: string; tutar: number; aciklama: string; odemeYontemi: OfisKasaOdemeYontemiApi }) => void
}): ReactElement {
  const { belgeNo, onClose, loading, error, onSubmit } = props
  const [tarih, setTarih] = useState(todayInputDate())
  const [tutar, setTutar] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [odeme, setOdeme] = useState<OfisKasaOdemeYontemiApi>('NAKIT')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const n = parseCurrencyInputTR(tutar)
    if (n == null || n === 0) {
      setLocalErr('Düzeltme tutarı sıfır olamaz; pozitif veya negatif girin.')
      return
    }
    if (aciklama.trim().length < 3) {
      setLocalErr('Açıklama en az 3 karakter olmalıdır.')
      return
    }
    onSubmit({
      tarih: dateInputToIsoUtcNoon(tarih),
      tutar: n,
      aciklama: aciklama.trim(),
      odemeYontemi: odeme
    })
  }

  return (
    <ModalShell title={`Düzeltme talebi — ${belgeNo}`} onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <p className="text-xs text-ink-muted">Orijinal kayıt değişmez; yeni düzeltme satırı onay bekler.</p>
        <Input label="Tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        <MoneyInput
          label="Tutar (pozitif veya negatif)"
          value={tutar}
          onChange={setTutar}
          allowNegative
          placeholder="-100,00 veya 50,00"
        />
        <div>
          <label className={uiType.label}>Açıklama</label>
          <textarea
            className="min-h-[88px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
          />
        </div>
        <div>
          <label className={uiType.label}>Ödeme yöntemi</label>
          <select
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
            value={odeme}
            onChange={(e) => setOdeme(e.target.value as OfisKasaOdemeYontemiApi)}
          >
            {ODEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? 'Gönderiliyor…' : 'Düzeltme aç'}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function DovizDonusumModal(props: {
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (p: CreateOfisKasaDovizDonusumPayload) => void
}): ReactElement {
  const { onClose, loading, error, onSubmit } = props
  const [tarih, setTarih] = useState(todayInputDate())
  const [kaynakPb, setKaynakPb] = useState<ParaBirimi>('USD')
  const [hedefPb, setHedefPb] = useState<ParaBirimi>('TRY')
  const [kaynakTutar, setKaynakTutar] = useState('')
  const [hedefTutar, setHedefTutar] = useState('')
  const [odeme, setOdeme] = useState<OfisKasaOdemeYontemiApi>('NAKIT')
  const [aciklama, setAciklama] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const kurOzeti = previewDovizDonusumKur(kaynakPb, hedefPb, kaynakTutar, hedefTutar)
  const tcmb = useCrossCurrencyTcmb({
    alacakParaBirimi: kaynakPb,
    odemeParaBirimi: hedefPb,
    odemeTarihi: tarih,
    mahsupTutar: kaynakTutar,
    kasaTutari: hedefTutar,
    onKasaTutariChange: setHedefTutar,
    disabled: loading
  })

  const submit = (): void => {
    setLocalErr(null)
    if (kaynakPb === hedefPb) {
      setLocalErr('Kaynak ve hedef para birimi farklı olmalıdır.')
      return
    }
    const kaynak = parsePosTutar(kaynakTutar)
    const hedef = parsePosTutar(hedefTutar)
    if (kaynak == null || hedef == null) {
      setLocalErr('Kaynak ve hedef tutar pozitif olmalıdır.')
      return
    }
    onSubmit({
      tarih: dateInputToIsoUtcNoon(tarih),
      kaynakParaBirimi: kaynakPb,
      hedefParaBirimi: hedefPb,
      kaynakTutar: kaynak,
      hedefTutar: hedef,
      odemeYontemi: odeme,
      aciklama: aciklama.trim() || null,
      kurKaynagi: tcmb.state.kurKaynagi,
      tcmbKurTarihi: tcmb.state.tcmbKurTarihi,
      tcmbReferansKur: tcmb.state.tcmbReferansKur
    })
  }

  return (
    <ModalShell title="Döviz dönüşümü" onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <p className="text-xs text-ink-muted">
          Kaynak kasadan çıkış ve hedef kasaya giriş birlikte oluşturulur; onay bekler.
        </p>
        <Input label="Tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <ParaBirimiSelect label="Kaynak para birimi" value={kaynakPb} onChange={setKaynakPb} disabled={loading} />
          <ParaBirimiSelect label="Hedef para birimi" value={hedefPb} onChange={setHedefPb} disabled={loading} />
        </div>
        <MoneyInput label={`Kaynak tutar (${kaynakPb})`} value={kaynakTutar} onChange={setKaynakTutar} />
        {tcmb.cross ? (
          <TcmbCrossRatePanel
            bazParaBirimi={kaynakPb}
            karsiParaBirimi={hedefPb}
            state={tcmb.state}
            onTcmbKullanChange={tcmb.setTcmbKullan}
            onUygulanacakKurChange={tcmb.setUygulanacakKur}
            disabled={loading}
          />
        ) : null}
        <MoneyInput
          label={`Hedef tutar (${hedefPb})`}
          value={hedefTutar}
          onChange={tcmb.cross ? tcmb.onKasaTutariManualChange : setHedefTutar}
        />
        {kurOzeti ? (
          <p className="rounded-md border border-sky-300/60 bg-sky-50/80 px-2.5 py-2 text-xs font-medium text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100">
            Kur özeti: {kurOzeti}
          </p>
        ) : null}
        <div>
          <label className={uiType.label}>Ödeme yöntemi</label>
          <select
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
            value={odeme}
            onChange={(e) => setOdeme(e.target.value as OfisKasaOdemeYontemiApi)}
          >
            {ODEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Input label="Açıklama (isteğe bağlı)" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? 'Kaydediliyor…' : 'Dönüşümü kaydet'}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function ModalShell(props: { title: string; onClose: () => void; children: ReactNode }): ReactElement {
  const { title, onClose, children } = props
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <DraggablePanel
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated"
      >
        <div data-modal-drag-handle className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
            ✕
          </Button>
        </div>
        {children}
      </DraggablePanel>
    </div>
  )
}
