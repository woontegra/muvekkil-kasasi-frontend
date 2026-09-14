import type { CrossPaymentKurMeta } from '../types/kurlar'
import { parsePosTutar } from '../utils/formatters'
import { formatKurOzeti, resolveParaBirimi, type ParaBirimi } from '../utils/paraBirimi'

export type CrossPaymentFields = {
  odemeParaBirimi?: ParaBirimi | null
  kasaTutari?: number | null
  kurKaynagi?: CrossPaymentKurMeta['kurKaynagi']
  tcmbKurTarihi?: CrossPaymentKurMeta['tcmbKurTarihi']
  tcmbReferansKur?: CrossPaymentKurMeta['tcmbReferansKur']
}

export type CrossPaymentBuildResult =
  | { ok: true; payload: { tutar: number } & CrossPaymentFields; kurOzeti: string | null }
  | { ok: false; error: string }

/** Ödeme kaydı gövdesi — aynı PB'de yalnızca tutar; farklı PB'de kasaTutari zorunlu. */
export function buildCrossPaymentPayload(
  alacakParaBirimi: ParaBirimi,
  mahsupRaw: string,
  odemeParaBirimi: ParaBirimi,
  kasaRaw: string,
  kurMeta?: CrossPaymentKurMeta
): CrossPaymentBuildResult {
  const mahsup = parsePosTutar(mahsupRaw)
  if (mahsup == null) {
    return { ok: false, error: 'Geçerli pozitif mahsup tutarı girin.' }
  }

  if (odemeParaBirimi === alacakParaBirimi) {
    const kasaParsed = kasaRaw.trim() ? parsePosTutar(kasaRaw) : mahsup
    if (kasaParsed != null && Math.abs(kasaParsed - mahsup) > 0.0001) {
      return {
        ok: false,
        error: 'Aynı para biriminde kasaya giren tutar ile mahsup tutarı eşit olmalıdır.'
      }
    }
    return {
      ok: true,
      payload: { tutar: mahsup },
      kurOzeti: null
    }
  }

  const kasa = parsePosTutar(kasaRaw)
  if (kasa == null) {
    return { ok: false, error: 'Farklı para biriminde ödeme için kasaya giren tutar zorunludur.' }
  }

  const kur = kasa / mahsup
  if (!Number.isFinite(kur) || kur <= 0) {
    return { ok: false, error: 'Uygulanan kur geçersiz.' }
  }

  const payload: { tutar: number } & CrossPaymentFields = {
    tutar: mahsup,
    odemeParaBirimi,
    kasaTutari: kasa
  }
  if (kurMeta?.kurKaynagi) payload.kurKaynagi = kurMeta.kurKaynagi
  if (kurMeta?.tcmbKurTarihi) payload.tcmbKurTarihi = kurMeta.tcmbKurTarihi
  if (kurMeta?.tcmbReferansKur) payload.tcmbReferansKur = kurMeta.tcmbReferansKur

  return {
    ok: true,
    payload,
    kurOzeti: formatKurOzeti(alacakParaBirimi, odemeParaBirimi, kur)
  }
}

export function previewCrossPaymentKur(
  alacakParaBirimi: ParaBirimi,
  mahsupRaw: string,
  odemeParaBirimi: ParaBirimi,
  kasaRaw: string
): string | null {
  const alacak = resolveParaBirimi(alacakParaBirimi)
  const odeme = resolveParaBirimi(odemeParaBirimi)
  if (odeme === alacak) return null
  const mahsup = parsePosTutar(mahsupRaw)
  const kasa = parsePosTutar(kasaRaw)
  if (mahsup == null || kasa == null || mahsup <= 0) return null
  const kur = kasa / mahsup
  if (!Number.isFinite(kur) || kur <= 0) return null
  return formatKurOzeti(alacak, odeme, kur)
}

export function previewDovizDonusumKur(
  kaynakParaBirimi: ParaBirimi,
  hedefParaBirimi: ParaBirimi,
  kaynakRaw: string,
  hedefRaw: string
): string | null {
  if (kaynakParaBirimi === hedefParaBirimi) return null
  const kaynak = parsePosTutar(kaynakRaw)
  const hedef = parsePosTutar(hedefRaw)
  if (kaynak == null || hedef == null) return null
  const kur = hedef / kaynak
  if (!Number.isFinite(kur) || kur <= 0) return null
  return formatKurOzeti(kaynakParaBirimi, hedefParaBirimi, kur)
}
