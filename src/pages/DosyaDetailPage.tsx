import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useMemo, useState, useCallback } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  approveKasaHareketi,
  createDuzeltme,
  createKasaHareketi,
  deleteKasaHareketi,
  getKasaOzet,
  guvenliMasrafSil,
  listKasaHareketleri,
  rejectKasaHareketi
} from '../api/kasa'
import { invalidateSmmBekleyen } from '../api/smm'
import { invalidateFinancialQueries } from '../lib/financialQueryInvalidation'
import { getDosya } from '../api/dosyalar'
import { getDosyaHesapOzeti } from '../api/hesapOzeti'
import { getDosyaMakbuzlari } from '../api/makbuzlar'
import {
  createTekVekaletTaksiti,
  createVekaletPesinOdeme,
  createVekaletTaksitOdeme,
  createVekaletTaksitPlani,
  getDosyaVekalet,
  getVekaletOdemeMakbuz,
  guvenliSilVekaletTahsilat,
  guvenliSilVekaletTaksiti,
  listVekaletTaksitOdemeler,
  markOdemeSmmKesildi,
  updateVekaletTaksiti,
  updateVekaletTaksitOdeme,
  upsertDosyaVekalet
} from '../api/vekalet'
import { TahsilatiYapanPersonelSelect } from '../components/prim/TahsilatiYapanPersonelSelect'
import {
  MobileActionBar,
  MobileRecordCard,
  ResponsiveDataView
} from '../components/responsive'
import { VekaletTaksitOdemeModal } from '../components/vekalet/VekaletTaksitOdemeModal'
import { VekaletTaksitPlaniModal } from '../components/vekalet/VekaletTaksitPlaniModal'
import {
  buildVekaletUpsertModalPropsFromDosya,
  VekaletUpsertModal
} from '../components/vekalet/VekaletUpsertModal'
import { TaksitHatirlatmaPlanModal } from '../components/vekalet/TaksitHatirlatmaPlanModal'
import { VekaletSatirGuvenliSilFlow } from '../components/vekalet/VekaletSatirGuvenliSilFlow'
import { MasrafGuvenliSilModal } from '../components/kasa/MasrafGuvenliSilModal'
import { DosyaKasaHareketIslemCell } from '../components/kasa/DosyaKasaHareketIslemCell'
import {
  canShowDosyaKasaDuzeltme,
  canShowDosyaKasaGuvenliSil,
  resolveDosyaKasaGuvenliSilMode
} from '../lib/dosyaKasaGuvenliSil'
import {
  BUGUNKU_TL_KUR_HINT,
  BugunkuTlKarsilikCell
} from '../components/kurlar/BugunkuTlKarsilikCell'
import { useYaklasikTryBatch, yaklasikByKey } from '../hooks/useYaklasikTryBatch'
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
  MoneyInput,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  tableActionButtonShrinkClass,
  tableActionColWideClass,
  tableActionsFlexRow,
  useConfirm,
  DraggablePanel
} from '../components/ui'
import { useToast } from '../toast'
import { cn } from '../lib/cn'
import { resolveSmmBekleyenOdemeId, resolveTaksitRow } from '../lib/vekaletTaksitOzet'
import { buildCrossPaymentPayload } from '../lib/crossCurrencyPayment'
import { resolveVekaletUpsertOpenIntent } from '../lib/vekaletParaBirimi'
import { CrossCurrencyPaymentFields } from '../components/paraBirimi/CrossCurrencyPaymentFields'
import type { CrossPaymentKurMeta } from '../types/kurlar'
import {
  formatCurrencyTR,
  formatDateTR,
  formatCurrencyInputTR,
  formatMoney,
  moneyInputFromAmount,
  parseCurrencyInputTR,
  parsePosTutar,
  resolveParaBirimi,
  type ParaBirimi
} from '../utils/formatters'
import { finansKalemleriQueryKey, listFinansKalemleri } from '../api/finansKalemleri'
import { isDigerGiderKalemAd } from '../types/finansKalemi'
import {
  type KasaHareketiDto,
  type OdemeYontemiApi
} from '../types/kasa'
import type {
  CreateVekaletPesinOdemePayload,
  CreateVekaletTaksitOdemePayload,
  CreateVekaletTaksitPlaniPayload,
  CreateTekVekaletTaksitiPayload,
  TaksitComputedDurumApi,
  TaksitSmmDurumApi,
  UpdateVekaletTaksitOdemePayload,
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
import { DosyaMaliOzetTab } from '../components/mali/DosyaMaliOzetTab'
import { MuvekkilEkstreTab } from '../components/ekstre/MuvekkilEkstreTab'
import { useDosyaDetailDeepLink } from '../hooks/useDosyaDetailDeepLink'
import { dosyaFocusElementId, DOSYA_FOCUS_HIGHLIGHT_CLASS } from '../lib/maliKontrolNavigation'
import { useMotionSettings } from '../motion/MotionProvider'
import type { VekaletMakbuzListeDto } from '../types/makbuz'

type ReceiptModalState =
  | null
  | { kind: 'advance'; hareket: KasaHareketiDto; printRootId: string; printedAt: string }
  | { kind: 'vekalet'; taksit: VekaletTaksitiDto; printRootId: string; printedAt: string }
  | { kind: 'vekalet-odeme'; makbuz: VekaletOdemeMakbuzDto; printRootId: string; printedAt: string }
  | { kind: 'hesap'; printRootId: string; printedAt: string }

type TabKey = 'kasa' | 'vekalet' | 'smm' | 'makbuz' | 'hesap' | 'mali' | 'ekstre'

type KasaListeFiltre = 'tum' | 'avans' | 'masraf' | 'onaysiz' | 'onayli' | 'reddedildi'

type VekModalState =
  | null
  | {
      type: 'vekalet-upsert'
      openKey: number
      mode: 'create' | 'initialize' | 'edit'
      persistedVekaletUcretiId: string | null
    }
  | { type: 'tek-taksit' }
  | { type: 'taksit-plani' }
  | { type: 'pesin-odeme' }
  | { type: 'taksit-edit'; t: VekaletTaksitiDto }
  | { type: 'taksit-odeme'; t: VekaletTaksitiDto }
  | { type: 'odeme-gecmisi'; t: VekaletTaksitiDto }
  | { type: 'odeme-edit'; t: VekaletTaksitiDto; odeme: VekaletTaksitOdemeDto }
  | { type: 'hatirlatma'; t: VekaletTaksitiDto }
  | { type: 'satir-guvenli-sil'; t: VekaletTaksitiDto; odemeId?: string }

const vekaletIconBtnClass =
  'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-white text-sm hover:bg-surface-muted disabled:opacity-50'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'kasa', label: 'Kasa Hareketleri' },
  { key: 'vekalet', label: 'Anlaşılan vekalet ücreti ve taksitler' },
  { key: 'smm', label: 'SMM Takibi' },
  { key: 'makbuz', label: 'Makbuzlar' },
  { key: 'mali', label: 'Mali Özet' },
  { key: 'hesap', label: 'Hesap Özeti' },
  { key: 'ekstre', label: 'Müvekkil Ekstresi' }
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

function smmMakbuzListeCell(t: VekaletMakbuzListeDto): ReactElement {
  if (t.smmKesildiMi) {
    const label = t.smmNo?.trim() || 'Evet'
    return (
      <Badge variant="success" className="!normal-case !px-1.5 !py-0 text-[10px] font-semibold">
        {label}
      </Badge>
    )
  }
  return <span className="text-[11px] text-ink-subtle">Hayır</span>
}

const MAKBUZ_ACTION_BTN_CLASS = 'h-8 shrink-0 px-2.5 text-[11px] font-medium'

function MakbuzPanelShell(props: { title: string; count: number; children: ReactNode }): ReactElement {
  const { title, count, children } = props
  return (
    <section className="flex h-full min-h-[180px] flex-col rounded-lg border border-border bg-panel shadow-sm">
      <div className="flex min-h-11 shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
        <h3 className="text-[13px] font-semibold text-ink">{title}</h3>
        <span className="shrink-0 text-xs tabular-nums text-ink-muted">{count} kayıt</span>
      </div>
      <div className="flex flex-1 flex-col px-5 py-4">{children}</div>
    </section>
  )
}

function MakbuzActionButtons(props: { onView: () => void | Promise<void>; onPrint: () => void | Promise<void> }): ReactElement {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={MAKBUZ_ACTION_BTN_CLASS}
        onClick={() => {
          void props.onView()
        }}
      >
        Görüntüle
      </Button>
      <Button
        type="button"
        size="sm"
        className={MAKBUZ_ACTION_BTN_CLASS}
        onClick={() => {
          void props.onPrint()
        }}
      >
        Yazdır
      </Button>
    </div>
  )
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

function VekaletOzetRow(props: {
  anlasilan: string
  odenenToplam: string
  kalanVekalet: string
  paraBirimi: ParaBirimi
  yaklasik?: {
    anlasilan: string | null
    odenen: string | null
    kalan: string | null
    kurBilgiSatiri: string | null
    unavailable: boolean
  } | null
}): ReactElement {
  const { anlasilan, odenenToplam, kalanVekalet, paraBirimi, yaklasik } = props
  const showYaklasik = paraBirimi !== 'TRY'
  return (
    <div className="space-y-2">
      <div className="min-w-0 max-w-full">
        <Table>
          <THead>
            <TR>
              <TH>Anlaşılan ({paraBirimi})</TH>
              <TH className="text-right">Ödenen toplam</TH>
              <TH className="text-right">Kalan vekalet</TH>
            </TR>
          </THead>
          <TBody>
            <TR>
              <TD className="align-top font-semibold tabular-nums">
                <div>{formatMoney(Number(anlasilan), paraBirimi)}</div>
                {showYaklasik ? (
                  <div className="mt-1">
                    <BugunkuTlKarsilikCell
                      align="left"
                      unavailable={yaklasik?.unavailable}
                      value={
                        yaklasik?.unavailable
                          ? null
                          : yaklasik?.anlasilan
                            ? `≈ ${yaklasik.anlasilan}`
                            : null
                      }
                    />
      </div>
                ) : null}
              </TD>
              <TD className="align-top text-right font-semibold tabular-nums">
                <div>{formatMoney(Number(odenenToplam), paraBirimi)}</div>
                {showYaklasik ? (
                  <div className="mt-1 flex justify-end">
                    <BugunkuTlKarsilikCell
                      unavailable={yaklasik?.unavailable}
                      value={
                        yaklasik?.unavailable
                          ? null
                          : yaklasik?.odenen
                            ? `≈ ${yaklasik.odenen}`
                            : null
                      }
                    />
      </div>
                ) : null}
              </TD>
              <TD className="align-top text-right font-semibold tabular-nums">
                <div>{formatMoney(Number(kalanVekalet), paraBirimi)}</div>
                {showYaklasik ? (
                  <div className="mt-1 flex justify-end">
                    <BugunkuTlKarsilikCell
                      unavailable={yaklasik?.unavailable}
                      value={
                        yaklasik?.unavailable
                          ? null
                          : yaklasik?.kalan
                            ? `≈ ${yaklasik.kalan}`
                            : null
                      }
                    />
                  </div>
                ) : null}
              </TD>
            </TR>
          </TBody>
        </Table>
      </div>
      {showYaklasik && yaklasik?.kurBilgiSatiri ? (
        <p className="text-xs text-ink-muted" title={BUGUNKU_TL_KUR_HINT}>
          {yaklasik.kurBilgiSatiri} · {BUGUNKU_TL_KUR_HINT}
        </p>
      ) : null}
      {showYaklasik && yaklasik?.unavailable ? (
        <p className="text-xs text-amber-800">TL karşılığı şu anda hesaplanamadı</p>
      ) : null}
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
  const toast = useToast()
  const { confirm } = useConfirm()
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
    | { type: 'masraf-sil'; hareket: KasaHareketiDto }
  >(null)

  const [vekModal, setVekModal] = useState<VekModalState>(null)
  const [receiptModal, setReceiptModal] = useState<ReceiptModalState>(null)
  const [kasaSearch, setKasaSearch] = useState('')
  const [kasaFilter, setKasaFilter] = useState<KasaListeFiltre>('tum')
  const [smmNotice, setSmmNotice] = useState<{ variant: 'success' | 'danger'; text: string } | null>(null)

  const role = session?.user.role
  const canYoneticiIslem = role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI'
  const canKasaGuvenliSil = role === 'BURO_SAHIBI'
  const canYeniKasa = canYoneticiIslem || role === 'KATIP_PERSONEL'
  const canVekaletDuzenle = canYoneticiIslem
  const canSatirGuvenliSil = role === 'BURO_SAHIBI'
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

  const { reducedMotion } = useMotionSettings()
  const handleFocusNotFound = useCallback(() => {
    toast.warning('İlgili kayıt bulunamadı veya artık erişilebilir değil.')
  }, [toast])

  const { isRowHighlighted } = useDosyaDetailDeepLink({
    setTab,
    setKasaFilter,
    kasaFilter,
    tabReady: {
      kasa: kasaListQuery.isSuccess && !kasaListQuery.isFetching,
      vekalet: vekaletQuery.isSuccess && !vekaletQuery.isFetching,
      smm: vekaletQuery.isSuccess && !vekaletQuery.isFetching,
      makbuz: makbuzQuery.isSuccess && hesapOzetiQuery.isSuccess && !makbuzQuery.isFetching,
      mali: true,
      hesap: hesapOzetiQuery.isSuccess && !hesapOzetiQuery.isFetching,
      ekstre: true
    },
    onFocusNotFound: handleFocusNotFound,
    reducedMotion
  })

  const invalidateKasa = (): void => {
    invalidateFinancialQueries(queryClient, {
      dosyaId,
      muvekkilId: muvekkilIdFromUrl,
      ofisKasa: true,
      vekalet: false,
      kasa: true,
      karlilik: true,
      dashboard: true,
      maliKontrol: true
    })
  }

  const approveMu = useMutation({
    mutationFn: (id: string) => approveKasaHareketi(id),
    onSuccess: () => {
      invalidateKasa()
      toast.success('Kayıt onaylandı.')
    }
  })
  const rejectMu = useMutation({
    mutationFn: ({ id, redSebebi }: { id: string; redSebebi: string }) => rejectKasaHareketi(id, redSebebi),
    onSuccess: () => {
      invalidateKasa()
      setModal(null)
      toast.warning('Kayıt reddedildi.')
    }
  })
  const deleteMu = useMutation({
    mutationFn: (id: string) => deleteKasaHareketi(id),
    onSuccess: () => {
      invalidateKasa()
      toast.success('Kayıt silindi.')
    }
  })
  const masrafGuvenliSilMu = useMutation({
    mutationFn: ({
      id,
      sifre,
      deleteReason
    }: {
      id: string
      sifre: string
      deleteReason: string
    }) => guvenliMasrafSil(id, { sifre, deleteReason }),
    onSuccess: (res) => {
      invalidateKasa()
      setModal(null)
      toast.success(res.message || 'Kayıt silindi ve denetim kaydı oluşturuldu')
    }
  })
  const createMu = useMutation({
    mutationFn: (payload: Parameters<typeof createKasaHareketi>[1]) => createKasaHareketi(dosyaId!, payload),
    onSuccess: () => {
      invalidateKasa()
      setModal(null)
      toast.success('Kasa hareketi kaydedildi.')
    }
  })
  const duzeltmeMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof createDuzeltme>[1] }) =>
      createDuzeltme(id, body),
    onSuccess: () => {
      invalidateKasa()
      setModal(null)
      toast.success('Düzeltme talebi oluşturuldu.')
    }
  })

  const invalidateVekalet = (): void => {
    invalidateFinancialQueries(queryClient, {
      dosyaId,
      muvekkilId: muvekkilIdFromUrl,
      ofisKasa: true,
      vekalet: true,
      kasa: true,
      karlilik: true,
      dashboard: true,
      maliKontrol: true
    })
    void queryClient.invalidateQueries({ queryKey: ['muvekkil-ekstre', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['prim'] })
    void queryClient.invalidateQueries({ queryKey: ['dosya', dosyaId] })
  }

  const satirGuvenliSilMu = useMutation({
    mutationFn: async (args: {
      kind: 'taksit' | 'tahsilat'
      id: string
      sifre: string
      deleteReason: string
    }) => {
      if (args.kind === 'taksit') {
        return guvenliSilVekaletTaksiti(args.id, {
          sifre: args.sifre,
          deleteReason: args.deleteReason
        })
      }
      return guvenliSilVekaletTahsilat(args.id, {
        sifre: args.sifre,
        deleteReason: args.deleteReason
      })
    },
    onSuccess: () => {
      invalidateVekalet()
      void queryClient.invalidateQueries({ queryKey: ['taksit-odemeler'] })
      setVekModal(null)
      toast.success('Silindi.')
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Silinemedi.')
    }
  })

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
      toast.success('Peşin ödeme kaydedildi.')
    },
    onError: () => {
      toast.error('Peşin ödeme kaydedilemedi.')
    }
  })
  const updateTaksitMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateVekaletTaksitPayload }) => updateVekaletTaksiti(id, body),
    onSuccess: () => {
      invalidateVekalet()
      setVekModal(null)
      toast.success('Taksit başarıyla güncellendi.')
    }
  })
  const odemeTaksitMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateVekaletTaksitOdemePayload }) =>
      createVekaletTaksitOdeme(id, body),
    onSuccess: () => {
      invalidateVekalet()
      invalidateSmmBekleyen(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['taksit-odemeler'] })
      setVekModal(null)
      toast.success('Tahsilat kaydedildi.')
    },
    onError: () => {
      toast.error('Tahsilat kaydedilemedi.')
    }
  })
  const updateOdemeMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateVekaletTaksitOdemePayload }) =>
      updateVekaletTaksitOdeme(id, body),
    onSuccess: () => {
      invalidateVekalet()
      invalidateSmmBekleyen(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['taksit-odemeler'] })
      setVekModal((prev) => (prev?.type === 'odeme-edit' ? { type: 'odeme-gecmisi', t: prev.t } : null))
      toast.success('Tahsilat güncellendi.')
    },
    onError: (err) => {
      toast.error(resolveOdemeApiError(err) ?? 'Tahsilat güncellenemedi.')
    }
  })
  const smmOdemeMu = useMutation({
    mutationFn: (odemeId: string) => markOdemeSmmKesildi(odemeId),
    onSuccess: () => {
      invalidateVekalet()
      invalidateSmmBekleyen(queryClient)
      void queryClient.invalidateQueries({ queryKey: ['taksit-odemeler'] })
      setSmmNotice({ variant: 'success', text: 'SMM kesildi olarak işaretlendi.' })
      toast.success('SMM kesildi olarak işaretlendi.')
    },
    onError: () => {
      setSmmNotice({ variant: 'danger', text: 'SMM durumu güncellenemedi.' })
      toast.error('SMM durumu güncellenemedi.')
    }
  })
  // deleteTaksit / hard-delete odeme kaldırıldı — satirGuvenliSilMu

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

  const vekaletPb = resolveParaBirimi(vekaletData?.vekaletUcreti?.paraBirimi)

  const yaklasikItems = useMemo(() => {
    if (!vekaletData || (vekaletPb !== 'USD' && vekaletPb !== 'EUR')) return []
    const items: Array<{ key: string; tutar: string | number }> = [
      { key: 'ozet.anlasilan', tutar: vekaletData.ozet.anlasilan },
      { key: 'ozet.odenen', tutar: vekaletData.ozet.odenenToplam },
      { key: 'ozet.kalan', tutar: vekaletData.ozet.kalanVekalet }
    ]
    for (const t of vekaletData.taksitler) {
      if (t.odemeDurumu === 'IPTAL') continue
      const row = resolveTaksitRow(t)
      items.push({ key: `taksit.${t.id}.tutar`, tutar: row.taksitTutari })
      items.push({ key: `taksit.${t.id}.kalan`, tutar: row.kalanTutar })
    }
    return items
  }, [vekaletData, vekaletPb])

  const yaklasikQ = useYaklasikTryBatch(vekaletPb, yaklasikItems, Boolean(vekaletData))
  const yaklasikOzet =
    vekaletPb === 'TRY'
      ? null
      : {
          anlasilan: yaklasikByKey(yaklasikQ.data, 'ozet.anlasilan').gosterim,
          odenen: yaklasikByKey(yaklasikQ.data, 'ozet.odenen').gosterim,
          kalan: yaklasikByKey(yaklasikQ.data, 'ozet.kalan').gosterim,
          kurBilgiSatiri: yaklasikQ.data?.kurBilgiSatiri ?? null,
          unavailable: Boolean(
            !yaklasikQ.isLoading &&
              (yaklasikQ.isError || (yaklasikQ.isFetched && yaklasikQ.data && !yaklasikQ.data.available))
          )
        }

  const showFxTlCols = vekaletPb === 'USD' || vekaletPb === 'EUR'
  const showKalanTlCol =
    showFxTlCols &&
    Boolean(
      vekaletData?.taksitler.some((t) => {
        if (t.odemeDurumu === 'IPTAL') return false
        const row = resolveTaksitRow(t)
        return Number(row.odenenToplam) > 0 && Number(row.kalanTutar) > 0
      })
    )

  // Masaüstüyle aynı: açık taksit olsa bile kalan tutar > 0 ise yeni taksit / plan eklenebilir.
  const taksitPlaniYapilabilir = kalanTaksitlendirme > 0.0001
  const tekTaksitYapilabilir = kalanTaksitlendirme > 0.0001 && kalanVekaletNum > 0.0001

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
      {modal?.type === 'masraf-sil' ? (
        <MasrafGuvenliSilModal
          ozet={{
            id: modal.hareket.id,
            tarih: modal.hareket.tarih,
            aciklama:
              [modal.hareket.masrafTuru, modal.hareket.ozelMasrafAdi, modal.hareket.aciklama]
                .filter((x) => x?.trim())
                .join(' · ') || '—',
            tutar: modal.hareket.tutar,
            odemeYontemiLabel: odemeLabel(modal.hareket.odemeYontemi),
            belgeNo: modal.hareket.belgeNo,
            mode: resolveDosyaKasaGuvenliSilMode(modal.hareket.tip) ?? 'MASRAF_SIL'
          }}
          onClose={() => setModal(null)}
          loading={masrafGuvenliSilMu.isPending}
          error={masrafGuvenliSilMu.error instanceof Error ? masrafGuvenliSilMu.error.message : null}
          onSubmit={(payload) =>
            masrafGuvenliSilMu.mutate({ id: modal.hareket.id, ...payload })
          }
        />
      ) : null}

      {vekModal?.type === 'satir-guvenli-sil' ? (
        <VekaletSatirGuvenliSilFlow
          taksit={vekModal.t}
          odenenToplamFixed2={resolveTaksitRow(vekModal.t).odenenToplam}
          preselectedOdemeId={vekModal.odemeId}
          loading={satirGuvenliSilMu.isPending}
          error={
            satirGuvenliSilMu.error instanceof Error ? satirGuvenliSilMu.error.message : null
          }
          onClose={() => setVekModal(null)}
          onSilTaksit={(payload) =>
            satirGuvenliSilMu.mutate({ kind: 'taksit', id: vekModal.t.id, ...payload })
          }
          onSilTahsilat={(odemeId, payload) =>
            satirGuvenliSilMu.mutate({ kind: 'tahsilat', id: odemeId, ...payload })
          }
        />
      ) : null}

      {vekModal?.type === 'vekalet-upsert' ? (
        <VekaletUpsertModal
          key={`vekalet-upsert-${vekModal.mode}-${vekModal.persistedVekaletUcretiId ?? 'new'}-${vekModal.openKey}`}
          {...buildVekaletUpsertModalPropsFromDosya({
            mode: vekModal.mode,
            persistedVekaletUcretiId: vekModal.persistedVekaletUcretiId,
            vekaletUcreti:
              vekModal.mode === 'edit' ? vekaletData?.vekaletUcreti ?? null : null,
            hasTahsilat: Number(vekaletData?.ozet.odenenToplam ?? 0) > 0,
            loading: upsertVekMu.isPending,
            error: upsertVekMu.error instanceof Error ? upsertVekMu.error.message : null,
            onClose: () => setVekModal(null),
            onSubmit: (body) => upsertVekMu.mutate(body)
          })}
        />
      ) : null}
      {vekModal?.type === 'tek-taksit' ? (
        <VekaletTekTaksitModal
          kalanTaksitlendirme={kalanTaksitlendirme}
          kalanVekalet={kalanVekaletNum}
          alacakParaBirimi={vekaletPb}
          onClose={() => setVekModal(null)}
          loading={createTekTaksitMu.isPending}
          error={createTekTaksitMu.error instanceof Error ? createTekTaksitMu.error.message : null}
          onSubmit={(body) => createTekTaksitMu.mutate(body)}
        />
      ) : null}
      {vekModal?.type === 'taksit-plani' ? (
        <VekaletTaksitPlaniModal
          kalanTaksitlendirme={kalanTaksitlendirme}
          paraBirimi={vekaletPb}
          onClose={() => setVekModal(null)}
          loading={createTaksitPlaniMu.isPending}
          error={createTaksitPlaniMu.error instanceof Error ? createTaksitPlaniMu.error.message : null}
          onSubmit={(body) => createTaksitPlaniMu.mutate(body)}
        />
      ) : null}
      {vekModal?.type === 'pesin-odeme' && vekaletData ? (
        <VekaletPesinOdemeModal
          kalanVekalet={vekaletData.ozet.kalanVekalet}
          alacakParaBirimi={resolveParaBirimi(vekaletData.vekaletUcreti?.paraBirimi)}
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
          dosyaId={dosyaId}
          onClose={() => {
            odemeTaksitMu.reset()
            setVekModal(null)
          }}
          loading={odemeTaksitMu.isPending}
          error={resolveOdemeApiError(odemeTaksitMu.error)}
          onSubmit={(body) => odemeTaksitMu.mutate({ id: vekModal.t.id, body })}
          onStaleSummary={() => {
            void queryClient.invalidateQueries({ queryKey: ['vekalet', dosyaId] })
          }}
        />
      ) : null}
      {vekModal?.type === 'hatirlatma' ? (
        <TaksitHatirlatmaPlanModal
          taksitId={vekModal.t.id}
          taksitNo={vekModal.t.taksitNo}
          onClose={() => setVekModal(null)}
          onSaved={() => void queryClient.invalidateQueries({ queryKey: ['vekalet', dosyaId] })}
        />
      ) : null}
      {vekModal?.type === 'odeme-gecmisi' ? (
        <VekaletOdemeGecmisiModal
          taksit={vekModal.t}
          canEdit={canTaksitOdendi}
          canGuvenliSil={canSatirGuvenliSil}
          deletingId={
            satirGuvenliSilMu.isPending && satirGuvenliSilMu.variables?.kind === 'tahsilat'
              ? satirGuvenliSilMu.variables.id
              : null
          }
          onClose={() => setVekModal(null)}
          onEdit={(odeme) => {
            updateOdemeMu.reset()
            setVekModal({ type: 'odeme-edit', t: vekModal.t, odeme })
          }}
          onDelete={(odeme) => {
            setVekModal({ type: 'satir-guvenli-sil', t: vekModal.t, odemeId: odeme.id })
          }}
          onMakbuz={async (odeme) => {
            const res = await getVekaletOdemeMakbuz(odeme.id)
            setReceiptModal({
              kind: 'vekalet-odeme',
              makbuz: res.makbuz,
              printRootId: `vek-odeme-${odeme.id}-${Date.now()}`,
              printedAt: new Date().toISOString()
            })
          }}
        />
      ) : null}
      {vekModal?.type === 'odeme-edit' ? (
        <VekaletOdemeEditModal
          key={vekModal.odeme.id}
          taksit={vekModal.t}
          odeme={vekModal.odeme}
          onClose={() => setVekModal({ type: 'odeme-gecmisi', t: vekModal.t })}
          loading={updateOdemeMu.isPending}
          error={resolveOdemeApiError(updateOdemeMu.error)}
          onSubmit={(body) => updateOdemeMu.mutate({ id: vekModal.odeme.id, body })}
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
            ayrıdır. Vekalet, taksit ve SMM bilgileri güncel veriler üzerinden gösterilir.
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
                  <li>
                    Onaylı kayıtlar doğrudan değiştirilemez. Hatalar düzeltme kaydıyla düzeltilir; kayıt
                    silme işlemi yalnız Büro Sahibi tarafından şifre doğrulamasıyla yapılabilir.
                  </li>
                  <li>Hata düzeltmesi yalnızca yeni &quot;Düzeltme&quot; kaydı ile açılır; onay sonrası bakiyeye yansır.</li>
                  <li>
                    Onaysız kayıtların onay/red ve sert silme işlemleri büro sahibi / avukat yöneticisi
                    tarafından yapılır; onaylı avans ve masraf güvenli silme yalnız büro sahibine aittir.
                  </li>
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

                  <ResponsiveDataView
                    isEmpty={kasaItems.length === 0}
                    empty={<p className="py-6 text-center text-[11px] text-ink-muted">Henüz kasa hareketi yok.</p>}
                    table={
                      <div className="min-w-0 max-w-full">
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
                            {kasaItems.map((h) => {
                            const isDuz = h.tip === 'DUZELTME'
                            const onaysiz = h.onayDurumu === 'ONAYSIZ'
                            const onayli = h.onayDurumu === 'ONAYLI'
                            const reddedildi = h.onayDurumu === 'REDDEDILDI'
                              const kasaRowId = dosyaFocusElementId('kasa', h.id)
                            return (
                              <TR
                                key={h.id}
                                  id={kasaRowId}
                                className={cn(
                                  isDuz && 'border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-950/20',
                                    onaysiz && !isDuz && 'bg-warning-soft/30',
                                    isRowHighlighted(kasaRowId) && DOSYA_FOCUS_HIGHLIGHT_CLASS
                                )}
                              >
                                <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(h.tarih)}</TD>
                                <TD className="font-mono text-xs tabular-nums text-ink">{h.belgeNo}</TD>
                                <TD>
                                  <div className="flex flex-wrap items-center gap-1">
                                      <span className="font-medium">{tipLabel(h.tip)}</span>
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
                                  <TD className="max-w-[220px] text-ink-muted">{aciklamaCell(h)}</TD>
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
                                      'text-right font-semibold tabular-nums',
                                    signedDisplayAmount(h) < 0 ? 'text-danger' : 'text-ink'
                                  )}
                                >
                                  {formatCurrencyTR(signedDisplayAmount(h))}
                                </TD>
                                  <TD className={cn(tableActionColWideClass, 'align-middle')}>
                                    <DosyaKasaHareketIslemCell
                                      hareket={h}
                                      role={role}
                                      yonetici={canYoneticiIslem}
                                      approvePending={approveMu.isPending}
                                      deletePending={deleteMu.isPending}
                                      guvenliSilPending={masrafGuvenliSilMu.isPending}
                                      onApprove={() => approveMu.mutate(h.id)}
                                      onReject={() => setModal({ type: 'reject', hareket: h })}
                                      onHardDelete={() => {
                                        void confirm({
                                          title: 'Kayıt silinsin mi?',
                                          message: 'Bu onaysız kaydı silmek istediğinize emin misiniz?',
                                          confirmLabel: 'Sil',
                                          danger: true
                                        }).then((ok) => {
                                          if (ok) deleteMu.mutate(h.id)
                                        })
                                      }}
                                      onDuzeltme={() => setModal({ type: 'duzeltme', hareket: h })}
                                      onGuvenliSil={() => setModal({ type: 'masraf-sil', hareket: h })}
                                    />
                                </TD>
                              </TR>
                            )
                            })}
                      </TBody>
                    </Table>
                  </div>
                    }
                    cards={
                      <>
                        {kasaItems.map((h) => {
                          const isDuz = h.tip === 'DUZELTME'
                          const onaysiz = h.onayDurumu === 'ONAYSIZ'
                          const onayli = h.onayDurumu === 'ONAYLI'
                          const reddedildi = h.onayDurumu === 'REDDEDILDI'
                          const signed = signedDisplayAmount(h)
                          const kasaRowId = dosyaFocusElementId('kasa', h.id)
                          const actions = []
                          if (onaysiz && canYoneticiIslem) {
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
                                onClick: () => setModal({ type: 'reject', hareket: h })
                              }
                            )
                            if (h.tip !== 'MASRAF') {
                              actions.push({
                                key: 'sil',
                                label: 'Sil',
                                danger: true,
                                disabled: deleteMu.isPending,
                                onClick: () => {
                                  void confirm({
                                    title: 'Kayıt silinsin mi?',
                                    message: 'Bu onaysız kaydı silmek istediğinize emin misiniz?',
                                    confirmLabel: 'Sil',
                                    danger: true
                                  }).then((ok) => {
                                    if (ok) deleteMu.mutate(h.id)
                                  })
                                }
                              })
                            } else if (canKasaGuvenliSil) {
                              actions.push({
                                key: 'guvenli-sil',
                                label: 'Sil',
                                danger: true,
                                disabled: masrafGuvenliSilMu.isPending,
                                onClick: () => setModal({ type: 'masraf-sil', hareket: h })
                              })
                            }
                          }
                          if (canShowDosyaKasaDuzeltme({ onayDurumu: h.onayDurumu, tip: h.tip })) {
                            actions.push({
                              key: 'duzelt',
                              label: 'Düzeltme ekle',
                              primary: true,
                              variant: 'outline' as const,
                              onClick: () => setModal({ type: 'duzeltme', hareket: h })
                            })
                          }
                          if (
                            !onaysiz &&
                            canShowDosyaKasaGuvenliSil({
                              role,
                              tip: h.tip,
                              deletedAt: h.deletedAt
                            })
                          ) {
                            actions.push({
                              key: 'guvenli-sil',
                              label: 'Sil',
                              danger: true,
                              disabled: masrafGuvenliSilMu.isPending,
                              onClick: () => setModal({ type: 'masraf-sil', hareket: h })
                            })
                          }
                          return (
                            <MobileRecordCard
                              key={h.id}
                              className={cn(isRowHighlighted(kasaRowId) && DOSYA_FOCUS_HIGHLIGHT_CLASS)}
                              title={h.belgeNo}
                              subtitle={aciklamaCell(h)}
                              badge={
                                <Badge
                                  variant={
                                    onayli ? 'success' : reddedildi ? 'danger' : onaysiz ? 'warning' : 'default'
                                  }
                                  className="!normal-case"
                                >
                                  {onayLabel(h.onayDurumu)}
                                </Badge>
                              }
                              fields={[
                                { label: 'Tarih', value: formatDateTR(h.tarih) },
                                {
                                  label: 'Tutar',
                                  value: (
                                    <span className={signed < 0 ? 'text-danger' : undefined}>
                                      {formatCurrencyTR(signed)}
                                    </span>
                                  ),
                                  numeric: true
                                },
                                {
                                  label: 'Tip',
                                  value: isDuz ? `${tipLabel(h.tip)} (Düzeltme)` : tipLabel(h.tip)
                                },
                                { label: 'Ödeme', value: odemeLabel(h.odemeYontemi) }
                              ]}
                              footer={
                                reddedildi && h.redSebebi?.trim() ? (
                                  <span className="text-danger">{h.redSebebi}</span>
                                ) : onayli || reddedildi ? (
                                  'Düzenleme kapalı'
                                ) : null
                              }
                              actions={actions.length > 0 ? <MobileActionBar items={actions} /> : null}
                            />
                          )
                        })}
                      </>
                    }
                  />
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
                    paraBirimi={resolveParaBirimi(vekaletData.vekaletUcreti?.paraBirimi)}
                    yaklasik={yaklasikOzet}
                  />
                  {taksitToplamUyumsuz ? (
                    <p className="text-xs text-warning">Taksit toplamı anlaşılan vekalet tutarıyla eşleşmiyor.</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {canVekaletDuzenle ? (
                      (() => {
                        const intent = resolveVekaletUpsertOpenIntent({
                          vekaletUcreti: vekaletData.vekaletUcreti,
                          odenenToplam: vekaletData.ozet.odenenToplam,
                          taksitler: vekaletData.taksitler
                        })
                        return (
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (intent.mode === 'inconsistent') {
                            toast.error(intent.message)
                            return
                          }
                          setVekModal({
                            type: 'vekalet-upsert',
                            openKey: Date.now(),
                            mode: intent.mode,
                            persistedVekaletUcretiId: intent.persistedVekaletUcretiId
                          })
                        }}
                      >
                        {intent.mode === 'edit'
                          ? 'Vekalet ücretini düzenle'
                          : 'Vekalet ücreti ekle'}
                      </Button>
                        )
                      })()
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
                          kalanTaksitlendirme <= 0
                            ? 'Taksitlendirilebilir kalan tutar yok.'
                            : kalanVekaletNum <= 0
                              ? 'Kalan vekalet tutarı yok.'
                              : undefined
                        }
                        onClick={() => {
                          if (kalanTaksitlendirme <= 0) {
                            toast.warning('Taksitlendirilebilir kalan tutar yok.')
                            return
                          }
                          if (kalanVekaletNum <= 0) {
                            toast.warning('Kalan vekalet tutarı yok.')
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
                          kalanTaksitlendirme <= 0 ? 'Taksitlendirilebilir kalan tutar yok.' : undefined
                        }
                        onClick={() => {
                          if (kalanTaksitlendirme <= 0) {
                            toast.warning('Taksitlendirilebilir kalan tutar yok.')
                            return
                          }
                          setVekModal({ type: 'taksit-plani' })
                        }}
                      >
                        Taksit planı
                      </Button>
                    ) : null}
                    {(() => {
                      const intent = resolveVekaletUpsertOpenIntent({
                        vekaletUcreti: vekaletData.vekaletUcreti,
                        odenenToplam: vekaletData.ozet.odenenToplam,
                        taksitler: vekaletData.taksitler
                      })
                      if (intent.mode === 'create') {
                        return (
                      <p className="text-xs text-ink-muted">
                        {canVekaletDuzenle
                              ? 'Henüz vekalet ücreti tanımlanmadı. «Vekalet ücreti ekle» ile başlayabilirsiniz.'
                          : 'Vekalet ücreti tanımlanmadı. Taksit eklemek için önce yönetici tanımlamalıdır.'}
                      </p>
                        )
                      }
                      if (intent.mode === 'initialize') {
                        return (
                          <p className="text-xs text-ink-muted">
                            Henüz gerçek bir vekalet ücreti tanımlanmadı. «Vekalet ücreti ekle» ile ilk tutarı
                            girebilirsiniz.
                          </p>
                        )
                      }
                      if (intent.mode === 'inconsistent') {
                        return <p className="text-xs text-danger">{intent.message}</p>
                      }
                      return null
                    })()}
                    </div>
                  <ResponsiveDataView
                    isEmpty={vekaletData.taksitler.length === 0}
                    empty={<p className="py-6 text-center text-[11px] text-ink-muted">Taksit kaydı yok.</p>}
                    table={
                      <div className="min-w-0 max-w-full text-xs">
                        {showFxTlCols ? (
                          <p
                            className="border-b border-border bg-surface-muted/40 px-3 py-2 text-[11px] text-ink"
                            title={BUGUNKU_TL_KUR_HINT}
                          >
                            <span className="font-semibold">Bugünkü TL karşılığı:</span>{' '}
                            {BUGUNKU_TL_KUR_HINT}
                            {yaklasikQ.data?.kurBilgiSatiri
                              ? ` · ${yaklasikQ.data.kurBilgiSatiri}`
                              : null}
                          </p>
                  ) : null}
                    <Table>
                      <THead>
                        <TR>
                              <TH className="!py-2">Taksit no</TH>
                              <TH className="!py-2">Vade tarihi</TH>
                              <TH className="!py-2 text-right">Taksit tutarı</TH>
                              {showFxTlCols ? (
                                <TH
                                  className="!py-2 text-right"
                                  title={BUGUNKU_TL_KUR_HINT}
                                >
                                  Bugünkü TL karşılığı
                                </TH>
                              ) : null}
                              <TH className="!py-2 text-right">Ödenen</TH>
                              <TH className="!py-2 text-right">Kalan</TH>
                              {showKalanTlCol ? (
                                <TH
                                  className="!py-2 text-right"
                                  title={BUGUNKU_TL_KUR_HINT}
                                >
                                  Kalan TL karşılığı
                                </TH>
                              ) : null}
                              <TH className="!py-2">Durum</TH>
                              <TH className="!py-2">Son ödeme</TH>
                              <TH className="!py-2">Makbuz son</TH>
                              <TH className="!py-2">SMM</TH>
                              <TH className="!py-2 text-right">İşlem</TH>
                        </TR>
                      </THead>
                      <TBody>
                            {vekaletData.taksitler.map((t) => {
                              const row = resolveTaksitRow(t)
                              const taksitPb = resolveParaBirimi(t.paraBirimi)
                            const iptal = t.odemeDurumu === 'IPTAL'
                              const odenebilir = !iptal && Number(row.kalanTutar) > 0
                              const taksitRowId = dosyaFocusElementId('taksit', t.id)
                              const tlTutar = yaklasikByKey(
                                yaklasikQ.data,
                                `taksit.${t.id}.tutar`
                              )
                              const tlKalan = yaklasikByKey(
                                yaklasikQ.data,
                                `taksit.${t.id}.kalan`
                              )
                            return (
                                <TR
                                  key={t.id}
                                  id={taksitRowId}
                                  className={cn(
                                    iptal && 'opacity-60',
                                    isRowHighlighted(taksitRowId) && DOSYA_FOCUS_HIGHLIGHT_CLASS
                                  )}
                                >
                                  <TD className="tabular-nums font-medium !py-1.5">{t.taksitNo}</TD>
                                  <TD className="whitespace-nowrap text-ink-muted !py-1.5">{formatDateTR(t.vadeTarihi)}</TD>
                                  <TD className="text-right font-semibold tabular-nums !py-1.5">
                                    {formatMoney(Number(row.taksitTutari), taksitPb)}
                                </TD>
                                  {showFxTlCols ? (
                                    <TD className="text-right !py-1.5">
                                      <BugunkuTlKarsilikCell
                                        unavailable={yaklasikOzet?.unavailable}
                                        value={tlTutar.gosterim}
                                      />
                                    </TD>
                                      ) : null}
                                  <TD className="text-right tabular-nums !py-1.5">{formatMoney(Number(row.odenenToplam), taksitPb)}</TD>
                                  <TD className="text-right font-semibold tabular-nums !py-1.5">
                                    {formatMoney(Number(row.kalanTutar), taksitPb)}
                                  </TD>
                                  {showKalanTlCol ? (
                                    <TD className="text-right !py-1.5">
                                      <BugunkuTlKarsilikCell
                                        unavailable={yaklasikOzet?.unavailable}
                                        value={tlKalan.gosterim}
                                      />
                                    </TD>
                                  ) : null}
                                  <TD className="!py-1.5">
                                    <Badge variant={taksitDurumBadge(row.durum)} className="!normal-case">
                                      {taksitDurumLabel(row.durum)}
                                      </Badge>
                                    {t.hatirlatmaOzet ? (
                                      <p className="mt-0.5 text-[10px] text-ink-muted">{t.hatirlatmaOzet}</p>
                                    ) : null}
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
                                        title="Hatırlatma planı"
                                        onClick={() => setVekModal({ type: 'hatirlatma', t })}
                                      >
                                        🔔
                                      </button>
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
                                      {canSatirGuvenliSil && !iptal ? (
                                        <button
                                          type="button"
                                          className={cn(
                                            'inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-border bg-white px-2 text-[11px] font-semibold text-danger hover:bg-surface-muted disabled:opacity-50',
                                            tableActionButtonShrinkClass
                                          )}
                                          title="Sil"
                                          data-testid="vekalet-taksit-sil-btn"
                                          disabled={satirGuvenliSilMu.isPending}
                                          onClick={() => setVekModal({ type: 'satir-guvenli-sil', t })}
                                        >
                                          Sil
                                        </button>
                                    ) : null}
                                  </div>
                                </TD>
                              </TR>
                            )
                            })}
                      </TBody>
                    </Table>
                  </div>
                    }
                    cards={
                      <>
                        {vekaletData.taksitler.map((t) => {
                          const row = resolveTaksitRow(t)
                          const iptal = t.odemeDurumu === 'IPTAL'
                          const odenebilir = !iptal && Number(row.kalanTutar) > 0
                          const taksitRowId = dosyaFocusElementId('taksit', t.id)
                          const actions = []
                          if (odenebilir && canTaksitOdendi) {
                            actions.push({
                              key: 'odeme',
                              label: 'Ödeme al',
                              primary: true,
                              disabled: odemeTaksitMu.isPending,
                              onClick: () => {
                                odemeTaksitMu.reset()
                                setVekModal({ type: 'taksit-odeme', t })
                              }
                            })
                          }
                          actions.push(
                            {
                              key: 'hatirlat',
                              label: 'Hatırlatma',
                              primary: true,
                              variant: 'outline' as const,
                              onClick: () => setVekModal({ type: 'hatirlatma', t })
                            },
                            {
                              key: 'gecmis',
                              label: 'Ödeme geçmişi',
                              variant: 'outline' as const,
                              onClick: () => setVekModal({ type: 'odeme-gecmisi', t })
                            }
                          )
                          if (row.smmDurumu === 'BEKLIYOR' && canSmmIsaretle) {
                            actions.push({
                              key: 'smm',
                              label: 'SMM kesildi',
                              variant: 'outline' as const,
                              disabled: smmOdemeMu.isPending,
                              onClick: () => {
                                const odemeId = resolveSmmBekleyenOdemeId(t, vekaletData?.smmBekleyen ?? [])
                                if (odemeId) smmOdemeMu.mutate(odemeId)
                              }
                            })
                          }
                          if (Number(row.odenenToplam) > 0) {
                            actions.push({
                              key: 'makbuz',
                              label: 'Makbuz',
                              variant: 'outline' as const,
                              onClick: () => {
                                void (async () => {
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
                                })()
                              }
                            })
                          }
                          if (!iptal) {
                            actions.push({
                              key: 'edit',
                              label: 'Düzenle',
                              variant: 'outline' as const,
                              disabled: updateTaksitMu.isPending,
                              onClick: () => setVekModal({ type: 'taksit-edit', t })
                            })
                          }
                          if (canSatirGuvenliSil && !iptal) {
                            actions.push({
                              key: 'sil',
                              label: 'Sil',
                              danger: true,
                              disabled: satirGuvenliSilMu.isPending,
                              onClick: () => setVekModal({ type: 'satir-guvenli-sil', t })
                            })
                          }
                          return (
                            <MobileRecordCard
                              key={t.id}
                              className={cn(
                                iptal && 'opacity-60',
                                isRowHighlighted(taksitRowId) && DOSYA_FOCUS_HIGHLIGHT_CLASS
                              )}
                              title={`Taksit #${t.taksitNo}`}
                              subtitle={t.hatirlatmaOzet ?? undefined}
                              badge={
                                <Badge variant={taksitDurumBadge(row.durum)} className="!normal-case">
                                  {taksitDurumLabel(row.durum)}
                                </Badge>
                              }
                              fields={[
                                { label: 'Vade', value: formatDateTR(t.vadeTarihi) },
                                { label: 'SMM', value: smmDurumRozet(row.smmDurumu) },
                                {
                                  label: 'Tutar',
                                  value: formatMoney(Number(row.taksitTutari), resolveParaBirimi(t.paraBirimi)),
                                  numeric: true
                                },
                                ...(showFxTlCols
                                  ? [
                                      {
                                        label: 'Bugünkü TL karşılığı',
                                        value: yaklasikOzet?.unavailable
                                          ? 'Hesaplanamadı'
                                          : yaklasikByKey(yaklasikQ.data, `taksit.${t.id}.tutar`)
                                              .gosterim ?? '—',
                                        numeric: true
                                      }
                                    ]
                                  : []),
                                {
                                  label: 'Ödenen',
                                  value: formatMoney(Number(row.odenenToplam), resolveParaBirimi(t.paraBirimi)),
                                  numeric: true
                                },
                                {
                                  label: 'Kalan',
                                  value: formatMoney(Number(row.kalanTutar), resolveParaBirimi(t.paraBirimi)),
                                  numeric: true
                                },
                                ...(showKalanTlCol &&
                                Number(row.odenenToplam) > 0 &&
                                Number(row.kalanTutar) > 0
                                  ? [
                                      {
                                        label: 'Kalan TL karşılığı',
                                        value: yaklasikOzet?.unavailable
                                          ? 'Hesaplanamadı'
                                          : yaklasikByKey(yaklasikQ.data, `taksit.${t.id}.kalan`)
                                              .gosterim ?? '—',
                                        numeric: true
                                      }
                                    ]
                                  : []),
                                {
                                  label: 'Son ödeme',
                                  value: formatDateTR(row.sonOdemeTarihi ?? undefined)
                                },
                                {
                                  label: 'Makbuz',
                                  value: row.sonMakbuzNo?.trim() ? row.sonMakbuzNo : '—',
                                  full: true
                                }
                              ]}
                              actions={<MobileActionBar items={actions} />}
                            />
                          )
                        })}
                      </>
                    }
                  />
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
                <ResponsiveDataView
                  table={
                    <div className="min-w-0 max-w-full">
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
                            const odemeRowId = dosyaFocusElementId('odeme', r.id)
                            return (
                              <TR
                                key={r.id}
                                id={odemeRowId}
                                className={cn(isRowHighlighted(odemeRowId) && DOSYA_FOCUS_HIGHLIGHT_CLASS)}
                              >
                                <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(r.odemeTarihi)}</TD>
                                <TD className="text-right font-medium tabular-nums">{formatMoney(Number(r.tutar ?? 0), vekaletPb)}</TD>
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
                  }
                  cards={
                    <>
                      {vekaletData.smmBekleyen.map((row) => {
                        const r = row as { id: string; odemeTarihi?: string; tutar?: string; makbuzNo?: string }
                        const odemeRowId = dosyaFocusElementId('odeme', r.id)
                        return (
                          <MobileRecordCard
                            key={r.id}
                            className={cn(isRowHighlighted(odemeRowId) && DOSYA_FOCUS_HIGHLIGHT_CLASS)}
                            title={r.makbuzNo ?? 'Makbuz yok'}
                            badge={
                              <Badge variant="danger" className="animate-pulse !normal-case bg-rose-100 text-rose-800">
                                SMM bekliyor
                              </Badge>
                            }
                            fields={[
                              { label: 'Tahsilat tarihi', value: formatDateTR(r.odemeTarihi) },
                              {
                                label: 'Tutar',
                                value: formatMoney(Number(r.tutar ?? 0), vekaletPb),
                                numeric: true
                              }
                            ]}
                            actions={
                              canSmmIsaretle ? (
                                <MobileActionBar
                                  items={[
                                    {
                                      key: 'smm',
                                      label: 'SMM kesildi',
                                      primary: true,
                                      disabled: smmOdemeMu.isPending,
                                      onClick: () => smmOdemeMu.mutate(r.id)
                                    }
                                  ]}
                                />
                              ) : (
                                <span className="text-[11px] text-ink-muted">Yetki yok</span>
                              )
                            }
                          />
                        )
                      })}
                    </>
                  }
                />
              ) : (
                <EmptyState
                  title="SMM bekleyen yok"
                  description="Bu dosyada ödenmiş fakat SMM kesilmemiş vekalet taksiti bulunmuyor."
                />
              )}
            </div>
          ) : null}

          {tab === 'makbuz' ? (
            <div className="w-full">
              {hesapOzetiError ? <AlertBox variant="danger" title="Hesap özeti">{hesapOzetiError}</AlertBox> : null}
              {makbuzError ? <AlertBox variant="danger" title="Makbuzlar">{makbuzError}</AlertBox> : null}
              {makbuzQuery.isLoading || hesapOzetiQuery.isLoading ? (
                <p className="text-sm text-ink-muted">Makbuz listesi yükleniyor…</p>
              ) : makbuzData && hesapData ? (
                <div className="grid w-full grid-cols-1 gap-5 min-[1200px]:grid-cols-2 min-[1200px]:items-stretch">
                  <MakbuzPanelShell title="Avans makbuzları" count={avansMakbuzRows.length}>
                            {avansMakbuzRows.length === 0 ? (
                      <p className="text-xs text-ink-muted">Henüz avans makbuzu yok.</p>
                    ) : (
                      <ul className="divide-y divide-border/70">
                        {avansMakbuzRows.map((row) => (
                          <li key={row.id} className="py-3 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3">
                              <span className="w-[92px] shrink-0 text-[13px] text-ink-muted">{formatDateTR(row.tarih)}</span>
                              <span className="min-w-0 flex-1 truncate font-mono text-[13px] font-medium text-ink">
                                {row.makbuzNo || row.belgeNo}
                              </span>
                              <span className="w-[108px] shrink-0 text-right text-[13px] font-semibold tabular-nums text-ink">
                                {formatCurrencyTR(Number(row.tutar))}
                              </span>
                              <MakbuzActionButtons
                                onView={() => {
                                          const full = hesapData.kasaHareketleri.find((x) => x.id === row.id)
                                          if (!full) return
                                          setReceiptModal({
                                            kind: 'advance',
                                            hareket: full,
                                            printRootId: `adv-rcpt-${row.id}-${Date.now()}`,
                                    printedAt: new Date().toISOString()
                                  })
                                }}
                                onPrint={() => {
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
                              />
                                    </div>
                            {row.aciklama?.trim() ? (
                              <p className="mt-1.5 truncate text-xs text-ink-muted">{row.aciklama.trim()}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </MakbuzPanelShell>

                  <MakbuzPanelShell title="Vekalet makbuzları" count={vekaletMakbuzListe.length}>
                            {vekaletMakbuzListe.length === 0 ? (
                      <p className="text-xs text-ink-muted">Henüz vekalet makbuzu yok.</p>
                    ) : (
                      <ul className="divide-y divide-border/70">
                        {vekaletMakbuzListe.map((row) => {
                          const odemeId = row.odemeId ?? row.id
                          const makbuzRowId = dosyaFocusElementId('odeme', odemeId)
                          return (
                            <li
                              key={row.id}
                              id={makbuzRowId}
                              className={cn(
                                'rounded-md py-3 first:pt-0 last:pb-0',
                                isRowHighlighted(makbuzRowId) && DOSYA_FOCUS_HIGHLIGHT_CLASS
                              )}
                            >
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                                <span className="w-12 shrink-0 text-xs font-semibold tabular-nums text-ink-muted">
                                  #{row.taksitNo}
                                </span>
                                <span className="w-[88px] shrink-0 text-[13px] text-ink-muted">
                                  {formatDateTR(row.odemeTarihi ?? undefined)}
                                </span>
                                <span className="min-w-0 flex-1 truncate font-mono text-[13px] font-medium text-ink">
                                  {row.makbuzNo ?? '—'}
                                </span>
                                <span className="w-[100px] shrink-0 text-right text-[13px] font-semibold tabular-nums text-ink">
                                  {formatMoney(Number(row.tutar), vekaletPb)}
                                </span>
                                <span className="flex w-16 shrink-0 items-center justify-center gap-1">
                                  {smmMakbuzListeCell(row)}
                                </span>
                                <MakbuzActionButtons
                                  onView={async () => {
                                    const res = await getVekaletOdemeMakbuz(odemeId)
                                          setReceiptModal({
                                      kind: 'vekalet-odeme',
                                      makbuz: res.makbuz,
                                      printRootId: `vek-odeme-${odemeId}-${Date.now()}`,
                                      printedAt: new Date().toISOString()
                                    })
                                  }}
                                  onPrint={async () => {
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
                                />
                                    </div>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </MakbuzPanelShell>
                      </div>
              ) : (
                <p className="text-sm text-ink-muted">Makbuz listesi yüklenemedi.</p>
              )}
            </div>
          ) : null}

          {tab === 'mali' ? (
            <DosyaMaliOzetTab dosyaId={dosyaId!} />
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

          {tab === 'ekstre' && dosyaId ? <MuvekkilEkstreTab dosyaId={dosyaId} /> : null}
        </CardBody>
      </Card>
    </div>
  )
}

function VekaletTekTaksitModal(props: {
  kalanTaksitlendirme: number
  kalanVekalet: number
  alacakParaBirimi: ParaBirimi
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: CreateTekVekaletTaksitiPayload) => void
}): ReactElement {
  const { kalanTaksitlendirme, kalanVekalet, alacakParaBirimi, onClose, loading, error, onSubmit } = props
  const varsayilanTutar = Math.min(kalanTaksitlendirme, kalanVekalet)
  const [vade, setVade] = useState(todayInputDate())
  const [tutar, setTutar] = useState(moneyInputFromAmount(varsayilanTutar))
  const [aciklama, setAciklama] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const amt = parsePosTutar(tutar)
    if (amt == null) {
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
          Kalan vekalet: <strong className="tabular-nums">{formatMoney(kalanVekalet, alacakParaBirimi)}</strong>
          {' · '}
          Taksitlendirilebilir: <strong className="tabular-nums">{formatMoney(kalanTaksitlendirme, alacakParaBirimi)}</strong>
        </p>
        <Input label="Vade tarihi" type="date" value={vade} onChange={(e) => setVade(e.target.value)} />
        <MoneyInput
          label={`Taksit tutarı (${alacakParaBirimi})`}
          value={tutar}
          onChange={setTutar}
          maxValue={Math.min(kalanTaksitlendirme, kalanVekalet)}
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

function VekaletPesinOdemeModal(props: {
  kalanVekalet: string
  alacakParaBirimi: ParaBirimi
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: CreateVekaletPesinOdemePayload) => void
}): ReactElement {
  const { kalanVekalet, alacakParaBirimi, onClose, loading, error, onSubmit } = props
  const kalanNum = Number(kalanVekalet)
  const [mahsupTutar, setMahsupTutar] = useState('')
  const [odemeParaBirimi, setOdemeParaBirimi] = useState<ParaBirimi>(alacakParaBirimi)
  const [kasaTutari, setKasaTutari] = useState('')
  const [odemeTarihi, setOdemeTarihi] = useState(todayInputDate())
  const [odeme, setOdeme] = useState<OdemeYontemiApi>('NAKIT')
  const [aciklama, setAciklama] = useState('')
  const [tahsilatiYapanPersonelId, setTahsilatiYapanPersonelId] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)
  const [kurOnay, setKurOnay] = useState(false)
  const [kurMeta, setKurMeta] = useState<CrossPaymentKurMeta>({
    kurKaynagi: null,
    tcmbKurTarihi: null,
    tcmbReferansKur: null
  })

  const crossPreview = buildCrossPaymentPayload(
    alacakParaBirimi,
    mahsupTutar,
    odemeParaBirimi,
    kasaTutari,
    kurMeta
  )
  const needsKurOnay = crossPreview.ok && crossPreview.kurOzeti != null

  const submit = (): void => {
    setLocalErr(null)
    if (!crossPreview.ok) {
      setLocalErr(crossPreview.error)
      return
    }
    if (crossPreview.payload.tutar > kalanNum + 0.0001) {
      setLocalErr('Mahsup tutarı kalan vekaleti aşamaz.')
      return
    }
    if (needsKurOnay && !kurOnay) {
      setLocalErr('Çapraz kur önizlemesini onaylayın.')
      return
    }
    onSubmit({
      ...crossPreview.payload,
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
        <div className="rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-xs text-ink-muted">
          <p>
            Kalan vekalet borcu:{' '}
            <strong className="tabular-nums text-ink">{formatMoney(kalanNum, alacakParaBirimi)}</strong>
          </p>
          <p className="mt-1">İstediğiniz tutarda (kısmi veya tam) tahsilat girebilirsiniz.</p>
        </div>
        <CrossCurrencyPaymentFields
          alacakParaBirimi={alacakParaBirimi}
          mahsupTutar={mahsupTutar}
          onMahsupTutarChange={(v) => {
            setMahsupTutar(v)
            setKurOnay(false)
          }}
          odemeParaBirimi={odemeParaBirimi}
          onOdemeParaBirimiChange={(v) => {
            setOdemeParaBirimi(v)
            setKurOnay(false)
          }}
          kasaTutari={kasaTutari}
          onKasaTutariChange={(v) => {
            setKasaTutari(v)
            setKurOnay(false)
          }}
          odemeTarihi={odemeTarihi}
          onKurMetaChange={setKurMeta}
          maxMahsup={kalanNum}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={kalanNum <= 0}
          onClick={() => setMahsupTutar(formatCurrencyInputTR(kalanNum))}
        >
          Kalanın tamamını al
          </Button>
        {needsKurOnay ? (
          <label className="flex items-start gap-2 text-xs text-ink">
            <input type="checkbox" className="mt-0.5" checked={kurOnay} onChange={(e) => setKurOnay(e.target.checked)} />
            <span>
              Uygulanacak kur: <strong>{crossPreview.kurOzeti}</strong>
            </span>
          </label>
        ) : null}
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
  const taksitPb = resolveParaBirimi(taksit.paraBirimi)
  const odenen = Number(row.odenenToplam)
  const tamOdendi = taksit.odemeDurumu === 'ODENDI'
  const [vade, setVade] = useState(isoDateToInput(taksit.vadeTarihi))
  const [tutar, setTutar] = useState(moneyInputFromAmount(taksit.tutar))
  const [aciklama, setAciklama] = useState(taksit.aciklama ?? '')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const amt = parsePosTutar(tutar)
    if (amt == null) {
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
      // Tutar değişmediyse gönderme — yalnız tarih güncellemesinde tutar/ödeme yan etkisi olmasın
      ...(tamOdendi || Math.abs(amt - Number(taksit.tutar)) < 0.0001 ? {} : { tutar: amt }),
      aciklama: aciklama.trim() || null
    })
  }

  return (
    <ModalShell title={`Taksit düzenle — #${taksit.taksitNo}`} onClose={onClose} wide>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        {odenen > 0 ? (
          <p className="text-xs text-ink-muted">Ödenen: <strong className="tabular-nums">{formatMoney(odenen, taksitPb)}</strong></p>
        ) : null}
        <Input label="Vade tarihi" type="date" value={vade} onChange={(e) => setVade(e.target.value)} />
        <MoneyInput label={`Taksit tutarı (${taksitPb})`} value={tutar} onChange={setTutar} disabled={tamOdendi} />
        <Input label="Açıklama" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Vazgeç</Button>
          <Button type="button" onClick={submit} disabled={loading}>{loading ? 'Kaydediliyor…' : 'Kaydet'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

function VekaletOdemeEditModal(props: {
  taksit: VekaletTaksitiDto
  odeme: VekaletTaksitOdemeDto
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: UpdateVekaletTaksitOdemePayload) => void
}): ReactElement {
  const { taksit, odeme, onClose, loading, error, onSubmit } = props
  const resolved = resolveTaksitRow(taksit)
  const alacakParaBirimi = resolveParaBirimi(odeme.alacakParaBirimi ?? taksit.paraBirimi)
  const maxAllowed = Number(resolved.kalanTutar) + Number(odeme.tutar)
  const [mahsupTutar, setMahsupTutar] = useState(moneyInputFromAmount(odeme.tutar))
  const [odemeParaBirimi, setOdemeParaBirimi] = useState<ParaBirimi>(resolveParaBirimi(odeme.odemeParaBirimi))
  const [kasaTutari, setKasaTutari] = useState(moneyInputFromAmount(odeme.kasaTutari ?? odeme.tutar))
  const [odemeTarihi, setOdemeTarihi] = useState(isoDateToInput(odeme.odemeTarihi))
  const [odemeYontemi, setOdemeYontemi] = useState<OdemeYontemiApi>(odeme.odemeYontemi)
  const [aciklama, setAciklama] = useState(odeme.aciklama ?? '')
  const [localErr, setLocalErr] = useState<string | null>(null)
  const [kurOnay, setKurOnay] = useState(false)
  const [kurMeta, setKurMeta] = useState<CrossPaymentKurMeta>({
    kurKaynagi: null,
    tcmbKurTarihi: null,
    tcmbReferansKur: null
  })

  const crossPreview = buildCrossPaymentPayload(
    alacakParaBirimi,
    mahsupTutar,
    odemeParaBirimi,
    kasaTutari,
    kurMeta
  )
  const needsKurOnay = crossPreview.ok && crossPreview.kurOzeti != null

  const submit = (): void => {
    setLocalErr(null)
    if (!crossPreview.ok) {
      setLocalErr(crossPreview.error)
      return
    }
    if (crossPreview.payload.tutar > maxAllowed + 0.0001) {
      setLocalErr('Mahsup tutarı taksit kalanını aşamaz.')
      return
    }
    if (needsKurOnay && !kurOnay) {
      setLocalErr('Çapraz kur önizlemesini onaylayın.')
      return
    }
              onSubmit({
      ...crossPreview.payload,
                odemeTarihi: `${odemeTarihi}T12:00:00.000Z`,
      odemeYontemi,
                aciklama: aciklama.trim() || null
              })
            }

  return (
    <ModalShell title="Tahsilatı düzenle" onClose={onClose} wide>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <p className="text-xs text-ink-muted">
          Taksit #{taksit.taksitNo} · Makbuz: <span className="font-mono">{odeme.makbuzNo}</span>
          <br />
          Bu kayıt için üst sınır:{' '}
          <strong className="tabular-nums">{formatMoney(maxAllowed, alacakParaBirimi)}</strong>
          {' '}(diğer ödemeler düşülmüş kalan + bu tutar)
        </p>
        <CrossCurrencyPaymentFields
          alacakParaBirimi={alacakParaBirimi}
          mahsupTutar={mahsupTutar}
          onMahsupTutarChange={(v) => {
            setMahsupTutar(v)
            setKurOnay(false)
          }}
          odemeParaBirimi={odemeParaBirimi}
          onOdemeParaBirimiChange={(v) => {
            setOdemeParaBirimi(v)
            setKurOnay(false)
          }}
          kasaTutari={kasaTutari}
          onKasaTutariChange={(v) => {
            setKasaTutari(v)
            setKurOnay(false)
          }}
          odemeTarihi={odemeTarihi}
          onKurMetaChange={setKurMeta}
          maxMahsup={maxAllowed}
        />
        {needsKurOnay ? (
          <label className="flex items-start gap-2 text-xs text-ink">
            <input type="checkbox" className="mt-0.5" checked={kurOnay} onChange={(e) => setKurOnay(e.target.checked)} />
            <span>
              Uygulanacak kur: <strong>{crossPreview.kurOzeti}</strong>
            </span>
          </label>
        ) : null}
        <Input label="Tarih" type="date" value={odemeTarihi} onChange={(e) => setOdemeTarihi(e.target.value)} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
          <select
            className={selectClassName()}
            value={odemeYontemi}
            onChange={(e) => setOdemeYontemi(e.target.value as OdemeYontemiApi)}
          >
            {ODEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <Input label="Açıklama / not" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Vazgeç</Button>
          <Button type="button" onClick={submit} disabled={loading}>{loading ? 'Kaydediliyor…' : 'Güncelle'}</Button>
        </div>
      </div>
    </ModalShell>
  )
}

function VekaletOdemeGecmisiModal(props: {
  taksit: VekaletTaksitiDto
  canEdit: boolean
  canGuvenliSil?: boolean
  deletingId: string | null
  onClose: () => void
  onEdit: (odeme: VekaletTaksitOdemeDto) => void
  onDelete: (odeme: VekaletTaksitOdemeDto) => void
  onMakbuz: (odeme: VekaletTaksitOdemeDto) => void | Promise<void>
}): ReactElement {
  const { taksit, canEdit, canGuvenliSil, deletingId, onClose, onEdit, onDelete, onMakbuz } = props
  const resolved = resolveTaksitRow(taksit)
  const taksitPb = resolveParaBirimi(taksit.paraBirimi)
  const q = useQuery({
    queryKey: ['taksit-odemeler', taksit.id],
    queryFn: () => listVekaletTaksitOdemeler(taksit.id)
  })

  return (
    <ModalShell title={`Ödeme geçmişi — taksit #${taksit.taksitNo}`} onClose={onClose} wide>
      <div className="space-y-3">
        <div className="rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-xs text-ink-muted">
          <div className="grid gap-1 sm:grid-cols-3">
            <p>
              Taksit:{' '}
              <strong className="tabular-nums text-ink">{formatMoney(Number(resolved.taksitTutari), taksitPb)}</strong>
            </p>
            <p>
              Ödenen:{' '}
              <strong className="tabular-nums text-ink">{formatMoney(Number(resolved.odenenToplam), taksitPb)}</strong>
            </p>
            <p>
              Kalan:{' '}
              <strong className="tabular-nums text-ink">{formatMoney(Number(resolved.kalanTutar), taksitPb)}</strong>
            </p>
          </div>
          <p className="mt-1">
            Durum:{' '}
            <Badge variant={taksitDurumBadge(resolved.durum)} className="!normal-case">
              {taksitDurumLabel(resolved.durum)}
            </Badge>
          </p>
        </div>
        {q.isLoading ? <p className="text-sm text-ink-muted">Yükleniyor…</p> : null}
        {q.isError ? <AlertBox variant="danger" title="Hata">{(q.error as Error).message}</AlertBox> : null}
        {q.data && q.data.items.length === 0 ? (
          <p className="text-sm text-ink-muted">Bu taksit için ödeme kaydı yok.</p>
        ) : null}
        {q.data && q.data.items.length > 0 ? (
          <div className="min-w-0 max-w-full">
            <Table>
              <THead>
                <TR>
                  <TH>Tarih</TH>
                  <TH className="text-right">Tutar</TH>
                  <TH>Ödeme yöntemi</TH>
                  <TH>Açıklama</TH>
                  <TH>Makbuz</TH>
                  <TH>SMM</TH>
                  <TH>Ofis kasası</TH>
                  <TH className="text-right">İşlem</TH>
                </TR>
              </THead>
              <TBody>
                {q.data.items.map((o: VekaletTaksitOdemeDto) => (
                  <TR key={o.id}>
                    <TD className="whitespace-nowrap">{formatDateTR(o.odemeTarihi)}</TD>
                    <TD className="text-right tabular-nums">
                      <div>{formatMoney(Number(o.tutar), resolveParaBirimi(o.alacakParaBirimi ?? taksitPb))}</div>
                      {o.odemeParaBirimi && o.odemeParaBirimi !== resolveParaBirimi(o.alacakParaBirimi ?? taksitPb) ? (
                        <div className="text-[10px] text-ink-muted">
                          Kasa: {formatMoney(Number(o.kasaTutari), resolveParaBirimi(o.odemeParaBirimi))}
                        </div>
                      ) : null}
                    </TD>
                    <TD>{odemeLabel(o.odemeYontemi)}</TD>
                    <TD className="max-w-[140px] truncate">{o.aciklama?.trim() ? o.aciklama : '—'}</TD>
                    <TD className="font-mono text-[11px]">{o.makbuzNo}</TD>
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
                    <TD>
                      <div className={tableActionsFlexRow}>
                        <button
                          type="button"
                          className={cn(vekaletIconBtnClass, tableActionButtonShrinkClass)}
                          title="Makbuz"
                          onClick={() => void onMakbuz(o)}
                        >
                          🧾
                        </button>
                        {canEdit ? (
                          <button
                            type="button"
                            className={cn(vekaletIconBtnClass, tableActionButtonShrinkClass)}
                            title="Düzenle"
                            onClick={() => onEdit(o)}
                          >
                            ✎
                          </button>
                        ) : null}
                        {canGuvenliSil && !o.iptalAt ? (
                          <button
                            type="button"
                            className={cn(
                              'inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-border bg-white px-2 text-[11px] font-semibold text-danger hover:bg-surface-muted disabled:opacity-50',
                              tableActionButtonShrinkClass
                            )}
                            title="Sil"
                            disabled={deletingId === o.id}
                            onClick={() => onDelete(o)}
                          >
                            Sil
                          </button>
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
  const [tahsilatiYapanPersonelId, setTahsilatiYapanPersonelId] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const n = parsePosTutar(tutar)
    if (n == null) {
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
        <MoneyInput label="Tutar (TL)" value={tutar} onChange={setTutar} />
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
  const { session } = useAuth()
  const oturumAd = session?.user.adSoyad?.trim() || session?.user.kullaniciAdi || ''
  const [tarih, setTarih] = useState(todayInputDate())
  const [kalemId, setKalemId] = useState('')
  const [ozelMasrafAdi, setOzelMasrafAdi] = useState('')
  const [tutar, setTutar] = useState('')
  const [masrafiYapanKisi] = useState(oturumAd)
  const [odeme, setOdeme] = useState<OdemeYontemiApi>('NAKIT')
  const [aciklama, setAciklama] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const giderKalemleriQuery = useQuery({
    queryKey: finansKalemleriQueryKey({ tur: 'GIDER', aktif: 'true' }),
    queryFn: () => listFinansKalemleri({ tur: 'GIDER', aktif: 'true' }),
    staleTime: 60_000
  })

  const kalemList = giderKalemleriQuery.data?.items ?? []
  const effectiveKalemId = kalemId || kalemList[0]?.id || ''
  const selectedKalem = kalemList.find((k) => k.id === effectiveKalemId) ?? null
  const diger = selectedKalem ? isDigerGiderKalemAd(selectedKalem.ad) : false

  const submit = (): void => {
    setLocalErr(null)
    if (!effectiveKalemId) {
      setLocalErr('Masraf kalemi listesi yüklenemedi veya boş.')
      return
    }
    const n = parsePosTutar(tutar)
    if (n == null) {
      setLocalErr('Geçerli pozitif tutar girin.')
      return
    }
    if (diger && ozelMasrafAdi.trim().length < 2) {
      setLocalErr('Diğer masraf adı zorunludur.')
      return
    }
    const myk = masrafiYapanKisi.trim() || oturumAd
    if (myk.length < 2) {
      setLocalErr('Masrafı yapan kişi zorunludur.')
      return
    }
    onSubmit({
      tip: 'MASRAF',
      tarih,
      tutar: n,
      odemeYontemi: odeme,
      kalemId: effectiveKalemId,
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
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Masraf kalemi *</label>
          {giderKalemleriQuery.isError ? (
            <div className="space-y-2">
              <AlertBox variant="danger" title="Kalemler yüklenemedi">
                Liste alınamadı. Bağlantıyı kontrol edip yeniden deneyin.
              </AlertBox>
              <Button type="button" size="sm" variant="outline" onClick={() => void giderKalemleriQuery.refetch()}>
                Yeniden dene
              </Button>
            </div>
          ) : giderKalemleriQuery.isLoading ? (
            <p className="text-xs text-ink-muted">Kalemler yükleniyor…</p>
          ) : kalemList.length === 0 ? (
            <p className="text-xs text-ink-muted">
              Aktif gider kalemi yok. Büro sahibi Ayarlar → Gelir ve Gider Kalemleri’nden ekleyebilir.
            </p>
          ) : (
            <select
              className={selectClassName()}
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
          )}
        </div>
        {diger ? (
          <Input
            label="Diğer masraf adı *"
            value={ozelMasrafAdi}
            onChange={(e) => setOzelMasrafAdi(e.target.value)}
            required
          />
        ) : null}
        <MoneyInput label="Tutar (TL)" value={tutar} onChange={setTutar} />
        <Input
          label="Masrafı yapan kişi"
          value={masrafiYapanKisi || oturumAd}
          readOnly
          disabled
          className="bg-surface-muted text-ink-muted"
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
    const n = parseCurrencyInputTR(tutar)
    if (n == null || n === 0) {
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
        <MoneyInput
          label="Tutar (pozitif veya negatif)"
          value={tutar}
          onChange={setTutar}
          allowNegative
          allowZero={false}
          placeholder="-100,00 veya 100,00"
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
      <DraggablePanel
        role="dialog"
        aria-modal="true"
        className={cn(
          'max-h-[90vh] w-full overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated',
          wide ? 'max-w-xl' : 'max-w-md'
        )}
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
