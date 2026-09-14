import type { ParaBirimi } from '../utils/paraBirimi'

/** Backend `OfisKasaIslemTipi` ile uyumlu */
export type OfisKasaIslemTipiApi =
  | 'GELIR'
  | 'GIDER'
  | 'DUZELTME'
  | 'DOVIZ_CIKIS'
  | 'DOVIZ_GIRIS'

/** Backend `OfisKasaOnayDurumu` */
export type OfisKasaOnayDurumuApi = 'ONAYSIZ' | 'ONAYLI' | 'REDDEDILDI'

/** Backend `OfisKasaOdemeYontemi` */
export type OfisKasaOdemeYontemiApi = 'NAKIT' | 'BANKA' | 'KREDI_KARTI' | 'DIGER'

export const OFIS_KASA_GELIR_KATEGORILERI = [
  'Vekalet ücreti dışı gelir',
  'Danışmanlık geliri',
  'İade alınan ödeme',
  'Karşı Taraf Vekalet Ücreti',
  'İcra Vekalet Ücreti',
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

export type OfisKasaMuvekkilSnapshotDto = {
  id: string
  gorunenAd: string | null
  aktifMi: boolean | null
}

export type OfisKasaHareketiDto = {
  id: string
  tenantId: string
  islemTipi: OfisKasaIslemTipiApi
  tarih: string
  kategori: string
  ozelKategoriAdi: string | null
  aciklama: string | null
  tutar: string
  paraBirimi: ParaBirimi
  dovizDonusumId: string | null
  kur: string | null
  kurBazParaBirimi: ParaBirimi | null
  kurKarsiParaBirimi: ParaBirimi | null
  odemeYontemi: OfisKasaOdemeYontemiApi
  belgeNo: string
  onayDurumu: OfisKasaOnayDurumuApi
  onaylayanId: string | null
  onayTarihi: string | null
  redSebebi: string | null
  orijinalHareketId: string | null
  orijinalBelgeNo: string | null
  otomatikOnayMi: boolean
  tahsilatiYapanUserId: string | null
  tahsilatiYapanPersonelId: string | null
  tahsilatiYapanPersonelAd?: string | null
  muvekkilId: string | null
  muvekkilAdiSnapshot: string | null
  muvekkil: OfisKasaMuvekkilSnapshotDto | null
  /** Bağlı tahsilat kaynağı — null ise manuel gelir/gider. */
  kaynakTipi?: string | null
  kaynakId?: string | null
  createdById: string
  updatedById: string | null
  deletedAt?: string | null
  deletedById?: string | null
  deleteReason?: string | null
  createdAt: string
  updatedAt: string
}

export type OfisKasaCurrencyOzetDto = {
  toplamGelir: string
  toplamGider: string
  toplamDuzeltme: string
  kasaBakiyesi: string
  buAyGelir: string
  buAyGider: string
}

export type OfisKasaOzetDto = {
  /** Legacy TRY toplamları */
  toplamGelir: string
  toplamGider: string
  toplamDuzeltme: string
  kasaBakiyesi: string
  onaysizIslemSayisi: number
  buAyGelir: string
  buAyGider: string
  byCurrency: Record<ParaBirimi, OfisKasaCurrencyOzetDto>
  bakiyeler: Record<ParaBirimi, string>
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

export type OfisKasaDovizDonusumResponse = {
  ok: true
  dovizDonusumId: string
  cikis: OfisKasaHareketiDto
  giris: OfisKasaHareketiDto
}

export type ListOfisKasaHareketleriParams = {
  q?: string
  muvekkilId?: string
  islemTipi?: OfisKasaIslemTipiApi
  onayDurumu?: OfisKasaOnayDurumuApi
  kategori?: string
  paraBirimi?: ParaBirimi
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
  paraBirimi?: ParaBirimi | null
  /** Yalnızca GELIR — prim hesabı. */
  tahsilatiYapanUserId?: string | null
  tahsilatiYapanPersonelId?: string | null
  /** Yalnızca GELIR — isteğe bağlı müvekkil bağlantısı. GIDER için gönderilmez. */
  muvekkilId?: string | null
}

export type CreateOfisKasaDuzeltmePayload = {
  tarih: string
  tutar: number
  aciklama: string
  odemeYontemi: OfisKasaOdemeYontemiApi
  paraBirimi?: ParaBirimi | null
}

export type CreateOfisKasaDovizDonusumPayload = {
  tarih: string
  kaynakParaBirimi: ParaBirimi
  hedefParaBirimi: ParaBirimi
  kaynakTutar: number
  hedefTutar: number
  odemeYontemi: OfisKasaOdemeYontemiApi
  aciklama?: string | null
  kurKaynagi?: import('./kurlar').KurKaynagiApi | null
  tcmbKurTarihi?: string | null
  tcmbReferansKur?: number | string | null
}
