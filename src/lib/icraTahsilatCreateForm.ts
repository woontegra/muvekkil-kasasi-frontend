import { parsePosTutar } from '../utils/formatters'
import type {
  CreateIcraTahsilatPayload,
  IcraAlacakTuruApi,
  IcraTahsilatTipiApi
} from '../types/icraTahsilat'
import type { OfisKasaOdemeYontemiApi } from '../types/ofisKasasi'

export type CreateIcraFormInput = {
  alacakTuru: IcraAlacakTuruApi
  borcluAd: string
  muvekkilId: string
  dosyaId: string
  toplamTutarRaw: string
  tahsilatTipi: IcraTahsilatTipiApi
  pesinatTutarRaw: string
  taksitSayisiRaw: string
  ilkVade: string
  tahsilatTarihi: string
  odemeYontemi: OfisKasaOdemeYontemiApi
  /**
   * Yalnızca PrimPersonel.id.
   * Boş / “(ben)” → null gönderilir; auth User.id asla personel FK’ye yazılmaz.
   */
  personelId: string
  /** Oturum kullanıcı id — yalnızca “giriş yapılmış mı” kontrolü için; payload personel alanına konmaz. */
  currentUserId: string | null
  aciklama: string
}

export type CreateIcraFormIssue = {
  field: string
  message: string
}

function dateInputToIso(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`
}

/**
 * Açık PrimPersonel seçimi varsa onu döner.
 * “(ben)” / boş → personelId null (backend authenticated actor’a yazar).
 * Auth User.id personel ID olarak dönülmez.
 */
export function resolveCreateIcraTahsilatci(input: {
  tahsilatTipi: IcraTahsilatTipiApi
  personelId: string
  currentUserId: string | null
}): { personelId: string | null; ok: boolean } {
  const zorunluTip = input.tahsilatTipi === 'PESIN_TAHSIL' || input.tahsilatTipi === 'PESINAT_TAKSIT'
  const personelId = input.personelId.trim() || null
  if (personelId) return { personelId, ok: true }
  // “(ben)”: personel FK null; actor yeterli. Oturum yoksa peşin/peşinat kaydedilemez.
  if (zorunluTip && !input.currentUserId) return { personelId: null, ok: false }
  return { personelId: null, ok: true }
}

export function validateCreateIcraTahsilatForm(input: CreateIcraFormInput): CreateIcraFormIssue[] {
  const issues: CreateIcraFormIssue[] = []
  const tip = input.tahsilatTipi
  const pesin = tip === 'PESIN_TAHSIL'
  const pesinat = tip === 'PESINAT_TAKSIT'

  if (input.borcluAd.trim().length < 2) {
    issues.push({ field: 'borcluAd', message: 'Borçlu / karşı taraf adı en az 2 karakter olmalıdır.' })
  }

  const toplam = parsePosTutar(input.toplamTutarRaw)
  if (toplam == null) {
    issues.push({ field: 'toplamTutar', message: 'Geçerli pozitif toplam alacak tutarı girin.' })
  }

  const tahsilati = resolveCreateIcraTahsilatci(input)
  if ((pesin || pesinat) && !tahsilati.ok) {
    issues.push({ field: 'tahsilatiYapan', message: 'Oturum gerekli; tahsilat kaydedilemedi.' })
  }

  if (pesin || pesinat) {
    if (!input.tahsilatTarihi.trim()) {
      issues.push({ field: 'tahsilatTarihi', message: 'Tahsilat tarihi zorunludur.' })
    }
  }

  if (!pesin) {
    const taksit = Number(input.taksitSayisiRaw)
    if (!Number.isFinite(taksit) || taksit < 1) {
      issues.push({ field: 'taksitSayisi', message: 'Taksit sayısı en az 1 olmalıdır.' })
    }
    if (!input.ilkVade.trim()) {
      issues.push({ field: 'ilkVadeTarihi', message: 'İlk vade tarihi zorunludur.' })
    }
  }

  if (pesinat) {
    const pesinatTutar = parsePosTutar(input.pesinatTutarRaw)
    if (pesinatTutar == null) {
      issues.push({ field: 'pesinatTutar', message: 'Peşinat tutarı zorunludur.' })
    } else if (toplam != null && pesinatTutar > toplam) {
      issues.push({ field: 'pesinatTutar', message: 'Peşinat toplam tutarı aşamaz.' })
    } else if (toplam != null && Math.abs(toplam - pesinatTutar) < 0.001) {
      issues.push({
        field: 'pesinatTutar',
        message: 'Peşinat toplam tutarı karşılıyorsa “Peşin tahsil edildi” seçin.'
      })
    }
  }

  return issues
}

export function buildCreateIcraTahsilatPayload(
  input: CreateIcraFormInput
): { ok: true; payload: CreateIcraTahsilatPayload } | { ok: false; issues: CreateIcraFormIssue[] } {
  const issues = validateCreateIcraTahsilatForm(input)
  if (issues.length > 0) return { ok: false, issues }

  const tip = input.tahsilatTipi
  const pesin = tip === 'PESIN_TAHSIL'
  const pesinat = tip === 'PESINAT_TAKSIT'
  const toplam = parsePosTutar(input.toplamTutarRaw)!
  const tahsilati = resolveCreateIcraTahsilatci(input)

  const payload: CreateIcraTahsilatPayload = {
    alacakTuru: input.alacakTuru,
    borcluAd: input.borcluAd.trim(),
    muvekkilId: input.muvekkilId || null,
    dosyaId: input.dosyaId || null,
    toplamTutar: toplam,
    tahsilatTipi: tip,
    pesinatVar: pesinat,
    pesinatTutar: pesinat ? parsePosTutar(input.pesinatTutarRaw)! : 0,
    taksitSayisi: pesin ? 0 : Number(input.taksitSayisiRaw),
    odemeYontemi: input.odemeYontemi,
    // Yalnızca gerçek PrimPersonel.id; “(ben)” → null. User.id asla burada değil.
    tahsilatiYapanPersonelId: tahsilati.personelId,
    tahsilatiYapanUserId: null,
    aciklama: input.aciklama.trim() || null
  }

  if (!pesin) {
    payload.ilkVadeTarihi = dateInputToIso(input.ilkVade)
  }
  if (pesin || pesinat) {
    payload.tahsilatTarihi = dateInputToIso(input.tahsilatTarihi)
  }

  return { ok: true, payload }
}
