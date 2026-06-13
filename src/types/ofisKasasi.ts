/** Backend `OfisKasaIslemTipi` ile uyumlu */
export type OfisKasaIslemTipiApi = 'GELIR' | 'GIDER' | 'DUZELTME'

/** Backend `OfisKasaOnayDurumu` */
export type OfisKasaOnayDurumuApi = 'ONAYSIZ' | 'ONAYLI' | 'REDDEDILDI'

/** Backend `OfisKasaOdemeYontemi` */
export type OfisKasaOdemeYontemiApi = 'NAKIT' | 'BANKA' | 'KREDI_KARTI' | 'DIGER'

export const OFIS_KASA_GELIR_KATEGORILERI = [
  'Vekalet ücreti dışı gelir',
  'Danışmanlık geliri',
  'İade alınan ödeme',
  'Diğer gelir'
] as const

export const OFIS_KASA_GIDER_KATEGORILERI = [
  'Ofis kirası',
  'Personel maaşı',
  'SGK ödemesi',
  'Vergi ödemesi',
  'Stopaj',
  'Muhasebe ücreti',
  'Elektrik',
  'Su',
  'İnternet / telefon',
  'Kırtasiye',
  'Ulaşım',
  'Yemek',
  'Temizlik',
  'Demirbaş',
  'Yazılım / abonelik',
  'Banka masrafı',
  'Diğer gider'
] as const

export type OfisKasaHareketiDto = {
  id: string
  tenantId: string
  islemTipi: OfisKasaIslemTipiApi
  tarih: string
  kategori: string
  ozelKategoriAdi: string | null
  aciklama: string | null
  tutar: string
  odemeYontemi: OfisKasaOdemeYontemiApi
  belgeNo: string
  onayDurumu: OfisKasaOnayDurumuApi
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

export type OfisKasaOzetDto = {
  toplamGelir: string
  toplamGider: string
  toplamDuzeltme: string
  kasaBakiyesi: string
  onaysizIslemSayisi: number
  buAyGelir: string
  buAyGider: string
}

export type OfisKasaHareketleriListResponse = {
  ok: true
  items: OfisKasaHareketiDto[]
  total: number
  page: number
  limit: number
}

export type OfisKasaOzetResponse = {
  ok: true
  ozet: OfisKasaOzetDto
}

export type OfisKasaHareketOneResponse = {
  ok: true
  ofisKasaHareketi: OfisKasaHareketiDto
}

export type ListOfisKasaHareketleriParams = {
  q?: string
  islemTipi?: OfisKasaIslemTipiApi
  onayDurumu?: OfisKasaOnayDurumuApi
  kategori?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export type CreateOfisKasaHareketiPayload = {
  islemTipi: 'GELIR' | 'GIDER'
  tarih: string
  kategori: string
  ozelKategoriAdi?: string | null
  aciklama?: string | null
  tutar: number
  odemeYontemi: OfisKasaOdemeYontemiApi
}

export type CreateOfisKasaDuzeltmePayload = {
  tarih: string
  tutar: number
  aciklama: string
  odemeYontemi: OfisKasaOdemeYontemiApi
}
