/** Masraf türleri — backend `MASRAF_TURU_VALUES` ile aynı sırada tutulmalıdır. */
export const MASRAF_TURU_OPTIONS = [
  'Gider avansı',
  'Keşif harcı',
  'Keşif avansı',
  'Mahkeme harcı',
  'Peşin harç',
  'Karar harcı',
  'İstinaf harcı',
  'Temyiz harcı',
  'Ofis içi kırtasiye',
  'Yol masrafı',
  'Yemek masrafı',
  'Baro pulu',
  'Vekalet harcı',
  'İhtarname masrafı',
  'Bilirkişi ücreti',
  'Diğer masraf'
] as const

export type MasrafTuruOption = (typeof MASRAF_TURU_OPTIONS)[number]

export type KasaHareketTipiApi = 'AVANS_GIRISI' | 'MASRAF' | 'DUZELTME' | 'VEKALET_TAHSILAT'

export type KasaOnayDurumuApi = 'ONAYSIZ' | 'ONAYLI' | 'REDDEDILDI'

/** Eski kayıtlar için; yeni dosya kasası girişlerinde genelde null. */
export type OdemeYontemiApi = 'NAKIT' | 'BANKA' | 'KREDI_KARTI' | 'DIGER'

export type KasaHareketiDto = {
  id: string
  tenantId: string
  dosyaId: string
  muvekkilId: string
  tip: KasaHareketTipiApi
  tarih: string
  masrafTuru: string | null
  ozelMasrafAdi: string | null
  aciklama: string | null
  tutar: string
  odemeYontemi: OdemeYontemiApi | null
  masrafiYapanKisi: string | null
  belgeNo: string
  onayDurumu: KasaOnayDurumuApi
  onaylayanId: string | null
  onayTarihi: string | null
  redSebebi: string | null
  orijinalHareketId: string | null
  orijinalBelgeNo: string | null
  otomatikOnayMi: boolean
  createdById: string
  updatedById: string | null
  createdAt: string
  updatedAt: string
}

export type KasaHareketleriListResponse = {
  ok: true
  items: KasaHareketiDto[]
  total: number
  page: number
  limit: number
}

export type KasaHareketOneResponse = {
  ok: true
  kasaHareketi: KasaHareketiDto
}

export type KasaOzetDto = {
  toplamAvans: string
  toplamMasraf: string
  toplamDuzeltme: string
  bakiye: string
  onaysizIslemSayisi: number
}

export type KasaOzetResponse = {
  ok: true
  ozet: KasaOzetDto
}

export type CreateKasaHareketiPayload = {
  tip: 'AVANS_GIRISI' | 'MASRAF'
  tarih: string
  tutar: number
  aciklama?: string | null
  masrafTuru?: string | null
  ozelMasrafAdi?: string | null
  /** Yalnızca MASRAF; zorunlu. */
  masrafiYapanKisi?: string | null
  /** İsteğe bağlı; eski formlar için. */
  odemeYontemi?: OdemeYontemiApi | null
}

export type CreateDuzeltmePayload = {
  tarih: string
  tutar: number
  aciklama: string
}
