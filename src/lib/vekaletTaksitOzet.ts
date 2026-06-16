import type { TaksitComputedDurumApi, TaksitSmmDurumApi, VekaletTaksitiDto } from '../types/vekalet'

export type ResolvedTaksitRow = {
  taksitTutari: string
  odenenToplam: string
  kalanTutar: string
  durum: TaksitComputedDurumApi
  smmDurumu: TaksitSmmDurumApi
  sonOdemeTarihi: string | null
  sonMakbuzNo: string | null
}

function parseAmount(value: string | undefined | null): number {
  if (value == null || value === '') return NaN
  const n = Number(String(value).replace(',', '.'))
  return Number.isFinite(n) ? n : NaN
}

function formatAmount(n: number): string {
  return n.toFixed(2)
}

function deriveDurum(
  t: VekaletTaksitiDto,
  taksitTutari: number,
  odenenToplam: number,
  kalanTutar: number
): TaksitComputedDurumApi {
  if (t.durum) return t.durum
  if (t.odemeDurumu === 'IPTAL') return 'ODENMEDI'

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const vade = new Date(t.vadeTarihi)
  if (!Number.isNaN(vade.getTime()) && vade < startOfToday && kalanTutar > 0.0001) {
    return 'GECIKTI'
  }
  if (odenenToplam <= 0) return 'ODENMEDI'
  if (odenenToplam + 0.0001 < taksitTutari) return 'KISMI_ODENDI'
  return 'ODENDI'
}

function deriveSmmDurum(t: VekaletTaksitiDto, odenenToplam: number): TaksitSmmDurumApi {
  if (t.smmDurumu) return t.smmDurumu
  if (odenenToplam <= 0) return 'YOK'
  if (t.smmKesildiMi) return 'KESILDI'
  if (t.odemeDurumu === 'ODENDI' || t.odemeDurumu === 'KISMI_ODENDI') return 'BEKLIYOR'
  return 'YOK'
}

/** API'de hesaplanmış alanlar eksikse t.tutar üzerinden türetir (geriye uyumluluk). */
export function resolveTaksitRow(t: VekaletTaksitiDto): ResolvedTaksitRow {
  const taksitTutariNum = parseAmount(t.taksitTutari ?? t.tutar)
  const safeTaksitTutari = Number.isFinite(taksitTutariNum) ? taksitTutariNum : 0

  let odenenToplamNum = parseAmount(t.odenenToplam)
  if (!Number.isFinite(odenenToplamNum)) {
    if (t.odemeDurumu === 'ODENDI') odenenToplamNum = safeTaksitTutari
    else odenenToplamNum = 0
  }

  let kalanTutarNum = parseAmount(t.kalanTutar)
  if (!Number.isFinite(kalanTutarNum)) {
    kalanTutarNum = Math.max(0, safeTaksitTutari - odenenToplamNum)
  }

  const durum = deriveDurum(t, safeTaksitTutari, odenenToplamNum, kalanTutarNum)
  const smmDurumu = deriveSmmDurum(t, odenenToplamNum)

  return {
    taksitTutari: formatAmount(safeTaksitTutari),
    odenenToplam: formatAmount(odenenToplamNum),
    kalanTutar: formatAmount(kalanTutarNum),
    durum,
    smmDurumu,
    sonOdemeTarihi: t.sonOdemeTarihi ?? t.odemeTarihi,
    sonMakbuzNo: t.sonMakbuzNo ?? t.makbuzNo
  }
}

/** Taksit satırından SMM bekleyen ödeme kimliği (en güncel bekleyen). */
export function resolveSmmBekleyenOdemeId(
  t: VekaletTaksitiDto,
  smmBekleyen: Record<string, unknown>[] = []
): string | null {
  if (t.smmBekleyenOdemeId) return t.smmBekleyenOdemeId
  const forTaksit = smmBekleyen.filter((r) => String(r.taksitId ?? '') === t.id)
  if (forTaksit.length === 0) return null
  const row = forTaksit[0] as { id?: string; odemeId?: string }
  const id = row.id ?? row.odemeId
  return id ? String(id) : null
}
