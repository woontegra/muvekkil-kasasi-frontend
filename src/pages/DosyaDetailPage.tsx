import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
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
  createTekVekaletTaksiti,
  createVekaletPesinOdeme,
  createVekaletTaksitOdeme,
  createVekaletTaksitPlani,
  deleteVekaletTaksiti,
  getDosyaVekalet,
  getVekaletOdemeMakbuz,
  listVekaletTaksitOdemeler,
  markOdemeSmmKesildi,
  updateVekaletTaksiti,
  upsertDosyaVekalet
} from '../api/vekalet'
import { TahsilatiYapanPersonelSelect } from '../components/prim/TahsilatiYapanPersonelSelect'
import { ApiError, resolveOdemeApiError } from '../api/client'
import { APP_BASE, HOME_PAGE_LABEL } from '../config/appPaths'
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
  TR,
  tableActionButtonShrinkClass,
  tableActionsFlexRow
} from '../components/ui'
import { cn } from '../lib/cn'
import { resolveSmmBekleyenOdemeId, resolveTaksitRow } from '../lib/vekaletTaksitOzet'
import { formatCurrencyTR, formatDateTR } from '../utils/formatters'
import { MASRAF_TURU_OPTIONS, type KasaHareketiDto, type OdemeYontemiApi } from '../types/kasa'
import type {
  CreateVekaletPesinOdemePayload,
  CreateVekaletTaksitOdemePayload,
  CreateVekaletTaksitPlaniPayload,
  CreateTekVekaletTaksitiPayload,
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
  | { type: 'tek-taksit' }
  | { type: 'taksit-plani' }
  | { type: 'pesin-odeme' }
  | { type: 'taksit-edit'; t: VekaletTaksitiDto }
  | { type: 'taksit-odeme'; t: VekaletTaksitiDto }
  | { type: 'odeme-gecmisi'; t: VekaletTaksitiDto }

const vekaletIconBtnClass =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-white text-sm hover:bg-surface-muted disabled:opacity-50'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'kasa', label: 'Kasa Hareketleri' },
  { key: 'vekalet', label: 'Anlaşılan vekalet ücreti ve taksitler' },
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
          Vekalet sekmesine git
        </Button>
      ) : null}
    </div>
  )
}

function VekaletOzetRow(props: { anlasilan: string; odenenToplam: string; kalanVekalet: string }): ReactElement {
  const { anlasilan, odenenToplam, kalanVekalet } = props
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <THead>
          <TR>
            <TH>Anlaşılan</TH>
            <TH className="text-right">Ödenen toplam</TH>
            <TH className="text-right">Kalan vekalet</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD className="font-semibold tabular-nums">{formatCurrencyTR(Number(anlasilan))}</TD>
            <TD className="text-right font-semibold tabular-nums">{formatCurrencyTR(Number(odenenToplam))}</TD>
            <TD className="text-right font-semibold tabular-nums">{formatCurrencyTR(Number(kalanVekalet))}</TD>
          </TR>
        </TBody>
      </Table>
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
    void queryClient.invalidateQueries({ queryKey: ['ofis-kasa'] })
    void queryClient.invalidateQueries({ queryKey: ['prim'] })
    invalidateDashboardSummary(queryClient)
  }

  const upsertVekMu = useMutation({
    mutationFn: (body: UpsertVekaletPayload) => upsertDosyaVekalet(dosyaId!, body),
    onSuccess: () => {
      invalidateVekalet()
      setVekModal(null)
    }
  })
  const createTekTaksitMu = useMutation({
    mutationFn: (body: CreateTekVekaletTaksitiPayload) => createTekVekaletTaksiti(dosyaId!, body),
    onSuccess: () => {
      invalidateVekalet()
      setVekModal(null)
    }
  })
  const createTaksitPlaniMu = useMutation({
    mutationFn: (body: CreateVekaletTaksitPlaniPayload) => createVekaletTaksitPlani(dosyaId!, body),
    onSuccess: () => {
      invalidateVekalet()
      setVekModal(null)
    }
  })
  const pesinOdemeMu = useMutation({
    mutationFn: (body: CreateVekaletPesinOdemePayload) => createVekaletPesinOdeme(dosyaId!, body),
    onSuccess: () => {
      invalidateVekalet()
      invalidateSmmBekleyen(queryClient)
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
      invalidateSmmBekleyen(queryClient)
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
  const deleteTaksitMu = useMutation({
    mutationFn: (id: string) => deleteVekaletTaksiti(id),
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

  const vekaletData = vekaletQuery.data

  const kalanTaksitlendirme = useMemo(() => {
    if (!vekaletData?.vekaletUcreti) return 0
    const anlasilan = Number(vekaletData.ozet.anlasilan)
    const taksitToplam = vekaletData.taksitler
      .filter((t) => t.odemeDurumu !== 'IPTAL')
      .reduce((s, t) => s + Number(t.tutar), 0)
    return Math.max(0, Math.round((anlasilan - taksitToplam) * 100) / 100)
  }, [vekaletData])

  const kalanVekaletNum = useMemo(() => {
    if (!vekaletData?.vekaletUcreti) return 0
    return Math.max(0, Number(vekaletData.ozet.kalanVekalet))
  }, [vekaletData])

  const acikTaksitVar = useMemo(() => {
    if (!vekaletData?.taksitler.length) return false
    return vekaletData.taksitler.some(
      (t) => t.odemeDurumu !== 'IPTAL' && t.odemeDurumu !== 'ODENDI'
    )
  }, [vekaletData])

  const taksitPlaniYapilabilir = kalanTaksitlendirme > 0.0001 && !acikTaksitVar
  const tekTaksitYapilabilir = kalanTaksitlendirme > 0.0001 && kalanVekaletNum > 0.0001 && !acikTaksitVar

  const taksitToplamUyumsuz = useMemo(() => {
    if (!vekaletData?.vekaletUcreti) return false
    const anlasilan = Number(vekaletData.ozet.anlasilan)
    const taksitToplam = vekaletData.taksitler
      .filter((t) => t.odemeDurumu !== 'IPTAL')
      .reduce((s, t) => s + Number(t.tutar), 0)
    return vekaletData.taksitler.some((t) => t.odemeDurumu !== 'IPTAL') && Math.abs(taksitToplam - anlasilan) > 0.01
  }, [vekaletData])

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
          {HOME_PAGE_LABEL}
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
      {vekModal?.type === 'tek-taksit' ? (
        <VekaletTekTaksitModal
          kalanTaksitlendirme={kalanTaksitlendirme}
          kalanVekalet={kalanVekaletNum}
          onClose={() => setVekModal(null)}
          loading={createTekTaksitMu.isPending}
          error={createTekTaksitMu.error instanceof Error ? createTekTaksitMu.error.message : null}
          onSubmit={(body) => createTekTaksitMu.mutate(body)}
        />
      ) : null}
      {vekModal?.type === 'taksit-plani' ? (
        <VekaletTaksitPlaniModal
          kalanTaksitlendirme={kalanTaksitlendirme}
          onClose={() => setVekModal(null)}
          loading={createTaksitPlaniMu.isPending}
          error={createTaksitPlaniMu.error instanceof Error ? createTaksitPlaniMu.error.message : null}
          onSubmit={(body) => createTaksitPlaniMu.mutate(body)}
        />
      ) : null}
      {vekModal?.type === 'pesin-odeme' && vekaletData ? (
        <VekaletPesinOdemeModal
          kalanVekalet={vekaletData.ozet.kalanVekalet}
          onClose={() => {
            pesinOdemeMu.reset()
            setVekModal(null)
          }}
          loading={pesinOdemeMu.isPending}
          error={resolveOdemeApiError(pesinOdemeMu.error)}
          onSubmit={(body) => pesinOdemeMu.mutate(body)}
        />
      ) : null}
      {vekModal?.type === 'taksit-edit' ? (
        <VekaletTaksitEditModal
          key={vekModal.t.id}
          taksit={vekModal.t}
          onClose={() => setVekModal(null)}
          loading={updateTaksitMu.isPending}
          error={updateTaksitMu.error instanceof Error ? updateTaksitMu.error.message : null}
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
          {HOME_PAGE_LABEL}
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
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-ink">Anlaşılan vekalet ücreti ve taksitler</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  Vekalet ücreti avans kasasından ayrıdır; avans bakiyesini etkilemez.
                </p>
              </div>
              {vekaletListError ? (
                <AlertBox variant="danger" title="Vekalet">
                  {vekaletListError}
                </AlertBox>
              ) : null}
              {vekaletQuery.isLoading ? (
                <p className="text-sm text-ink-muted">Vekalet bilgileri yükleniyor…</p>
              ) : vekaletData ? (
                <>
                  <VekaletOzetRow
                    anlasilan={vekaletData.ozet.anlasilan}
                    odenenToplam={vekaletData.ozet.odenenToplam}
                    kalanVekalet={vekaletData.ozet.kalanVekalet}
                  />
                  {taksitToplamUyumsuz ? (
                    <p className="text-xs text-warning">Taksit toplamı anlaşılan vekalet tutarıyla eşleşmiyor.</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {canVekaletDuzenle ? (
                      <Button type="button" size="sm" onClick={() => setVekModal({ type: 'vekalet-upsert' })}>
                        Düzenle
                      </Button>
                    ) : null}
                    {canTaksitOdendi && vekaletData.vekaletUcreti && Number(vekaletData.ozet.kalanVekalet) > 0 ? (
                      <Button type="button" size="sm" variant="secondary" onClick={() => setVekModal({ type: 'pesin-odeme' })}>
                        Peşin ödeme al
                      </Button>
                    ) : null}
                    {canTaksitEkle && vekaletData.vekaletUcreti ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!tekTaksitYapilabilir}
                        title={
                          acikTaksitVar
                            ? 'Açık taksitler var. Önce mevcut açık taksitleri silin veya düzenleyin.'
                            : kalanTaksitlendirme <= 0
                              ? 'Taksitlendirilebilir kalan tutar yok.'
                              : undefined
                        }
                        onClick={() => {
                          if (acikTaksitVar) {
                            window.alert(
                              'Açık taksitler var. Tek taksit oluşturmak için önce mevcut açık taksitleri silin veya düzenleyin.'
                            )
                            return
                          }
                          if (kalanTaksitlendirme <= 0) {
                            window.alert('Taksitlendirilebilir kalan tutar yok.')
                            return
                          }
                          setVekModal({ type: 'tek-taksit' })
                        }}
                      >
                        Tek taksit
                      </Button>
                    ) : null}
                    {canTaksitEkle && vekaletData.vekaletUcreti ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={!taksitPlaniYapilabilir}
                        title={
                          acikTaksitVar
                            ? 'Açık taksitler var. Önce mevcut açık taksitleri silin veya düzenleyin.'
                            : kalanTaksitlendirme <= 0
                              ? 'Taksitlendirilebilir kalan tutar yok.'
                              : undefined
                        }
                        onClick={() => {
                          if (acikTaksitVar) {
                            window.alert(
                              'Açık taksitler var. Taksit planı oluşturmak için önce mevcut açık taksitleri silin veya düzenleyin.'
                            )
                            return
                          }
                          if (kalanTaksitlendirme <= 0) {
                            window.alert('Taksitlendirilebilir kalan tutar yok.')
                            return
                          }
                          setVekModal({ type: 'taksit-plani' })
                        }}
                      >
                        Taksit planı
                      </Button>
                    ) : null}
                    {!vekaletData.vekaletUcreti ? (
                      <p className="text-xs text-ink-muted">
                        {canVekaletDuzenle
                          ? 'Henüz vekalet ücreti tanımlanmadı. «Düzenle» ile ekleyebilirsiniz.'
                          : 'Vekalet ücreti tanımlanmadı. Taksit eklemek için önce yönetici tanımlamalıdır.'}
                      </p>
                    ) : null}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border text-xs">
                    <Table>
                      <THead>
                        <TR>
                          <TH className="!py-2">Taksit no</TH>
                          <TH className="!py-2">Vade tarihi</TH>
                          <TH className="!py-2 text-right">Taksit tutarı</TH>
                          <TH className="!py-2 text-right">Ödenen</TH>
                          <TH className="!py-2 text-right">Kalan</TH>
                          <TH className="!py-2">Durum</TH>
                          <TH className="!py-2">Son ödeme</TH>
                          <TH className="!py-2">Makbuz son</TH>
                          <TH className="!py-2">SMM</TH>
                          <TH className="!py-2 text-right">İşlem</TH>
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
                            const silinebilir = !iptal && Number(row.odenenToplam) === 0
                            return (
                              <TR key={t.id} className={cn(iptal && 'opacity-60')}>
                                <TD className="tabular-nums font-medium !py-1.5">{t.taksitNo}</TD>
                                <TD className="whitespace-nowrap text-ink-muted !py-1.5">{formatDateTR(t.vadeTarihi)}</TD>
                                <TD className="text-right font-medium tabular-nums !py-1.5">{formatCurrencyTR(Number(row.taksitTutari))}</TD>
                                <TD className="text-right tabular-nums !py-1.5">{formatCurrencyTR(Number(row.odenenToplam))}</TD>
                                <TD className="text-right tabular-nums !py-1.5">{formatCurrencyTR(Number(row.kalanTutar))}</TD>
                                <TD className="!py-1.5">
                                  <Badge variant={taksitDurumBadge(row.durum)} className="!normal-case">
                                    {taksitDurumLabel(row.durum)}
                                  </Badge>
                                </TD>
                                <TD className="whitespace-nowrap text-ink-muted !py-1.5">{formatDateTR(row.sonOdemeTarihi ?? undefined)}</TD>
                                <TD className="font-mono text-[11px] !py-1.5">{row.sonMakbuzNo?.trim() ? row.sonMakbuzNo : '—'}</TD>
                                <TD className="!py-1.5">{smmDurumRozet(row.smmDurumu)}</TD>
                                <TD className="!py-1.5">
                                  <div className={tableActionsFlexRow}>
                                    {odenebilir && canTaksitOdendi ? (
                                      <button
                                        type="button"
                                        className={cn(vekaletIconBtnClass, tableActionButtonShrinkClass)}
                                        title="Ödeme al"
                                        disabled={odemeTaksitMu.isPending}
                                        onClick={() => {
                                          odemeTaksitMu.reset()
                                          setVekModal({ type: 'taksit-odeme', t })
                                        }}
                                      >
                                        ₺
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      className={cn(vekaletIconBtnClass, tableActionButtonShrinkClass)}
                                      title="Ödeme geçmişi"
                                      onClick={() => setVekModal({ type: 'odeme-gecmisi', t })}
                                    >
                                      ⏱
                                    </button>
                                    {row.smmDurumu === 'BEKLIYOR' && canSmmIsaretle ? (
                                      <button
                                        type="button"
                                        className={cn(vekaletIconBtnClass, tableActionButtonShrinkClass)}
                                        title="SMM Kesildi"
                                        disabled={smmOdemeMu.isPending}
                                        onClick={() => {
                                          const odemeId = resolveSmmBekleyenOdemeId(t, vekaletData?.smmBekleyen ?? [])
                                          if (odemeId) smmOdemeMu.mutate(odemeId)
                                        }}
                                      >
                                        ✓
                                      </button>
                                    ) : null}
                                    {Number(row.odenenToplam) > 0 ? (
                                      <button
                                        type="button"
                                        className={cn(vekaletIconBtnClass, tableActionButtonShrinkClass)}
                                        title="Makbuz"
                                        onClick={async () => {
                                          const odemeler = await listVekaletTaksitOdemeler(t.id)
                                          const last = odemeler.items[0]
                                          if (!last) return
                                          const res = await getVekaletOdemeMakbuz(last.id)
                                          setReceiptModal({
                                            kind: 'vekalet-odeme',
                                            makbuz: res.makbuz,
                                            printRootId: `vek-odeme-${last.id}-${Date.now()}`,
                                            printedAt: new Date().toISOString()
                                          })
                                        }}
                                      >
                                        🧾
                                      </button>
                                    ) : null}
                                    {!iptal ? (
                                      <button
                                        type="button"
                                        className={cn(vekaletIconBtnClass, tableActionButtonShrinkClass)}
                                        title="Taksit düzenle"
                                        disabled={updateTaksitMu.isPending}
                                        onClick={() => setVekModal({ type: 'taksit-edit', t })}
                                      >
                                        ✎
                                      </button>
                                    ) : null}
                                    {silinebilir && canTaksitEkle ? (
                                      <button
                                        type="button"
                                        className={cn(vekaletIconBtnClass, tableActionButtonShrinkClass, 'text-danger')}
                                        title="Sil"
                                        disabled={deleteTaksitMu.isPending}
                                        onClick={() => {
                                          if (window.confirm('Bu taksiti silmek istediğinize emin misiniz?')) {
                                            deleteTaksitMu.mutate(t.id)
                                          }
                                        }}
                                      >
                                        🗑
                                      </button>
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

function VekaletTekTaksitModal(props: {
  kalanTaksitlendirme: number
  kalanVekalet: number
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: CreateTekVekaletTaksitiPayload) => void
}): ReactElement {
  const { kalanTaksitlendirme, kalanVekalet, onClose, loading, error, onSubmit } = props
  const varsayilanTutar = Math.min(kalanTaksitlendirme, kalanVekalet)
  const [vade, setVade] = useState(todayInputDate())
  const [tutar, setTutar] = useState(String(varsayilanTutar))
  const [aciklama, setAciklama] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const amt = Number(String(tutar).replace(',', '.'))
    if (!Number.isFinite(amt) || amt <= 0) {
      setLocalErr('Geçerli pozitif tutar girin.')
      return
    }
    const maxTutar = Math.min(kalanTaksitlendirme, kalanVekalet)
    if (amt > maxTutar + 0.0001) {
      setLocalErr('Tutar kalan vekalet veya taksitlendirilebilir tutarı aşamaz.')
      return
    }
    onSubmit({
      vadeTarihi: `${vade}T00:00:00.000Z`,
      tutar: amt,
      aciklama: aciklama.trim() || null
    })
  }

  return (
    <ModalShell title="Tek taksit oluştur" onClose={onClose} wide>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <p className="text-xs text-ink-muted">
          Kalan vekalet: <strong className="tabular-nums">{formatCurrencyTR(kalanVekalet)}</strong>
          {' · '}
          Taksitlendirilebilir: <strong className="tabular-nums">{formatCurrencyTR(kalanTaksitlendirme)}</strong>
        </p>
        <Input label="Vade tarihi" type="date" value={vade} onChange={(e) => setVade(e.target.value)} />
        <Input
          label="Taksit tutarı"
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          placeholder="0,00"
          inputMode="decimal"
          hint="Varsayılan: kalan vekalet tutarı."
        />
        <Input label="Açıklama (isteğe bağlı)" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Vazgeç</Button>
          <Button type="button" onClick={submit} disabled={loading}>{loading ? 'Kaydediliyor…' : 'Taksit oluştur'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

function VekaletTaksitPlaniModal(props: {
  kalanTaksitlendirme: number
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: CreateVekaletTaksitPlaniPayload) => void
}): ReactElement {
  const { kalanTaksitlendirme, onClose, loading, error, onSubmit } = props
  const [adet, setAdet] = useState('5')
  const [ilkVade, setIlkVade] = useState(todayInputDate())
  const [taksitTutari, setTaksitTutari] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const planToplam = useMemo(() => {
    const t = Number(String(taksitTutari).replace(',', '.'))
    const a = Number(adet)
    if (!Number.isFinite(t) || !Number.isFinite(a) || t <= 0 || a < 1) return null
    return Math.round(t * a * 100) / 100
  }, [taksitTutari, adet])

  const submit = (): void => {
    setLocalErr(null)
    const a = Number(adet)
    const t = Number(String(taksitTutari).replace(',', '.'))
    if (!Number.isInteger(a) || a < 1) {
      setLocalErr('Geçerli taksit sayısı girin.')
      return
    }
    if (!Number.isFinite(t) || t <= 0) {
      setLocalErr('Geçerli taksit tutarı girin.')
      return
    }
    if (planToplam != null && planToplam > kalanTaksitlendirme + 0.005) {
      setLocalErr('Plan toplamı kalan taksitlendirilebilir tutarı aşıyor.')
      return
    }
    onSubmit({
      taksitSayisi: a,
      ilkVadeTarihi: `${ilkVade}T00:00:00.000Z`,
      taksitTutari: t,
      aciklama: aciklama.trim() || null
    })
  }

  return (
    <ModalShell title="Taksit planı oluştur" onClose={onClose} wide>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <p className="text-xs text-ink-muted">
          Kalan taksitlendirilebilir tutar: <strong className="tabular-nums">{formatCurrencyTR(kalanTaksitlendirme)}</strong>
        </p>
        <Input label="Taksit sayısı" value={adet} onChange={(e) => setAdet(e.target.value)} inputMode="numeric" />
        <Input label="İlk vade tarihi" type="date" value={ilkVade} onChange={(e) => setIlkVade(e.target.value)} />
        <p className="text-xs text-ink-muted">Taksit aralığı: aylık (vade tarihleri her ay ilerler)</p>
        <Input
          label="Taksit tutarı (aylık)"
          value={taksitTutari}
          onChange={(e) => setTaksitTutari(e.target.value)}
          inputMode="decimal"
          hint="Her taksit için sabit tutar. Toplam kalan taksitlendirilebilir tutarı aşamaz."
        />
        {planToplam != null ? (
          <p className="text-xs text-ink-muted">Plan toplamı: <strong className="tabular-nums">{formatCurrencyTR(planToplam)}</strong></p>
        ) : null}
        <Input label="Açıklama (isteğe bağlı)" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Vazgeç</Button>
          <Button type="button" onClick={submit} disabled={loading}>{loading ? 'Oluşturuluyor…' : 'Taksit planı oluştur'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

function VekaletPesinOdemeModal(props: {
  kalanVekalet: string
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: CreateVekaletPesinOdemePayload) => void
}): ReactElement {
  const { kalanVekalet, onClose, loading, error, onSubmit } = props
  const kalanNum = Number(kalanVekalet)
  const [tutar, setTutar] = useState(kalanVekalet)
  const [odemeTarihi, setOdemeTarihi] = useState(todayInputDate())
  const [odeme, setOdeme] = useState<OdemeYontemiApi>('NAKIT')
  const [aciklama, setAciklama] = useState('')
  const [tahsilatiYapanPersonelId, setTahsilatiYapanPersonelId] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    if (!tahsilatiYapanPersonelId) {
      setLocalErr('Tahsilatı yapan personel seçin.')
      return
    }
    const n = Number(String(tutar).replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('Tutar 0\'dan büyük olmalıdır.')
      return
    }
    if (n > kalanNum + 0.0001) {
      setLocalErr('Tutar kalan vekaleti aşamaz.')
      return
    }
    onSubmit({
      tutar: n,
      odemeTarihi: `${odemeTarihi}T12:00:00.000Z`,
      odemeYontemi: odeme,
      aciklama: aciklama.trim() || null,
      tahsilatiYapanPersonelId: tahsilatiYapanPersonelId || null
    })
  }

  return (
    <ModalShell title="Peşin vekalet ödemesi al" onClose={onClose} wide>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <p className="text-xs text-ink-muted">
          Kalan vekalet: <strong className="tabular-nums">{formatCurrencyTR(kalanNum)}</strong>
        </p>
        <Input label="Tutar" value={tutar} onChange={(e) => setTutar(e.target.value)} inputMode="decimal" />
        <Input label="Tarih" type="date" value={odemeTarihi} onChange={(e) => setOdemeTarihi(e.target.value)} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
          <select className={selectClassName()} value={odeme} onChange={(e) => setOdeme(e.target.value as OdemeYontemiApi)}>
            {ODEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <TahsilatiYapanPersonelSelect value={tahsilatiYapanPersonelId} onChange={setTahsilatiYapanPersonelId} />
        <Input label="Açıklama / not" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Vazgeç</Button>
          <Button type="button" onClick={submit} disabled={loading}>{loading ? 'Kaydediliyor…' : 'Ödemeyi Kaydet'}</Button>
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
  onSubmit: (body: UpdateVekaletTaksitPayload) => void
}): ReactElement {
  const { taksit, onClose, loading, error, onSubmit } = props
  const row = resolveTaksitRow(taksit)
  const odenen = Number(row.odenenToplam)
  const tamOdendi = taksit.odemeDurumu === 'ODENDI'
  const [vade, setVade] = useState(isoDateToInput(taksit.vadeTarihi))
  const [tutar, setTutar] = useState(String(taksit.tutar))
  const [aciklama, setAciklama] = useState(taksit.aciklama ?? '')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const amt = Number(String(tutar).replace(',', '.'))
    if (!Number.isFinite(amt) || amt <= 0) {
      setLocalErr('Geçerli pozitif tutar girin.')
      return
    }
    if (amt < odenen - 0.0001) {
      setLocalErr('Taksit tutarı ödenen tutardan küçük olamaz.')
      return
    }
    if (tamOdendi && Math.abs(amt - Number(taksit.tutar)) > 0.0001) {
      setLocalErr('Tam ödenmiş taksitte tutar değiştirilemez.')
      return
    }
    onSubmit({
      vadeTarihi: `${vade}T00:00:00.000Z`,
      tutar: tamOdendi ? undefined : amt,
      aciklama: aciklama.trim() || null
    })
  }

  return (
    <ModalShell title={`Taksit düzenle — #${taksit.taksitNo}`} onClose={onClose} wide>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        {odenen > 0 ? (
          <p className="text-xs text-ink-muted">Ödenen: <strong className="tabular-nums">{formatCurrencyTR(odenen)}</strong></p>
        ) : null}
        <Input label="Vade tarihi" type="date" value={vade} onChange={(e) => setVade(e.target.value)} />
        <Input label="Taksit tutarı" value={tutar} onChange={(e) => setTutar(e.target.value)} inputMode="decimal" disabled={tamOdendi} />
        <Input label="Açıklama" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Vazgeç</Button>
          <Button type="button" onClick={submit} disabled={loading}>{loading ? 'Kaydediliyor…' : 'Kaydet'}</Button>
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
  const [tutar, setTutar] = useState(resolved.kalanTutar)
  const [odemeTarihi, setOdemeTarihi] = useState(todayInputDate())
  const [odeme, setOdeme] = useState<OdemeYontemiApi>('NAKIT')
  const [aciklama, setAciklama] = useState('')
  const [tahsilatiYapanPersonelId, setTahsilatiYapanPersonelId] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    if (!tahsilatiYapanPersonelId) {
      setLocalErr('Tahsilatı yapan personel seçin.')
      return
    }
    const trimmed = tutar.trim()
    if (!trimmed) {
      setLocalErr('Tutar boş olamaz.')
      return
    }
    const n = Number(trimmed.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('Tutar 0\'dan büyük olmalıdır.')
      return
    }
    if (n > kalanNum + 0.0001) {
      setLocalErr('Tutar taksit kalanını aşamaz.')
      return
    }
    onSubmit({
      tutar: n,
      odemeTarihi: `${odemeTarihi}T12:00:00.000Z`,
      odemeYontemi: odeme,
      aciklama: aciklama.trim() || null,
      tahsilatiYapanPersonelId: tahsilatiYapanPersonelId || null
    })
  }

  return (
    <ModalShell title="Taksit ödemesi al" onClose={onClose} wide>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <p className="text-xs text-ink-muted">
          Taksit #{taksit.taksitNo} · Kalan: <strong className="tabular-nums">{formatCurrencyTR(kalanNum)}</strong>
        </p>
        <Input label="Tutar" value={tutar} onChange={(e) => setTutar(e.target.value)} inputMode="decimal" />
        <Input label="Tarih" type="date" value={odemeTarihi} onChange={(e) => setOdemeTarihi(e.target.value)} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
          <select className={selectClassName()} value={odeme} onChange={(e) => setOdeme(e.target.value as OdemeYontemiApi)}>
            {ODEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <TahsilatiYapanPersonelSelect value={tahsilatiYapanPersonelId} onChange={setTahsilatiYapanPersonelId} />
        <Input label="Açıklama / not" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Vazgeç</Button>
          <Button type="button" onClick={submit} disabled={loading}>{loading ? 'Kaydediliyor…' : 'Ödemeyi Kaydet'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

function VekaletOdemeGecmisiModal(props: {
  taksit: VekaletTaksitiDto
  onClose: () => void
}): ReactElement {
  const { taksit, onClose } = props
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
          <p className="text-sm text-ink-muted">Bu taksit için ödeme kaydı yok.</p>
        ) : null}
        {q.data && q.data.items.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <THead>
                <TR>
                  <TH>Tarih</TH>
                  <TH className="text-right">Tutar</TH>
                  <TH>Ödeme yöntemi</TH>
                  <TH>Açıklama</TH>
                  <TH>SMM durumu</TH>
                  <TH>Ofis kasası</TH>
                </TR>
              </THead>
              <TBody>
                {q.data.items.map((o: VekaletTaksitOdemeDto) => (
                  <TR key={o.id}>
                    <TD className="whitespace-nowrap">{formatDateTR(o.odemeTarihi)}</TD>
                    <TD className="text-right tabular-nums">{formatCurrencyTR(Number(o.tutar))}</TD>
                    <TD>{odemeLabel(o.odemeYontemi)}</TD>
                    <TD className="max-w-[160px] truncate">{o.aciklama?.trim() ? o.aciklama : '—'}</TD>
                    <TD>
                      {o.smmKesildiMi ? (
                        <Badge variant="success" className="!normal-case">SMM kesildi</Badge>
                      ) : (
                        <Badge variant="danger" className="animate-pulse !normal-case bg-rose-100 text-rose-800">SMM bekliyor</Badge>
                      )}
                    </TD>
                    <TD className="text-xs text-ink-muted">
                      {o.ofisKasaHareketId ? 'Ofis kasasına yazıldı' : o.kasaHareketId ? 'Eski dosya kasası kaydı' : '—'}
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
  const [tahsilatiYapanPersonelId, setTahsilatiYapanPersonelId] = useState('')
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
      aciklama: aciklama.trim() || null,
      tahsilatiYapanPersonelId: tahsilatiYapanPersonelId || null
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
        <TahsilatiYapanPersonelSelect value={tahsilatiYapanPersonelId} onChange={setTahsilatiYapanPersonelId} />
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

function ModalShell(props: { title: string; onClose: () => void; wide?: boolean; children: ReactNode }): ReactElement {
  const { title, onClose, wide, children } = props
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'max-h-[90vh] w-full overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated',
          wide ? 'max-w-xl' : 'max-w-md'
        )}
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
