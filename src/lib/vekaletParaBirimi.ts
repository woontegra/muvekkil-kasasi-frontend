import { resolveParaBirimi, type ParaBirimi } from '../utils/paraBirimi'

/** Backend `VEKALET_CURRENCY_CHANGE_FORBIDDEN_MESSAGE` ile aynı metin. */
export const VEKALET_CURRENCY_CHANGE_FORBIDDEN_MESSAGE =
  'Bu vekalet ücretine tahsilat işlendiği için para birimi değiştirilemez. Değiştirmek için önce ilgili tahsilatları iptal etmelisiniz.'

export const VEKALET_PLACEHOLDER_INCONSISTENT_MESSAGE =
  'Bu vekalet kaydı tutarsız görünüyor (tutar 0 ancak tahsilat veya pozitif tutarlı taksit var). Kayıt değiştirilmedi; destek ile iletişime geçin.'

export type VekaletUpsertMode = 'create' | 'initialize' | 'edit'

export type VekaletUpsertOpenIntent = {
  mode: VekaletUpsertMode
  persistedVekaletUcretiId: string | null
  /** create | initialize → kullanıcı “ekle” akışı */
  isFirstTimeSetup: boolean
}

function toAmount(raw: string | number | null | undefined): number {
  if (raw == null || raw === '') return 0
  const n = typeof raw === 'number' ? raw : Number(String(raw).replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function hasMeaningfulPositiveTaksitPlan(
  taksitler:
    | ReadonlyArray<{ tutar?: string | number | null; odemeDurumu?: string | null }>
    | null
    | undefined
): boolean {
  if (!taksitler?.length) return false
  return taksitler.some((t) => {
    if (t.odemeDurumu === 'IPTAL') return false
    return toAmount(t.tutar) > 0
  })
}

/**
 * create = kayıt yok
 * initialize = id var, toplam 0, ödeme yok, anlamlı pozitif taksit yok
 * edit = toplam > 0
 * null = tutarsız (0 tutar + ödeme/pozitif taksit) — açılışta engel
 */
export function resolveVekaletUpsertOpenIntent(input: {
  vekaletUcreti:
    | { id?: string | null; toplamTutar?: string | number | null; paraBirimi?: string | null }
    | null
    | undefined
  odenenToplam?: string | number | null
  taksitler?: ReadonlyArray<{ tutar?: string | number | null; odemeDurumu?: string | null }> | null
}): VekaletUpsertOpenIntent | { mode: 'inconsistent'; message: string } {
  const id = input.vekaletUcreti?.id
  const hasId = typeof id === 'string' && id.length > 0
  if (!hasId) {
    return { mode: 'create', persistedVekaletUcretiId: null, isFirstTimeSetup: true }
  }

  const toplam = toAmount(input.vekaletUcreti?.toplamTutar)
  const odenen = toAmount(input.odenenToplam)
  const meaningfulTaksit = hasMeaningfulPositiveTaksitPlan(input.taksitler)
  const hasTahsilat = odenen > 0

  if (toplam <= 0) {
    if (hasTahsilat || meaningfulTaksit) {
      return { mode: 'inconsistent', message: VEKALET_PLACEHOLDER_INCONSISTENT_MESSAGE }
    }
    return { mode: 'initialize', persistedVekaletUcretiId: id!, isFirstTimeSetup: true }
  }

  return { mode: 'edit', persistedVekaletUcretiId: id!, isFirstTimeSetup: false }
}

/** Kaydet anında onay — yalnızca gerçek edit + PB farkı. */
export function shouldConfirmVekaletParaBirimiDegisimi(input: {
  mode: VekaletUpsertMode
  persistedVekaletUcretiId: string | null
  persistedParaBirimi: ParaBirimi
  selectedParaBirimi: ParaBirimi
}): boolean {
  if (input.mode !== 'edit') return false
  if (!input.persistedVekaletUcretiId) return false
  return input.persistedParaBirimi !== input.selectedParaBirimi
}

function formatTutarKod(tutar: number, pb: ParaBirimi): string {
  const fmt = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(tutar)
  return `${fmt} ${pb}`
}

/** Edit onay — eski değer backend snapshot’ından, yeni değer form draft’ından. */
export function buildVekaletParaBirimiDegisimOnayMesaji(input: {
  eskiTutar: number
  eskiParaBirimi: ParaBirimi
  yeniTutar: number
  yeniParaBirimi: ParaBirimi
}): string {
  return `Eski: ${formatTutarKod(input.eskiTutar, input.eskiParaBirimi)} — Yeni: ${formatTutarKod(input.yeniTutar, input.yeniParaBirimi)}. Otomatik kur dönüşümü yapılmayacaktır.`
}

export type VekaletUpsertFormSeed = {
  paraBirimi: ParaBirimi
  persistedParaBirimi: ParaBirimi
  /** Backend snapshot tutarı (onay metni için) */
  snapshotToplam: number
  toplamTutar: string
  aciklama: string
}

/** create/initialize: boş form + TRY. edit: backend kaydı. */
export function seedVekaletUpsertForm(input: {
  mode: VekaletUpsertMode
  record:
    | {
        paraBirimi?: string | null
        toplamTutar?: string | number | null
        aciklama?: string | null
      }
    | null
    | undefined
}): VekaletUpsertFormSeed {
  if (input.mode === 'create' || input.mode === 'initialize') {
    return {
      paraBirimi: 'TRY',
      persistedParaBirimi: 'TRY',
      snapshotToplam: 0,
      toplamTutar: '',
      aciklama: ''
    }
  }
  const pb = resolveParaBirimi(input.record?.paraBirimi)
  const snapshotToplam = toAmount(input.record?.toplamTutar)
  return {
    paraBirimi: pb,
    persistedParaBirimi: pb,
    snapshotToplam,
    toplamTutar: String(input.record?.toplamTutar ?? snapshotToplam),
    aciklama: input.record?.aciklama ?? ''
  }
}
