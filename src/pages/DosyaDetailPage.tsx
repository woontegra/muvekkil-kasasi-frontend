import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  approveKasaHareketi,
  createDuzeltme,
  createKasaHareketi,
  deleteKasaHareketi,
  getKasaOzet,
  listKasaHareketleri,
  rejectKasaHareketi
} from '../api/kasa'
import { invalidateDashboardSummary } from '../api/dashboard'
import { invalidateSmmBekleyen } from '../api/smm'
import { getDosya } from '../api/dosyalar'
import { getDosyaHesapOzeti } from '../api/hesapOzeti'
import { getDosyaMakbuzlari } from '../api/makbuzlar'
import {
  cancelVekaletTaksiti,
  createVekaletTaksitOdeme,
  createVekaletTaksiti,
  getDosyaVekalet,
  getVekaletOdemeMakbuz,
  listVekaletTaksitOdemeler,
  markOdemeSmmKesildi,
  updateVekaletTaksiti,
  upsertDosyaVekalet
} from '../api/vekalet'
import { ApiError, resolveOdemeApiError } from '../api/client'
import { APP_BASE } from '../config/appPaths'
import { useAuth } from '../contexts/AuthContext'
import { dosyaDurumuBadgeVariant, dosyaDurumuLabel, mahkemeIcraSatir } from '../lib/dosyaLabels'
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Table,
  TableEmptyRow,
  TBody,
  TD,
  TH,
  THead,
  TR
} from '../components/ui'
import { cn } from '../lib/cn'
import { resolveSmmBekleyenOdemeId, resolveTaksitRow } from '../lib/vekaletTaksitOzet'
import { formatCurrencyTR, formatDateTR } from '../utils/formatters'
import { MASRAF_TURU_OPTIONS, type KasaHareketiDto, type OdemeYontemiApi } from '../types/kasa'
import type {
  CreateVekaletTaksitOdemePayload,
  CreateVekaletTaksitPayload,
  TaksitComputedDurumApi,
  TaksitSmmDurumApi,
  UpdateVekaletTaksitPayload,
  UpsertVekaletPayload,
  VekaletOdemeMakbuzDto,
  VekaletTaksitOdemeDto,
  VekaletTaksitiDto
} from '../types/vekalet'
import type { ListKasaHareketleriParams } from '../api/kasa'
import { AdvanceReceipt } from '../components/receipt/AdvanceReceipt'
import { ReceiptModal } from '../components/receipt/ReceiptModal'
import { VekaletOdemeReceipt } from '../components/receipt/VekaletOdemeReceipt'
import { VekaletReceipt } from '../components/receipt/VekaletReceipt'
import { HesapOzetiPrintView } from '../components/reports/HesapOzetiPrintView'
import type { VekaletMakbuzListeDto } from '../types/makbuz'

type ReceiptModalState =
  | null
  | { kind: 'advance'; hareket: KasaHareketiDto; printRootId: string; printedAt: string }
  | { kind: 'vekalet'; taksit: VekaletTaksitiDto; printRootId: string; printedAt: string }
  | { kind: 'vekalet-odeme'; makbuz: VekaletOdemeMakbuzDto; printRootId: string; printedAt: string }
  | { kind: 'hesap'; printRootId: string; printedAt: string }

type TabKey = 'kasa' | 'vekalet' | 'smm' | 'makbuz' | 'hesap'

type KasaListeFiltre = 'tum' | 'avans' | 'masraf' | 'onaysiz' | 'onayli' | 'reddedildi'

type VekModalState =
  | null
  | { type: 'vekalet-upsert' }
  | { type: 'taksit-create' }
  | { type: 'taksit-edit'; t: VekaletTaksitiDto }
  | { type: 'taksit-odeme'; t: VekaletTaksitiDto }
  | { type: 'odeme-gecmisi'; t: VekaletTaksitiDto }

const TABS: { key: TabKey; label: string }[] = [
  { key: 'kasa', label: 'Kasa Hareketleri' },
  { key: 'vekalet', label: 'Vekalet / Taksitler' },
  { key: 'smm', label: 'SMM Takibi' },
  { key: 'makbuz', label: 'Makbuzlar' },
  { key: 'hesap', label: 'Hesap Özeti' }
]

const ODEME_OPTIONS: { value: OdemeYontemiApi; label: string }[] = [
  { value: 'NAKIT', label: 'Nakit' },
  { value: 'BANKA', label: 'Banka' },
  { value: 'KREDI_KARTI', label: 'Kredi kartı' },
  { value: 'DIGER', label: 'Diğer' }
]

function taksitDurumLabel(d: TaksitComputedDurumApi): string {
  switch (d) {
    case 'ODENMEDI':
      return 'Ödenmedi'
    case 'KISMI_ODENDI':
      return 'Kısmi ödendi'
    case 'ODENDI':
      return 'Ödendi'
    case 'GECIKTI':
      return 'Gecikti'
    default:
      return d
  }
}

function taksitDurumBadge(d: TaksitComputedDurumApi): 'success' | 'warning' | 'danger' | 'default' {
  switch (d) {
    case 'ODENDI':
      return 'success'
    case 'KISMI_ODENDI':
      return 'warning'
    case 'GECIKTI':
      return 'danger'
    default:
      return 'warning'
  }
}

function smmDurumRozet(s: TaksitSmmDurumApi): ReactElement | string {
  if (s === 'YOK') return '—'
  if (s === 'KESILDI') {
    return (
      <Badge variant="success" className="!normal-case">
        SMM kesildi
      </Badge>
    )
  }
  return (
    <Badge variant="danger" className="animate-pulse !normal-case bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200">
      SMM bekliyor
    </Badge>
  )
}

function smmListeDurum(t: VekaletMakbuzListeDto): string {
  if (t.smmKesildiMi) {
    return t.smmNo?.trim() ? `Evet (${t.smmNo.trim()})` : 'Evet'
  }
  return 'Hayır'
}

function isoDateToInput(iso: string): string {
  const s = iso.trim()
  const t = s.indexOf('T')
  return t > 0 ? s.slice(0, t) : s.slice(0, 10)
}

function todayInputDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function tipLabel(tip: KasaHareketiDto['tip']): string {
  switch (tip) {
    case 'AVANS_GIRISI':
      return 'Avans girişi'
    case 'MASRAF':
      return 'Masraf'
    case 'DUZELTME':
      return 'Düzeltme'
    case 'VEKALET_TAHSILAT':
      return 'Vekalet tahsilatı'
    default:
      return tip
  }
}

function odemeLabel(v: OdemeYontemiApi | null): string {
  if (!v) return '—'
  return ODEME_OPTIONS.find((o) => o.value === v)?.label ?? v
}

function onayLabel(s: KasaHareketiDto['onayDurumu']): string {
  switch (s) {
    case 'ONAYLI':
      return 'Onaylı'
    case 'ONAYSIZ':
      return 'Onaysız'
    case 'REDDEDILDI':
      return 'Reddedildi'
    default:
      return s
  }
}

/** Bakiye hesabı ile uyumlu işaretli gösterim (masraf gider olarak eksi). */
function signedDisplayAmount(h: KasaHareketiDto): number {
  const v = Number(h.tutar)
  if (!Number.isFinite(v)) return 0
  if (h.tip === 'MASRAF') return -v
  return v
}

function aciklamaCell(h: KasaHareketiDto): string {
  if (h.tip === 'MASRAF') {
    const base = h.masrafTuru ?? '—'
    if (h.ozelMasrafAdi?.trim()) return `${base}: ${h.ozelMasrafAdi.trim()}`
    return base
  }
  return h.aciklama?.trim() || '—'
}

function DosyaSmmBekleyenBanner(props: { count: number; onGoVekalet?: () => void }): ReactElement {
  const { count, onGoVekalet } = props
  if (count <= 0) return <></>

  const title =
    count === 1
      ? 'Serbest meslek makbuzu kesilmemiş tahsilat var.'
      : `Serbest meslek makbuzu kesilmemiş ${count} tahsilat var.`

  return (
    <div
      role="alert"
      className="rounded-lg border-2 border-rose-400/90 bg-rose-50 px-4 py-3 text-sm text-rose-950 shadow-sm dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-50"
    >
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-xs leading-relaxed">Vekalet ücreti tahsilatı için SMM durumunu kontrol edin.</p>
      {onGoVekalet ? (
        <Button type="button" size="sm" variant="outline" className="mt-2 h-7 border-rose-300 text-xs" onClick={onGoVekalet}>
          Vekalet / Taksitler sekmesine git
        </Button>
      ) : null}
    </div>
  )
}

function VekaletOzetCards(props: { anlasilan: string; odenenToplam: string; kalanVekalet: string }): ReactElement {
  const { anlasilan, odenenToplam, kalanVekalet } = props
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div
        className={cn(
          'rounded-xl border-2 border-indigo-300/95 bg-gradient-to-br from-indigo-50 via-violet-50 to-slate-50 px-4 py-4 shadow-md',
          'dark:border-indigo-600 dark:from-indigo-950/55 dark:via-violet-950/40 dark:to-slate-900/40'
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-900/75 dark:text-indigo-100/85">
          Vekalet (anlaşılan)
        </p>
        <p className="mt-2 text-xl font-extrabold tabular-nums text-indigo-950 dark:text-indigo-50">
          {formatCurrencyTR(Number(anlasilan))}
        </p>
      </div>
      <div
        className={cn(
          'rounded-xl border-2 border-emerald-400/90 bg-gradient-to-br from-emerald-50 to-green-50/90 px-4 py-4 shadow-md',
          'dark:border-emerald-600 dark:from-emerald-950/45 dark:to-green-950/30'
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900/80 dark:text-emerald-100/85">Ödenen</p>
        <p className="mt-2 text-xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
          {formatCurrencyTR(Number(odenenToplam))}
        </p>
      </div>
      <div
        className={cn(
          'rounded-xl border-2 border-orange-400/95 bg-gradient-to-br from-orange-50 to-amber-50 px-4 py-4 shadow-md',
          'dark:border-orange-600 dark:from-orange-950/45 dark:to-amber-950/35'
        )}
      >
        <p className="text-[10px] font-bold uppercase tracking-wider text-orange-900/80 dark:text-orange-100/85">
          Kalan vekalet
        </p>
        <p className="mt-2 text-xl font-extrabold tabular-nums text-orange-700 dark:text-orange-300">
          {formatCurrencyTR(Number(kalanVekalet))}
        </p>
      </div>
    </div>
  )
}

type KasaOzetCardVariant = 'avans' | 'masraf' | 'duzeltme' | 'bakiye' | 'onaysiz'

function KasaOzetCard(props: {
  label: string
  value: string
  variant: KasaOzetCardVariant
  isCount?: boolean
}): ReactElement {
  const { label, value, variant, isCount } = props
  const display = isCount ? value : formatCurrencyTR(Number(value))
  const nOnaysiz = isCount ? Number(value) : 0
  const onaysizAktif = variant === 'onaysiz' && Number.isFinite(nOnaysiz) && nOnaysiz > 0

  const shell: Record<KasaOzetCardVariant, string> = {
    avans: cn(
      'rounded-xl border-2 border-blue-400/90 bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50/80 shadow-md',
      'dark:border-blue-600 dark:from-blue-950/50 dark:via-sky-950/35 dark:to-indigo-950/30'
    ),
    masraf: cn(
      'rounded-xl border-2 border-orange-400/95 bg-gradient-to-br from-orange-50 via-amber-50 to-red-50/40 shadow-md',
      'dark:border-orange-600 dark:from-orange-950/45 dark:via-amber-950/35 dark:to-red-950/25'
    ),
    duzeltme: cn(
      'rounded-xl border-2 border-violet-300/90 bg-gradient-to-br from-violet-50 via-slate-50 to-zinc-50/90 shadow-md',
      'dark:border-violet-600 dark:from-violet-950/40 dark:via-slate-900/40 dark:to-zinc-950/30'
    ),
    bakiye: cn(
      'rounded-xl border-2 border-cyan-400/90 bg-gradient-to-br from-cyan-50 via-teal-50/80 to-sky-50/70 shadow-md',
      'dark:border-cyan-600 dark:from-cyan-950/45 dark:via-teal-950/35 dark:to-sky-950/30'
    ),
    onaysiz: cn(
      'rounded-xl border-2 shadow-md',
      onaysizAktif
        ? 'border-amber-400 bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-50 dark:border-amber-500 dark:from-amber-950/50 dark:via-yellow-950/30 dark:to-amber-950/25'
        : 'border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-yellow-50/50 dark:border-amber-800 dark:from-amber-950/25 dark:to-yellow-950/15'
    )
  }

  const valueClass: Record<KasaOzetCardVariant, string> = {
    avans: 'text-blue-800 dark:text-blue-100',
    masraf: 'text-orange-700 dark:text-orange-200',
    duzeltme: 'text-violet-900 dark:text-violet-100',
    bakiye: 'text-cyan-800 dark:text-cyan-100',
    onaysiz: onaysizAktif ? 'text-amber-900 dark:text-amber-200' : 'text-ink-muted dark:text-ink-muted'
  }

  const labelClass: Record<KasaOzetCardVariant, string> = {
    avans: 'text-blue-900/70 dark:text-blue-100/80',
    masraf: 'text-orange-900/75 dark:text-orange-100/80',
    duzeltme: 'text-violet-900/70 dark:text-violet-100/75',
    bakiye: 'text-cyan-900/70 dark:text-cyan-100/80',
    onaysiz: onaysizAktif ? 'text-amber-950/80 dark:text-amber-100/85' : 'text-ink-muted'
  }

  return (
    <div className={cn('px-4 py-4', shell[variant])}>
      <p className={cn('text-[10px] font-bold uppercase tracking-wider', labelClass[variant])}>{label}</p>
      <p className={cn('mt-2 text-xl font-extrabold tabular-nums', valueClass[variant])}>{display}</p>
    </div>
  )
}

export function DosyaDetailPage(): ReactElement {
  const { id: muvekkilIdFromUrl, dosyaId } = useParams<{ id: string; dosyaId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const [tab, setTab] = useState<TabKey>('kasa')

  useEffect(() => {
    setTab((prev) => ((prev as unknown as string) === 'masraf' ? 'kasa' : prev))
  }, [])

  const [modal, setModal] = useState<
    | null
    | { type: 'avans' }
    | { type: 'masraf' }
    | { type: 'reject'; hareket: KasaHareketiDto }
    | { type: 'duzeltme'; hareket: KasaHareketiDto }
  >(null)

  const [vekModal, setVekModal] = useState<VekModalState>(null)
  const [receiptModal, setReceiptModal] = useState<ReceiptModalState>(null)
  const [kasaSearch, setKasaSearch] = useState('')
  const [kasaFilter, setKasaFilter] = useState<KasaListeFiltre>('tum')
  const [smmNotice, setSmmNotice] = useState<{ variant: 'success' | 'danger'; text: string } | null>(null)

  const role = session?.user.role
  const canYoneticiIslem = role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI'
  const canYeniKasa = canYoneticiIslem || role === 'KATIP_PERSONEL'
  const canVekaletDuzenle = canYoneticiIslem
  const canTaksitEkle = canYeniKasa
  const canTaksitOdendi = canYeniKasa
  const canSmmIsaretle = canYeniKasa
  const canTaksitIptal = canYoneticiIslem

  const dosyaQuery = useQuery({
    queryKey: ['dosya', dosyaId],
    queryFn: () => getDosya(dosyaId!),
    enabled: Boolean(dosyaId)
  })

  const kasaFetchEnabled =
    Boolean(dosyaId) && dosyaQuery.status === 'success' && dosyaQuery.data != null

  const kasaListParams = (): ListKasaHareketleriParams => {
    const p: ListKasaHareketleriParams = { q: kasaSearch.trim() || undefined, limit: 200 }
    if (kasaFilter === 'avans') p.tip = 'AVANS_GIRISI'
    else if (kasaFilter === 'masraf') p.tip = 'MASRAF'
    else if (kasaFilter === 'onaysiz') p.onayDurumu = 'ONAYSIZ'
    else if (kasaFilter === 'onayli') p.onayDurumu = 'ONAYLI'
    else if (kasaFilter === 'reddedildi') p.onayDurumu = 'REDDEDILDI'
    return p
  }

  const kasaListQuery = useQuery({
    queryKey: ['kasa-hareketleri', dosyaId, kasaSearch, kasaFilter],
    queryFn: () => listKasaHareketleri(dosyaId!, kasaListParams()),
    enabled: kasaFetchEnabled
  })

  const kasaOzetQuery = useQuery({
    queryKey: ['kasa-ozet', dosyaId],
    queryFn: () => getKasaOzet(dosyaId!),
    enabled: kasaFetchEnabled
  })

  const vekaletFetchEnabled = Boolean(dosyaId) && dosyaQuery.status === 'success'

  const vekaletQuery = useQuery({
    queryKey: ['vekalet', dosyaId],
    queryFn: () => getDosyaVekalet(dosyaId!),
    enabled: vekaletFetchEnabled
  })

  const hesapOzetiQuery = useQuery({
    queryKey: ['dosya-hesap-ozeti', dosyaId],
    queryFn: () => getDosyaHesapOzeti(dosyaId!),
    enabled: vekaletFetchEnabled
  })

  const makbuzQuery = useQuery({
    queryKey: ['dosya-makbuzlar', dosyaId],
    queryFn: () => getDosyaMakbuzlari(dosyaId!),
    enabled: vekaletFetchEnabled
  })

  const invalidateKasa = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['kasa-hareketleri', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['kasa-ozet', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['dosya-hesap-ozeti', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['dosya-makbuzlar', dosyaId] })
    invalidateDashboardSummary(queryClient)
  }

  const approveMu = useMutation({
    mutationFn: (id: string) => approveKasaHareketi(id),
    onSuccess: invalidateKasa
  })
  const rejectMu = useMutation({
    mutationFn: ({ id, redSebebi }: { id: string; redSebebi: string }) => rejectKasaHareketi(id, redSebebi),
    onSuccess: () => {
      invalidateKasa()
      setModal(null)
    }
  })
  const deleteMu = useMutation({
    mutationFn: (id: string) => deleteKasaHareketi(id),
    onSuccess: invalidateKasa
  })
  const createMu = useMutation({
    mutationFn: (payload: Parameters<typeof createKasaHareketi>[1]) => createKasaHareketi(dosyaId!, payload),
    onSuccess: () => {
      invalidateKasa()
      setModal(null)
    }
  })
  const duzeltmeMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof createDuzeltme>[1] }) =>
      createDuzeltme(id, body),
    onSuccess: () => {
      invalidateKasa()
      setModal(null)
    }
  })

  const invalidateVekalet = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['vekalet', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['kasa-hareketleri', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['kasa-ozet', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['dosya-hesap-ozeti', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['dosya-makbuzlar', dosyaId] })
    invalidateDashboardSummary(queryClient)
  }

  const upsertVekMu = useMutation({
    mutationFn: (body: UpsertVekaletPayload) => upsertDosyaVekalet(dosyaId!, body),
    onSuccess: () => {
      invalidateVekalet()
      setVekModal(null)
    }
  })
  const createTaksitMu = useMutation({
    mutationFn: (body: CreateVekaletTaksitPayload) => createVekaletTaksiti(dosyaId!, body),
    onSuccess: () => {
      invalidateVekalet()
      setVekModal(null)
    }
  })
  const updateTaksitMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateVekaletTaksitPayload }) => updateVekaletTaksiti(id, body),
    onSuccess: () => {
      invalidateVekalet()
      setVekModal(null)
    }
  })
  const odemeTaksitMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateVekaletTaksitOdemePayload }) =>
      createVekaletTaksitOdeme(id, body),
    onSuccess: () => {
      invalidateVekalet()
      setVekModal(null)
    }
  })
  const smmOdemeMu = useMutation({
    mutationFn: (odemeId: string) => markOdemeSmmKesildi(odemeId),
    onSuccess: () => {
      invalidateVekalet()
      invalidateSmmBekleyen(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['taksit-odemeler'] })
      setSmmNotice({ variant: 'success', text: 'SMM kesildi olarak işaretlendi.' })
    },
    onError: () => {
      setSmmNotice({ variant: 'danger', text: 'SMM durumu güncellenemedi.' })
    }
  })
  const cancelTaksitMu = useMutation({
    mutationFn: (id: string) => cancelVekaletTaksiti(id),
    onSuccess: () => {
      invalidateVekalet()
      setVekModal(null)
    }
  })

  useEffect(() => {
    if (!smmNotice) return
    const timer = window.setTimeout(() => setSmmNotice(null), 4000)
    return () => window.clearTimeout(timer)
  }, [smmNotice])

  if (!dosyaId || !muvekkilIdFromUrl) {
    return <Navigate to={APP_BASE} replace />
  }

  if (dosyaQuery.isLoading) {
    return (
      <div className="w-full space-y-5">
        <p className="text-sm text-ink-muted">Yükleniyor…</p>
      </div>
    )
  }

  if (dosyaQuery.isError) {
    const err = dosyaQuery.error
    if (err instanceof ApiError && err.status === 404) {
      return <Navigate to={APP_BASE} replace />
    }
    return (
      <div className="w-full space-y-5">
        <AlertBox variant="danger" title="Dosya">
          {err instanceof Error ? err.message : 'Yüklenemedi.'}
        </AlertBox>
        <Link to={APP_BASE} className="text-sm font-semibold text-primary hover:underline">
          Ana Sayfa
        </Link>
      </div>
    )
  }

  if (!dosyaQuery.data) {
    return (
      <div className="w-full space-y-5">
        <p className="text-sm text-ink-muted">Veri bekleniyor…</p>
      </div>
    )
  }

  const { dosya: d, muvekkil: m } = dosyaQuery.data

  if (m.id !== muvekkilIdFromUrl) {
    return <Navigate to={`${APP_BASE}/muvekkil/${m.id}/dosya/${dosyaId}`} replace />
  }

  const kasaItems = kasaListQuery.data?.items ?? []
  const kasaTotal = kasaListQuery.data?.total ?? kasaItems.length
  const ozet = kasaOzetQuery.data?.ozet

  const vekaletData = vekaletQuery.data
  const kasaListError = kasaListQuery.isError ? (kasaListQuery.error as Error).message : null
  const kasaOzetError = kasaOzetQuery.isError ? (kasaOzetQuery.error as Error).message : null
  const vekaletListError = vekaletQuery.isError ? (vekaletQuery.error as Error).message : null
  const hesapData = hesapOzetiQuery.data
  const hesapOzetiError = hesapOzetiQuery.isError ? (hesapOzetiQuery.error as Error).message : null
  const makbuzData = makbuzQuery.data
  const makbuzError = makbuzQuery.isError ? (makbuzQuery.error as Error).message : null
  const avansMakbuzRows = makbuzData?.avansMakbuzlari ?? []
  const vekaletMakbuzListe = makbuzData?.vekaletMakbuzlari ?? []

  const altBaslik = [mahkemeIcraSatir(d), d.dosyaNo?.trim() ? `Dosya no: ${d.dosyaNo}` : null].filter(Boolean).join(' · ')

  return (
    <div className="w-full space-y-5">
      {modal?.type === 'avans' ? (
        <AvansModal
          onClose={() => setModal(null)}
          loading={createMu.isPending}
          error={createMu.error instanceof Error ? createMu.error.message : null}
          onSubmit={(body) => createMu.mutate(body)}
        />
      ) : null}
      {modal?.type === 'masraf' ? (
        <MasrafModal
          onClose={() => setModal(null)}
          loading={createMu.isPending}
          error={createMu.error instanceof Error ? createMu.error.message : null}
          onSubmit={(body) => createMu.mutate(body)}
        />
      ) : null}
      {modal?.type === 'reject' ? (
        <RejectModal
          belgeNo={modal.hareket.belgeNo}
          onClose={() => setModal(null)}
          loading={rejectMu.isPending}
          error={rejectMu.error instanceof Error ? rejectMu.error.message : null}
          onSubmit={(redSebebi) => rejectMu.mutate({ id: modal.hareket.id, redSebebi })}
        />
      ) : null}
      {modal?.type === 'duzeltme' ? (
        <DuzeltmeModal
          belgeNo={modal.hareket.belgeNo}
          onClose={() => setModal(null)}
          loading={duzeltmeMu.isPending}
          error={duzeltmeMu.error instanceof Error ? duzeltmeMu.error.message : null}
          onSubmit={(body) => duzeltmeMu.mutate({ id: modal.hareket.id, body })}
        />
      ) : null}

      {vekModal?.type === 'vekalet-upsert' ? (
        <VekaletUpsertModal
          key={vekaletData?.vekaletUcreti?.id ?? 'new-vekalet'}
          onClose={() => setVekModal(null)}
          loading={upsertVekMu.isPending}
          error={upsertVekMu.error instanceof Error ? upsertVekMu.error.message : null}
          initialToplam={vekaletData?.vekaletUcreti?.toplamTutar ?? ''}
          initialAciklama={vekaletData?.vekaletUcreti?.aciklama ?? ''}
          onSubmit={(body) => upsertVekMu.mutate(body)}
        />
      ) : null}
      {vekModal?.type === 'taksit-create' ? (
        <VekaletTaksitCreateModal
          onClose={() => setVekModal(null)}
          loading={createTaksitMu.isPending}
          error={createTaksitMu.error instanceof Error ? createTaksitMu.error.message : null}
          onSubmit={(body) => createTaksitMu.mutate(body)}
        />
      ) : null}
      {vekModal?.type === 'taksit-edit' ? (
        <VekaletTaksitEditModal
          key={vekModal.t.id}
          taksit={vekModal.t}
          onClose={() => setVekModal(null)}
          loading={updateTaksitMu.isPending}
          error={updateTaksitMu.error instanceof Error ? updateTaksitMu.error.message : null}
          canRevertPaid={canYoneticiIslem}
          onSubmit={(body) => updateTaksitMu.mutate({ id: vekModal.t.id, body })}
        />
      ) : null}
      {vekModal?.type === 'taksit-odeme' ? (
        <VekaletTaksitOdemeModal
          taksit={vekModal.t}
          onClose={() => {
            odemeTaksitMu.reset()
            setVekModal(null)
          }}
          loading={odemeTaksitMu.isPending}
          error={resolveOdemeApiError(odemeTaksitMu.error)}
          onSubmit={(body) => odemeTaksitMu.mutate({ id: vekModal.t.id, body })}
        />
      ) : null}
      {vekModal?.type === 'odeme-gecmisi' ? (
        <VekaletOdemeGecmisiModal
          taksit={vekModal.t}
          onClose={() => setVekModal(null)}
          canSmm={canSmmIsaretle}
          smmLoading={smmOdemeMu.isPending}
          onSmmKesildi={(odemeId) => smmOdemeMu.mutate(odemeId)}
          onMakbuz={async (odemeId) => {
            const res = await getVekaletOdemeMakbuz(odemeId)
            setReceiptModal({
              kind: 'vekalet-odeme',
              makbuz: res.makbuz,
              printRootId: `vek-odeme-${odemeId}-${Date.now()}`,
              printedAt: new Date().toISOString()
            })
          }}
        />
      ) : null}

      {receiptModal?.kind === 'vekalet-odeme' ? (
        <ReceiptModal
          title="Vekalet tahsilat makbuzu"
          printRootId={receiptModal.printRootId}
          onClose={() => setReceiptModal(null)}
        >
          <VekaletOdemeReceipt makbuz={receiptModal.makbuz} printedAt={receiptModal.printedAt} />
        </ReceiptModal>
      ) : null}

      {receiptModal?.kind === 'advance' && hesapData ? (
        <ReceiptModal
          title="Avans makbuzu"
          printRootId={receiptModal.printRootId}
          onClose={() => setReceiptModal(null)}
        >
          <AdvanceReceipt
            tenant={hesapData.tenant}
            dosya={hesapData.dosya}
            muvekkil={hesapData.muvekkil}
            hareket={receiptModal.hareket}
            printedAt={receiptModal.printedAt}
          />
        </ReceiptModal>
      ) : null}
      {receiptModal?.kind === 'vekalet' && hesapData ? (
        <ReceiptModal
          title="Vekalet tahsilat makbuzu"
          printRootId={receiptModal.printRootId}
          onClose={() => setReceiptModal(null)}
        >
          <VekaletReceipt
            tenant={hesapData.tenant}
            dosya={hesapData.dosya}
            muvekkil={hesapData.muvekkil}
            vekaletUcreti={hesapData.vekalet.ucret}
            vekaletOzet={hesapData.vekalet.ozet}
            taksit={receiptModal.taksit}
            printedAt={receiptModal.printedAt}
          />
        </ReceiptModal>
      ) : null}
      {receiptModal?.kind === 'hesap' && hesapData ? (
        <ReceiptModal
          title="Hesap özeti"
          printRootId={receiptModal.printRootId}
          onClose={() => setReceiptModal(null)}
        >
          <HesapOzetiPrintView data={hesapData} printedAtOverride={receiptModal.printedAt} />
        </ReceiptModal>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to={APP_BASE} className="font-semibold text-primary hover:underline">
          Ana Sayfa
        </Link>
        <span className="text-ink-subtle">/</span>
        <Link to={`${APP_BASE}/muvekkil/${m.id}`} className="font-semibold text-primary hover:underline">
          {m.gorunenAd}
        </Link>
        <span className="text-ink-subtle">/</span>
        <span className="font-medium text-ink">Dosya</span>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg md:text-xl">{d.konuBasligi}</CardTitle>
              <p className="text-sm text-ink-muted">
                {altBaslik || '—'} · <Badge variant={dosyaDurumuBadgeVariant(d.durum)}>{dosyaDurumuLabel(d.durum)}</Badge>
              </p>
              {d.aciklama?.trim() ? (
                <p className="max-w-2xl text-sm text-ink-subtle">
                  <span className="font-semibold text-ink-muted">Açıklama: </span>
                  {d.aciklama}
                </p>
              ) : null}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate(`${APP_BASE}/muvekkil/${m.id}`)}>
              Müvekkile dön
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 p-4">
          {vekaletData && vekaletData.ozet.smmBekleyenSayisi > 0 ? (
            <DosyaSmmBekleyenBanner
              count={vekaletData.ozet.smmBekleyenSayisi}
              onGoVekalet={() => setTab('vekalet')}
            />
          ) : null}
          {smmNotice ? (
            <AlertBox variant={smmNotice.variant} title={smmNotice.variant === 'success' ? 'Başarılı' : 'Hata'}>
              {smmNotice.text}
            </AlertBox>
          ) : null}
          <p className="rounded-md border border-border bg-surface-muted/50 px-3 py-2 text-xs text-ink-muted">
            Kasa hareketleri dosyaya ait avans, masraf ve düzeltme kayıtlarını birlikte gösterir. Vekalet ücreti avans kasasından
            ayrıdır. Vekalet / taksitler ve SMM takibi <span className="font-semibold text-ink">canlı API</span> ile gelir.
          </p>
          <div className="flex flex-wrap gap-1 border-b border-border pb-1">
            {TABS.map((t) => (
              <Button
                key={t.key}
                type="button"
                size="sm"
                variant={tab === t.key ? 'secondary' : 'ghost'}
                className={cn(tab === t.key && 'ring-2 ring-primary/25')}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {tab === 'kasa' ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                <p className="font-semibold">Güvenlik kuralları</p>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs leading-relaxed opacity-95">
                  <li>Onaylı kasa satırları doğrudan düzenlenemez veya silinemez.</li>
                  <li>Hata düzeltmesi yalnızca yeni &quot;Düzeltme&quot; kaydı ile açılır; onay sonrası bakiyeye yansır.</li>
                  <li>Onaysız silme yalnızca büro sahibi / avukat yöneticisi yapabilir.</li>
                </ul>
              </div>

              {kasaListError ? <AlertBox variant="danger" title="Kasa listesi">{kasaListError}</AlertBox> : null}
              {kasaOzetError ? <AlertBox variant="danger" title="Kasa özeti">{kasaOzetError}</AlertBox> : null}

              {kasaOzetQuery.isLoading || kasaListQuery.isLoading ? (
                <p className="text-sm text-ink-muted">Kasa verileri yükleniyor…</p>
              ) : (
                <>
                  {ozet ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      <KasaOzetCard label="Toplam avans (onaylı)" value={ozet.toplamAvans} variant="avans" />
                      <KasaOzetCard label="Toplam masraf (onaylı)" value={ozet.toplamMasraf} variant="masraf" />
                      <KasaOzetCard label="Düzeltmeler (onaylı)" value={ozet.toplamDuzeltme} variant="duzeltme" />
                      <KasaOzetCard label="Bakiye (onaylı)" value={ozet.bakiye} variant="bakiye" />
                      <KasaOzetCard
                        label="Onaysız işlem"
                        value={String(ozet.onaysizIslemSayisi)}
                        variant="onaysiz"
                        isCount
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    {canYeniKasa ? (
                      <>
                        <Button type="button" size="sm" onClick={() => setModal({ type: 'avans' })}>
                          Avans girişi
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setModal({ type: 'masraf' })}>
                          Masraf girişi
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-ink-muted">Yeni kasa girişi için yetkiniz yok.</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      label="Ara"
                      placeholder="Belge no, açıklama, tutar, tarih veya ödeme yöntemi ara..."
                      value={kasaSearch}
                      onChange={(e) => setKasaSearch(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1">
                      {(
                        [
                          ['tum', 'Tüm hareketler'],
                          ['avans', 'Avans girişleri'],
                          ['masraf', 'Masraf girişleri'],
                          ['onaysiz', 'Onaysızlar'],
                          ['onayli', 'Onaylananlar'],
                          ['reddedildi', 'Reddedilenler']
                        ] as const
                      ).map(([key, label]) => (
                        <Button
                          key={key}
                          type="button"
                          size="sm"
                          variant={kasaFilter === key ? 'secondary' : 'outline'}
                          className="h-7 px-2 text-[11px]"
                          onClick={() => setKasaFilter(key)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-ink-muted">
                      {kasaItems.length === 0
                        ? 'Aramanıza uygun kasa hareketi bulunamadı.'
                        : `${kasaTotal} kayıt bulundu`}
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <THead>
                        <TR>
                          <TH>Tarih</TH>
                          <TH>Belge no</TH>
                          <TH>Tip</TH>
                          <TH>Açıklama / masraf</TH>
                          <TH>Ödeme</TH>
                          <TH>Onay</TH>
                          <TH className="text-right">Tutar</TH>
                          <TH>İşlem</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {kasaItems.length === 0 ? (
                          <TableEmptyRow colSpan={8}>Henüz kasa hareketi yok.</TableEmptyRow>
                        ) : (
                          kasaItems.map((h) => {
                            const isDuz = h.tip === 'DUZELTME'
                            const onaysiz = h.onayDurumu === 'ONAYSIZ'
                            const onayli = h.onayDurumu === 'ONAYLI'
                            const reddedildi = h.onayDurumu === 'REDDEDILDI'
                            return (
                              <TR
                                key={h.id}
                                className={cn(
                                  isDuz && 'border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20',
                                  onaysiz && !isDuz && 'bg-warning-soft/30'
                                )}
                              >
                                <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(h.tarih)}</TD>
                                <TD className="font-mono text-xs tabular-nums text-ink">{h.belgeNo}</TD>
                                <TD>
                                  <div className="flex flex-wrap items-center gap-1">
                                    <span className="text-sm font-medium">{tipLabel(h.tip)}</span>
                                    {isDuz ? (
                                      <Badge variant="warning" className="!normal-case">
                                        Düzeltme
                                      </Badge>
                                    ) : null}
                                  </div>
                                  {isDuz && h.orijinalBelgeNo ? (
                                    <p className="mt-0.5 text-[11px] text-ink-muted">Orijinal: {h.orijinalBelgeNo}</p>
                                  ) : null}
                                </TD>
                                <TD className="max-w-[220px] text-sm text-ink-muted">{aciklamaCell(h)}</TD>
                                <TD className="text-xs text-ink-muted">{odemeLabel(h.odemeYontemi)}</TD>
                                <TD>
                                  <Badge
                                    variant={
                                      onayli ? 'success' : reddedildi ? 'danger' : onaysiz ? 'warning' : 'default'
                                    }
                                    className="!normal-case"
                                  >
                                    {onayLabel(h.onayDurumu)}
                                  </Badge>
                                  {reddedildi && h.redSebebi?.trim() ? (
                                    <p className="mt-1 max-w-[180px] text-[11px] text-danger">{h.redSebebi}</p>
                                  ) : null}
                                </TD>
                                <TD
                                  className={cn(
                                    'text-right text-sm font-semibold tabular-nums',
                                    signedDisplayAmount(h) < 0 ? 'text-danger' : 'text-ink'
                                  )}
                                >
                                  {formatCurrencyTR(signedDisplayAmount(h))}
                                </TD>
                                <TD>
                                  <div className="flex flex-wrap gap-1">
                                    {onaysiz && canYoneticiIslem ? (
                                      <>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="secondary"
                                          className="h-7 px-2 text-[11px]"
                                          disabled={approveMu.isPending}
                                          onClick={() => approveMu.mutate(h.id)}
                                        >
                                          Onayla
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-7 px-2 text-[11px]"
                                          onClick={() => setModal({ type: 'reject', hareket: h })}
                                        >
                                          Reddet
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="danger"
                                          className="h-7 px-2 text-[11px]"
                                          disabled={deleteMu.isPending}
                                          onClick={() => {
                                            if (window.confirm('Bu onaysız kaydı silmek istediğinize emin misiniz?')) {
                                              deleteMu.mutate(h.id)
                                            }
                                          }}
                                        >
                                          Sil
                                        </Button>
                                      </>
                                    ) : null}
                                    {onayli && h.tip !== 'DUZELTME' ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={() => setModal({ type: 'duzeltme', hareket: h })}
                                      >
                                        Düzeltme ekle
                                      </Button>
                                    ) : null}
                                    {onayli || reddedildi ? (
                                      <span className="text-[10px] text-ink-subtle">Düzenleme kapalı</span>
                                    ) : null}
                                  </div>
                                </TD>
                              </TR>
                            )
                          })
                        )}
                      </TBody>
                    </Table>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {tab === 'vekalet' ? (
            <div className="space-y-4">
              {vekaletListError ? (
                <AlertBox variant="danger" title="Vekalet">
                  {vekaletListError}
                </AlertBox>
              ) : null}
              {vekaletQuery.isLoading ? (
                <p className="text-sm text-ink-muted">Vekalet bilgileri yükleniyor…</p>
              ) : vekaletData ? (
                <>
                  <VekaletOzetCards
                    anlasilan={vekaletData.ozet.anlasilan}
                    odenenToplam={vekaletData.ozet.odenenToplam}
                    kalanVekalet={vekaletData.ozet.kalanVekalet}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {canVekaletDuzenle ? (
                      <Button type="button" size="sm" onClick={() => setVekModal({ type: 'vekalet-upsert' })}>
                        Vekalet ücreti düzenle
                      </Button>
                    ) : null}
                    {canTaksitEkle && vekaletData.vekaletUcreti ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => setVekModal({ type: 'taksit-create' })}>
                        Taksit ekle
                      </Button>
                    ) : null}
                    {!vekaletData.vekaletUcreti ? (
                      <p className="text-xs text-ink-muted">
                        {canVekaletDuzenle
                          ? 'Henüz vekalet ücreti tanımlanmadı. «Vekalet ücreti düzenle» ile ekleyebilirsiniz.'
                          : 'Vekalet ücreti tanımlanmadı. Taksit eklemek için önce yönetici tanımlamalıdır.'}
                      </p>
                    ) : null}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <THead>
                        <TR>
                          <TH>Taksit no</TH>
                          <TH>Vade tarihi</TH>
                          <TH className="text-right">Taksit tutarı</TH>
                          <TH className="text-right">Ödenen</TH>
                          <TH className="text-right">Kalan</TH>
                          <TH>Durum</TH>
                          <TH>Son ödeme</TH>
                          <TH>Makbuz son</TH>
                          <TH>SMM</TH>
                          <TH>İşlem</TH>
                        </TR>
                      </THead>
                      <TBody>
                        {vekaletData.taksitler.length === 0 ? (
                          <TableEmptyRow colSpan={10}>Taksit kaydı yok.</TableEmptyRow>
                        ) : (
                          vekaletData.taksitler.map((t) => {
                            const row = resolveTaksitRow(t)
                            const iptal = t.odemeDurumu === 'IPTAL'
                            const odenebilir = !iptal && Number(row.kalanTutar) > 0
                            return (
                              <TR key={t.id} className={cn(iptal && 'opacity-60')}>
                                <TD className="tabular-nums font-medium">{t.taksitNo}</TD>
                                <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(t.vadeTarihi)}</TD>
                                <TD className="text-right font-medium tabular-nums">{formatCurrencyTR(Number(row.taksitTutari))}</TD>
                                <TD className="text-right tabular-nums">{formatCurrencyTR(Number(row.odenenToplam))}</TD>
                                <TD className="text-right tabular-nums">{formatCurrencyTR(Number(row.kalanTutar))}</TD>
                                <TD>
                                  <Badge variant={taksitDurumBadge(row.durum)} className="!normal-case">
                                    {taksitDurumLabel(row.durum)}
                                  </Badge>
                                </TD>
                                <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(row.sonOdemeTarihi ?? undefined)}</TD>
                                <TD className="font-mono text-xs">{row.sonMakbuzNo?.trim() ? row.sonMakbuzNo : '—'}</TD>
                                <TD>{smmDurumRozet(row.smmDurumu)}</TD>
                                <TD>
                                  <div className="flex flex-wrap gap-1">
                                    {odenebilir && canTaksitOdendi ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 px-2 text-[11px]"
                                        disabled={odemeTaksitMu.isPending}
                                        onClick={() => {
                                          odemeTaksitMu.reset()
                                          setVekModal({ type: 'taksit-odeme', t })
                                        }}
                                      >
                                        Ödeme al
                                      </Button>
                                    ) : null}
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-[11px]"
                                      onClick={() => setVekModal({ type: 'odeme-gecmisi', t })}
                                    >
                                      Ödeme geçmişi
                                    </Button>
                                    {row.smmDurumu === 'BEKLIYOR' && canSmmIsaretle ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 px-2 text-[11px]"
                                        disabled={smmOdemeMu.isPending}
                                        onClick={() => {
                                          const odemeId = resolveSmmBekleyenOdemeId(t, vekaletData?.smmBekleyen ?? [])
                                          if (odemeId) smmOdemeMu.mutate(odemeId)
                                        }}
                                      >
                                        SMM kesildi
                                      </Button>
                                    ) : null}
                                    {!iptal ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-[11px]"
                                        disabled={updateTaksitMu.isPending}
                                        onClick={() => setVekModal({ type: 'taksit-edit', t })}
                                      >
                                        Düzenle
                                      </Button>
                                    ) : null}
                                    {!iptal && canTaksitIptal ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="danger"
                                        className="h-7 px-2 text-[11px]"
                                        disabled={cancelTaksitMu.isPending}
                                        onClick={() => {
                                          if (
                                            window.confirm(
                                              t.odemeDurumu === 'ODENDI' || t.odemeDurumu === 'KISMI_ODENDI'
                                                ? 'Ödemeli taksiti iptal etmek istediğinize emin misiniz? (Yönetici işlemi)'
                                                : 'Bu taksiti iptal etmek istediğinize emin misiniz?'
                                            )
                                          ) {
                                            cancelTaksitMu.mutate(t.id)
                                          }
                                        }}
                                      >
                                        İptal
                                      </Button>
                                    ) : null}
                                  </div>
                                </TD>
                              </TR>
                            )
                          })
                        )}
                      </TBody>
                    </Table>
                  </div>
                </>
              ) : (
                <p className="text-sm text-ink-muted">Vekalet verisi yok.</p>
              )}
            </div>
          ) : null}

          {tab === 'smm' ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-muted">
                Vekalet tahsilatı yapılmış ancak SMM kesilmemiş ödemeler listelenir. Ana sayfadaki SMM bekleyen sayısı ile aynı
                veri kaynağını kullanır.
              </p>
              {vekaletQuery.isLoading ? (
                <p className="text-sm text-ink-muted">Yükleniyor…</p>
              ) : vekaletListError ? (
                <AlertBox variant="danger" title="SMM listesi">
                  {vekaletListError}
                </AlertBox>
              ) : vekaletData && vekaletData.smmBekleyen.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Tahsilat tarihi</TH>
                        <TH className="text-right">Tutar</TH>
                        <TH>Makbuz no</TH>
                        <TH>SMM durumu</TH>
                        <TH>İşlem</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {vekaletData.smmBekleyen.map((row) => {
                        const r = row as { id: string; odemeTarihi?: string; tutar?: string; makbuzNo?: string }
                        return (
                          <TR key={r.id}>
                            <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(r.odemeTarihi)}</TD>
                            <TD className="text-right font-medium tabular-nums">{formatCurrencyTR(Number(r.tutar ?? 0))}</TD>
                            <TD className="font-mono text-xs">{r.makbuzNo ?? '—'}</TD>
                            <TD>
                              <Badge variant="danger" className="animate-pulse !normal-case bg-rose-100 text-rose-800">
                                SMM bekliyor
                              </Badge>
                            </TD>
                            <TD>
                              {canSmmIsaretle ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 px-2 text-[11px]"
                                  disabled={smmOdemeMu.isPending}
                                  onClick={() => smmOdemeMu.mutate(r.id)}
                                >
                                  SMM kesildi
                                </Button>
                              ) : (
                                <span className="text-[11px] text-ink-muted">Yetki yok</span>
                              )}
                            </TD>
                          </TR>
                        )
                      })}
                    </TBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  title="SMM bekleyen yok"
                  description="Bu dosyada ödenmiş fakat SMM kesilmemiş vekalet taksiti bulunmuyor."
                />
              )}
            </div>
          ) : null}

          {tab === 'makbuz' ? (
            <div className="space-y-6">
              {hesapOzetiError ? <AlertBox variant="danger" title="Hesap özeti">{hesapOzetiError}</AlertBox> : null}
              {makbuzError ? <AlertBox variant="danger" title="Makbuzlar">{makbuzError}</AlertBox> : null}
              {makbuzQuery.isLoading || hesapOzetiQuery.isLoading ? (
                <p className="text-sm text-ink-muted">Makbuz listesi yükleniyor…</p>
              ) : makbuzData && hesapData ? (
                avansMakbuzRows.length === 0 && vekaletMakbuzListe.length === 0 ? (
                  <p className="text-sm text-ink-muted">Henüz yazdırılabilir makbuz yok.</p>
                ) : (
                  <>
                    <section className="space-y-2">
                      <h3 className="text-sm font-bold text-ink">Avans makbuzları</h3>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <Table>
                          <THead>
                            <TR>
                              <TH>Tarih</TH>
                              <TH>Belge / makbuz no</TH>
                              <TH className="text-right">Tutar</TH>
                              <TH>Açıklama</TH>
                              <TH>İşlem</TH>
                            </TR>
                          </THead>
                          <TBody>
                            {avansMakbuzRows.length === 0 ? (
                              <TableEmptyRow colSpan={5}>Onaylı avans girişi yok.</TableEmptyRow>
                            ) : (
                              avansMakbuzRows.map((row) => (
                                <TR key={row.id}>
                                  <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(row.tarih)}</TD>
                                  <TD className="font-mono text-xs">{row.makbuzNo || row.belgeNo}</TD>
                                  <TD className="text-right text-sm font-semibold tabular-nums">{formatCurrencyTR(Number(row.tutar))}</TD>
                                  <TD className="max-w-[220px] text-sm text-ink-muted">{row.aciklama?.trim() || '—'}</TD>
                                  <TD>
                                    <div className="flex flex-wrap gap-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={() => {
                                          const full = hesapData.kasaHareketleri.find((x) => x.id === row.id)
                                          if (!full) return
                                          const printedAt = new Date().toISOString()
                                          setReceiptModal({
                                            kind: 'advance',
                                            hareket: full,
                                            printRootId: `adv-rcpt-${row.id}-${Date.now()}`,
                                            printedAt
                                          })
                                        }}
                                      >
                                        Görüntüle
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={() => {
                                          const full = hesapData.kasaHareketleri.find((x) => x.id === row.id)
                                          if (!full) return
                                          const printedAt = new Date().toISOString()
                                          setReceiptModal({
                                            kind: 'advance',
                                            hareket: full,
                                            printRootId: `adv-rcpt-${row.id}-${Date.now()}`,
                                            printedAt
                                          })
                                          window.setTimeout(() => window.print(), 400)
                                        }}
                                      >
                                        Yazdır
                                      </Button>
                                    </div>
                                  </TD>
                                </TR>
                              ))
                            )}
                          </TBody>
                        </Table>
                      </div>
                    </section>

                    <section className="space-y-2">
                      <h3 className="text-sm font-bold text-ink">Vekalet makbuzları</h3>
                      <div className="overflow-x-auto rounded-lg border border-border">
                        <Table>
                          <THead>
                            <TR>
                              <TH>Taksit no</TH>
                              <TH>Ödeme tarihi</TH>
                              <TH>Makbuz no</TH>
                              <TH className="text-right">Tutar</TH>
                              <TH>SMM</TH>
                              <TH>İşlem</TH>
                            </TR>
                          </THead>
                          <TBody>
                            {vekaletMakbuzListe.length === 0 ? (
                              <TableEmptyRow colSpan={6}>Ödenmiş vekalet taksiti yok.</TableEmptyRow>
                            ) : (
                              vekaletMakbuzListe.map((row) => (
                                <TR key={row.id}>
                                  <TD className="font-medium tabular-nums">{row.taksitNo}</TD>
                                  <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(row.odemeTarihi ?? undefined)}</TD>
                                  <TD className="font-mono text-xs">{row.makbuzNo ?? '—'}</TD>
                                  <TD className="text-right text-sm font-semibold tabular-nums">{formatCurrencyTR(Number(row.tutar))}</TD>
                                  <TD className="text-xs text-ink-muted">{smmListeDurum(row)}</TD>
                                  <TD>
                                    <div className="flex flex-wrap gap-1">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={async () => {
                                          const odemeId = row.odemeId ?? row.id
                                          const res = await getVekaletOdemeMakbuz(odemeId)
                                          setReceiptModal({
                                            kind: 'vekalet-odeme',
                                            makbuz: res.makbuz,
                                            printRootId: `vek-odeme-${odemeId}-${Date.now()}`,
                                            printedAt: new Date().toISOString()
                                          })
                                        }}
                                      >
                                        Görüntüle
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={async () => {
                                          const odemeId = row.odemeId ?? row.id
                                          const res = await getVekaletOdemeMakbuz(odemeId)
                                          const printedAt = new Date().toISOString()
                                          setReceiptModal({
                                            kind: 'vekalet-odeme',
                                            makbuz: res.makbuz,
                                            printRootId: `vek-odeme-${odemeId}-${Date.now()}`,
                                            printedAt
                                          })
                                          window.setTimeout(() => window.print(), 400)
                                        }}
                                      >
                                        Yazdır
                                      </Button>
                                    </div>
                                  </TD>
                                </TR>
                              ))
                            )}
                          </TBody>
                        </Table>
                      </div>
                    </section>
                  </>
                )
              ) : (
                <p className="text-sm text-ink-muted">Makbuz listesi yüklenemedi.</p>
              )}
            </div>
          ) : null}

          {tab === 'hesap' ? (
            <div className="space-y-4">
              {hesapOzetiError ? <AlertBox variant="danger" title="Hesap özeti">{hesapOzetiError}</AlertBox> : null}
              {hesapOzetiQuery.isLoading ? (
                <p className="text-sm text-ink-muted">Hesap özeti yükleniyor…</p>
              ) : hesapData ? (
                <>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setReceiptModal({
                          kind: 'hesap',
                          printRootId: `hesap-${dosyaId}-${Date.now()}`,
                          printedAt: new Date().toISOString()
                        })
                      }
                    >
                      Hesap Özeti Yazdır
                    </Button>
                  </div>
                  <div className="rounded-lg border border-border bg-white p-4 dark:bg-surface-elevated">
                    <HesapOzetiPrintView data={hesapData} />
                  </div>
                  <p className="text-xs text-ink-subtle">
                    Dosya kasası bakiyesi yalnızca onaylı avans/masraf/düzeltme hareketlerinden hesaplanır. Vekalet ücreti ve taksitler
                    ayrı kayıttır; vekalet tahsilatı avans bakiyesine yansımaz.
                  </p>
                </>
              ) : (
                <p className="text-sm text-ink-muted">Hesap özeti yüklenemedi.</p>
              )}
            </div>
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}

function VekaletUpsertModal(props: {
  onClose: () => void
  loading: boolean
  error: string | null
  initialToplam: string
  initialAciklama: string
  onSubmit: (body: UpsertVekaletPayload) => void
}): ReactElement {
  const { onClose, loading, error, initialToplam, initialAciklama, onSubmit } = props
  const [toplam, setToplam] = useState(initialToplam ? String(initialToplam).replace('.', ',') : '')
  const [aciklama, setAciklama] = useState(initialAciklama ?? '')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const n = Number(String(toplam).replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('Geçerli pozitif toplam tutar girin.')
      return
    }
    onSubmit({ toplamTutar: n, aciklama: aciklama.trim() || null })
  }

  return (
    <ModalShell title="Vekalet ücreti" onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <Input label="Toplam tutar (TL)" value={toplam} onChange={(e) => setToplam(e.target.value)} placeholder="0,00" inputMode="decimal" />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Açıklama</label>
          <textarea
            className="min-h-[88px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-inner outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-surface-elevated"
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
            placeholder="İsteğe bağlı"
          />
        </div>
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

function VekaletTaksitCreateModal(props: {
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: CreateVekaletTaksitPayload) => void
}): ReactElement {
  const { onClose, loading, error, onSubmit } = props
  const [taksitNo, setTaksitNo] = useState('1')
  const [vade, setVade] = useState(todayInputDate())
  const [tutar, setTutar] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const no = Number(taksitNo)
    const amt = Number(tutar.replace(',', '.'))
    if (!Number.isFinite(no) || no < 1 || !Number.isInteger(no)) {
      setLocalErr('Geçerli taksit numarası girin (tam sayı, min 1).')
      return
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setLocalErr('Geçerli pozitif tutar girin.')
      return
    }
    onSubmit({
      taksitNo: no,
      vadeTarihi: `${vade}T00:00:00.000Z`,
      tutar: amt,
      aciklama: aciklama.trim() || null
    })
  }

  return (
    <ModalShell title="Taksit ekle" onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <Input label="Taksit no" value={taksitNo} onChange={(e) => setTaksitNo(e.target.value)} inputMode="numeric" />
        <Input label="Vade tarihi" type="date" value={vade} onChange={(e) => setVade(e.target.value)} />
        <Input label="Tutar (TL)" value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0,00" inputMode="decimal" />
        <Input label="Açıklama (isteğe bağlı)" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
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

function VekaletTaksitEditModal(props: {
  taksit: VekaletTaksitiDto
  onClose: () => void
  loading: boolean
  error: string | null
  canRevertPaid: boolean
  onSubmit: (body: UpdateVekaletTaksitPayload) => void
}): ReactElement {
  const { taksit, onClose, loading, error, canRevertPaid, onSubmit } = props
  const [taksitNo, setTaksitNo] = useState(String(taksit.taksitNo))
  const [vade, setVade] = useState(isoDateToInput(taksit.vadeTarihi))
  const [tutar, setTutar] = useState(String(taksit.tutar).replace('.', ','))
  const [aciklama, setAciklama] = useState(taksit.aciklama ?? '')
  const [odemeTarihi, setOdemeTarihi] = useState(
    taksit.odemeTarihi ? isoDateToInput(taksit.odemeTarihi) : todayInputDate()
  )
  const [revertUnpaid, setRevertUnpaid] = useState(false)
  const [localErr, setLocalErr] = useState<string | null>(null)

  const paid = taksit.odemeDurumu === 'ODENDI'

  const submit = (): void => {
    setLocalErr(null)
    const no = Number(taksitNo)
    const amt = Number(String(tutar).replace(',', '.'))
    if (!Number.isFinite(no) || no < 1 || !Number.isInteger(no)) {
      setLocalErr('Geçerli taksit numarası girin.')
      return
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setLocalErr('Geçerli pozitif tutar girin.')
      return
    }
    if (revertUnpaid && paid && canRevertPaid) {
      onSubmit({ odemeDurumu: 'ODENMEDI' })
      return
    }
    const body: UpdateVekaletTaksitPayload = {
      taksitNo: no,
      vadeTarihi: `${vade}T00:00:00.000Z`,
      tutar: amt,
      aciklama: aciklama.trim() || null
    }
    if (paid) {
      body.odemeTarihi = odemeTarihi ? `${odemeTarihi}T12:00:00.000Z` : null
    }
    onSubmit(body)
  }

  return (
    <ModalShell title={`Taksit düzenle — #${taksit.taksitNo}`} onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        {paid && canRevertPaid ? (
          <label className="flex cursor-pointer items-start gap-2 rounded-md border border-warning/40 bg-warning-soft/30 px-3 py-2 text-xs">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={revertUnpaid}
              onChange={(e) => setRevertUnpaid(e.target.checked)}
            />
            <span>
              <strong>Yönetici:</strong> Ödenmiş kaydı ödenmedi olarak işaretle (makbuz no ve ödeme tarihi sıfırlanır).
            </span>
          </label>
        ) : null}
        {revertUnpaid && paid && canRevertPaid ? (
          <p className="text-xs text-ink-muted">Kaydet derseniz yalnızca ödeme durumu güncellenir.</p>
        ) : (
          <>
            <Input label="Taksit no" value={taksitNo} onChange={(e) => setTaksitNo(e.target.value)} inputMode="numeric" disabled={revertUnpaid} />
            <Input label="Vade tarihi" type="date" value={vade} onChange={(e) => setVade(e.target.value)} disabled={revertUnpaid} />
            <Input label="Tutar (TL)" value={tutar} onChange={(e) => setTutar(e.target.value)} disabled={revertUnpaid} inputMode="decimal" />
            {paid ? <Input label="Ödeme tarihi" type="date" value={odemeTarihi} onChange={(e) => setOdemeTarihi(e.target.value)} /> : null}
            <Input label="Açıklama" value={aciklama} onChange={(e) => setAciklama(e.target.value)} disabled={revertUnpaid} />
          </>
        )}
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

function VekaletTaksitOdemeModal(props: {
  taksit: VekaletTaksitiDto
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: CreateVekaletTaksitOdemePayload) => void
}): ReactElement {
  const { taksit, onClose, loading, error, onSubmit } = props
  const resolved = resolveTaksitRow(taksit)
  const kalanNum = Number(resolved.kalanTutar)
  const [tutar, setTutar] = useState('')
  const [odemeTarihi, setOdemeTarihi] = useState(todayInputDate())
  const [odeme, setOdeme] = useState<OdemeYontemiApi>('NAKIT')
  const [aciklama, setAciklama] = useState('')
  const [smmKesildiMi, setSmmKesildiMi] = useState(false)
  const [localErr, setLocalErr] = useState<string | null>(null)

  const tahsilPlaceholder = `En fazla ${formatCurrencyTR(kalanNum)} tahsil edilebilir.`

  const fillKalan = (): void => {
    setLocalErr(null)
    setTutar(resolved.kalanTutar)
  }

  const submit = (): void => {
    setLocalErr(null)
    const trimmed = tutar.trim()
    if (!trimmed) {
      setLocalErr('Bugün tahsil edilen tutar boş olamaz.')
      return
    }
    const n = Number(trimmed.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('Bugün tahsil edilen tutar 0\'dan büyük olmalıdır.')
      return
    }
    if (n > kalanNum + 0.0001) {
      setLocalErr('Bugün tahsil edilen tutar kalan taksit tutarını aşamaz.')
      return
    }
    onSubmit({
      tutar: n,
      odemeTarihi: `${odemeTarihi}T12:00:00.000Z`,
      odemeYontemi: odeme,
      aciklama: aciklama.trim() || null,
      smmKesildiMi
    })
  }

  return (
    <ModalShell title={`Ödeme al — taksit #${taksit.taksitNo}`} onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <div className="grid gap-2 rounded-md border border-border bg-surface-muted/40 p-3 text-xs">
          <div className="flex justify-between">
            <span>Taksit tutarı</span>
            <span className="font-semibold tabular-nums">{formatCurrencyTR(Number(resolved.taksitTutari))}</span>
          </div>
          <div className="flex justify-between">
            <span>Şimdiye kadar ödenen</span>
            <span className="font-semibold tabular-nums">{formatCurrencyTR(Number(resolved.odenenToplam))}</span>
          </div>
          <div className="flex justify-between">
            <span>Ödenmesi gereken kalan tutar</span>
            <span className="font-semibold tabular-nums text-primary">{formatCurrencyTR(kalanNum)}</span>
          </div>
        </div>
        <div className="space-y-1">
          <Input
            label="Bugün tahsil edilen tutar (TL)"
            value={tutar}
            onChange={(e) => setTutar(e.target.value)}
            inputMode="decimal"
            placeholder={tahsilPlaceholder}
            hint="Kısmi ödeme alabilirsiniz. Girilen tutar kalan taksit tutarını aşamaz."
          />
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={fillKalan} disabled={loading || kalanNum <= 0}>
              Kalanın tamamını al
            </Button>
          </div>
        </div>
        <Input label="Ödeme tarihi" type="date" value={odemeTarihi} onChange={(e) => setOdemeTarihi(e.target.value)} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
          <select className={selectClassName()} value={odeme} onChange={(e) => setOdeme(e.target.value as OdemeYontemiApi)}>
            {ODEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <Input label="Açıklama (isteğe bağlı)" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <input type="checkbox" checked={smmKesildiMi} onChange={(e) => setSmmKesildiMi(e.target.checked)} />
          SMM kesildi mi
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Vazgeç</Button>
          <Button type="button" onClick={submit} disabled={loading}>{loading ? 'Kaydediliyor…' : 'Kaydet'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

function VekaletOdemeGecmisiModal(props: {
  taksit: VekaletTaksitiDto
  onClose: () => void
  canSmm: boolean
  smmLoading: boolean
  onSmmKesildi: (odemeId: string) => void
  onMakbuz: (odemeId: string) => void | Promise<void>
}): ReactElement {
  const { taksit, onClose, canSmm, smmLoading, onSmmKesildi, onMakbuz } = props
  const q = useQuery({
    queryKey: ['taksit-odemeler', taksit.id],
    queryFn: () => listVekaletTaksitOdemeler(taksit.id)
  })

  return (
    <ModalShell title={`Ödeme geçmişi — taksit #${taksit.taksitNo}`} onClose={onClose}>
      <div className="space-y-3">
        {q.isLoading ? <p className="text-sm text-ink-muted">Yükleniyor…</p> : null}
        {q.isError ? <AlertBox variant="danger" title="Hata">{(q.error as Error).message}</AlertBox> : null}
        {q.data && q.data.items.length === 0 ? (
          <p className="text-sm text-ink-muted">Henüz ödeme kaydı yok.</p>
        ) : null}
        {q.data && q.data.items.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <THead>
                <TR>
                  <TH>Tarih</TH>
                  <TH className="text-right">Tutar</TH>
                  <TH>Ödeme yöntemi</TH>
                  <TH>Makbuz no</TH>
                  <TH>SMM durumu</TH>
                  <TH>İşlem</TH>
                </TR>
              </THead>
              <TBody>
                {q.data.items.map((o: VekaletTaksitOdemeDto) => (
                  <TR key={o.id}>
                    <TD className="whitespace-nowrap">{formatDateTR(o.odemeTarihi)}</TD>
                    <TD className="text-right tabular-nums">{formatCurrencyTR(Number(o.tutar))}</TD>
                    <TD>{odemeLabel(o.odemeYontemi)}</TD>
                    <TD className="font-mono text-xs">{o.makbuzNo}</TD>
                    <TD>
                      {o.smmKesildiMi ? (
                        <Badge variant="success" className="!normal-case">SMM kesildi</Badge>
                      ) : (
                        <Badge variant="danger" className="animate-pulse !normal-case bg-rose-100 text-rose-800">SMM bekliyor</Badge>
                      )}
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-[11px]" onClick={() => void onMakbuz(o.id)}>
                          Makbuz
                        </Button>
                        {!o.smmKesildiMi && canSmm ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-[11px]"
                            disabled={smmLoading}
                            onClick={() => onSmmKesildi(o.id)}
                          >
                            SMM kesildi
                          </Button>
                        ) : null}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        ) : null}
        <div className="flex justify-end pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Kapat</Button>
        </div>
      </div>
    </ModalShell>
  )
}

function selectClassName(err?: string | null): string {
  return cn(
    'h-9 w-full rounded-md border bg-white px-3 text-sm text-ink shadow-inner outline-none transition',
    'border-border focus:border-primary focus:ring-2 focus:ring-primary/15',
    err && 'border-danger'
  )
}

function AvansModal(props: {
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: import('../types/kasa').CreateKasaHareketiPayload) => void
}): ReactElement {
  const { onClose, loading, error, onSubmit } = props
  const [tarih, setTarih] = useState(todayInputDate())
  const [tutar, setTutar] = useState('')
  const [odeme, setOdeme] = useState<OdemeYontemiApi>('NAKIT')
  const [aciklama, setAciklama] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const n = Number(tutar.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('Geçerli pozitif tutar girin.')
      return
    }
    onSubmit({
      tip: 'AVANS_GIRISI',
      tarih,
      tutar: n,
      odemeYontemi: odeme,
      aciklama: aciklama.trim() || null
    })
  }

  return (
    <ModalShell title="Avans girişi" onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <Input label="Tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        <Input label="Tutar (TL)" value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0,00" inputMode="decimal" />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
          <select className={selectClassName()} value={odeme} onChange={(e) => setOdeme(e.target.value as OdemeYontemiApi)}>
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
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function MasrafModal(props: {
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: import('../types/kasa').CreateKasaHareketiPayload) => void
}): ReactElement {
  const { onClose, loading, error, onSubmit } = props
  const [tarih, setTarih] = useState(todayInputDate())
  const [masrafTuru, setMasrafTuru] = useState<string>(MASRAF_TURU_OPTIONS[0])
  const [ozelMasrafAdi, setOzelMasrafAdi] = useState('')
  const [tutar, setTutar] = useState('')
  const [masrafiYapanKisi, setMasrafiYapanKisi] = useState('')
  const [odeme, setOdeme] = useState<OdemeYontemiApi>('NAKIT')
  const [aciklama, setAciklama] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const diger = masrafTuru === 'Diğer masraf'

  const submit = (): void => {
    setLocalErr(null)
    const n = Number(tutar.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('Geçerli pozitif tutar girin.')
      return
    }
    if (diger && ozelMasrafAdi.trim().length < 2) {
      setLocalErr('Diğer masraf için özel ad zorunludur.')
      return
    }
    const myk = masrafiYapanKisi.trim()
    if (myk.length < 2) {
      setLocalErr('Masrafı yapan kişi zorunludur.')
      return
    }
    onSubmit({
      tip: 'MASRAF',
      tarih,
      tutar: n,
      odemeYontemi: odeme,
      masrafTuru,
      masrafiYapanKisi: myk,
      ozelMasrafAdi: diger ? ozelMasrafAdi.trim() : null,
      aciklama: aciklama.trim() || null
    })
  }

  return (
    <ModalShell title="Masraf girişi" onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <Input label="Tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Masraf türü</label>
          <select className={selectClassName()} value={masrafTuru} onChange={(e) => setMasrafTuru(e.target.value)}>
            {MASRAF_TURU_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        {diger ? (
          <Input label="Özel masraf adı" value={ozelMasrafAdi} onChange={(e) => setOzelMasrafAdi(e.target.value)} required />
        ) : null}
        <Input label="Tutar (TL)" value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0,00" inputMode="decimal" />
        <Input
          label="Masrafı yapan kişi"
          value={masrafiYapanKisi}
          onChange={(e) => setMasrafiYapanKisi(e.target.value)}
          placeholder="Zorunlu"
          required
        />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
          <select className={selectClassName()} value={odeme} onChange={(e) => setOdeme(e.target.value as OdemeYontemiApi)}>
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
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function RejectModal(props: {
  belgeNo: string
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (s: string) => void
}): ReactElement {
  const { belgeNo, onClose, loading, error, onSubmit } = props
  const [red, setRed] = useState('')
  return (
    <ModalShell title={`Red — ${belgeNo}`} onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Red sebebi</label>
          <textarea
            className="min-h-[100px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-inner outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            value={red}
            onChange={(e) => setRed(e.target.value)}
            placeholder="En az 3 karakter"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="button" variant="danger" onClick={() => onSubmit(red.trim())} disabled={loading || red.trim().length < 3}>
            {loading ? 'Gönderiliyor…' : 'Reddet'}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function DuzeltmeModal(props: {
  belgeNo: string
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: import('../types/kasa').CreateDuzeltmePayload) => void
}): ReactElement {
  const { belgeNo, onClose, loading, error, onSubmit } = props
  const [tarih, setTarih] = useState(todayInputDate())
  const [tutar, setTutar] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const n = Number(tutar.replace(',', '.'))
    if (!Number.isFinite(n) || n === 0) {
      setLocalErr('Sıfır olmayan bir tutar girin (pozitif veya negatif).')
      return
    }
    if (aciklama.trim().length < 3) {
      setLocalErr('Açıklama en az 3 karakter olmalıdır.')
      return
    }
    onSubmit({ tarih, tutar: n, aciklama: aciklama.trim() })
  }

  return (
    <ModalShell title={`Düzeltme talebi — ${belgeNo}`} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-ink-muted">
          Orijinal satır değişmez. Kayıt onaylandığında bakiyeye yansır.
        </p>
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <Input label="Tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        <Input
          label="Tutar (pozitif veya negatif)"
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          placeholder="-100 veya 100"
          inputMode="decimal"
        />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Açıklama</label>
          <textarea
            className="min-h-[88px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-inner outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? 'Gönderiliyor…' : 'Düzeltme oluştur'}
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
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
