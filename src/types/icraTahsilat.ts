import type { OfisKasaOdemeYontemiApi } from './ofisKasasi'

export type IcraAlacakTuruApi = 'KARSI_TARAF_VEKALET' | 'ICRA_VEKALET'
export type IcraAlacakDurumApi = 'ACIK' | 'KISMI_ODENDI' | 'ODENDI' | 'GECIKTI' | 'IPTAL'
export type IcraTaksitDurumApi = 'ODENMEDI' | 'KISMI_ODENDI' | 'ODENDI' | 'GECIKTI'
export type IcraSmmDurumApi = 'YOK' | 'BEKLIYOR' | 'KESILDI'

export const ICRA_ALACAK_TURU_LABEL: Record<IcraAlacakTuruApi, string> = {
  KARSI_TARAF_VEKALET: 'Karşı Taraf Vekalet Ücreti',
  ICRA_VEKALET: 'İcra Vekalet Ücreti'
}

export const ICRA_ALACAK_DURUM_LABEL: Record<IcraAlacakDurumApi, string> = {
  ACIK: 'Açık',
  KISMI_ODENDI: 'Kısmi ödendi',
  ODENDI: 'Ödendi',
  GECIKTI: 'Gecikti',
  IPTAL: 'İptal'
}

export type IcraTahsilatOzetDto = {
  toplamAlacak: string
  tahsilEdilen: string
  kalanAlacak: string
  vadesiGecmisTaksit: number
  buAyTahsilat: string
  smmBekleyen: number
}

export type IcraTahsilatListeSatirDto = {
  id: string
  borcluAd: string
  muvekkilId: string | null
  muvekkilAd: string | null
  dosyaId: string | null
  dosyaBaslik: string | null
  alacakTuru: IcraAlacakTuruApi
  alacakTuruLabel: string
  toplamTutar: string
  pesinatTutar: string
  odenenToplam: string
  kalanTutar: string
  taksitSayisi: number
  durum: IcraAlacakDurumApi
  durumLabel: string
  kayitTarihi: string
  iptalMi: boolean
  /** Son tahsilatı yapan personel/kullanıcı adı */
  sonTahsilatciAd?: string | null
  tahsilatiYapanAd?: string | null
}

export type IcraTahsilatTaksitDto = {
  id: string
  alacakId: string
  taksitNo: number
  tutar: string
  vadeTarihi: string
  aciklama: string | null
  odenenToplam: string
  kalanTutar: string
  durum: IcraTaksitDurumApi
  smmDurumu: IcraSmmDurumApi
  smmBekleyenOdemeId: string | null
  sonOdemeTarihi: string | null
  sonOdemeId: string | null
}

export type IcraTahsilatOdemeDto = {
  id: string
  alacakId: string
  taksitId: string | null
  odemeTarihi: string
  tutar: string
  odemeYontemi: OfisKasaOdemeYontemiApi
  aciklama: string | null
  smmKesildiMi: boolean
  pesinatMi: boolean
  ofisKasaHareketId: string | null
  tahsilatiYapanPersonelId: string | null
  tahsilatiYapanUserId?: string | null
  tahsilatiYapanAd?: string | null
  createdAt: string
}

export type IcraTahsilatDetayDto = {
  id: string
  alacakTuru: IcraAlacakTuruApi
  alacakTuruLabel: string
  borcluAd: string
  muvekkilId: string | null
  muvekkilAd: string | null
  dosyaId: string | null
  dosyaBaslik: string | null
  dosyaNo: string | null
  toplamTutar: string
  pesinatTutar: string
  taksitSayisi: number
  ilkVadeTarihi: string
  varsayilanOdemeYontemi: OfisKasaOdemeYontemiApi
  aciklama: string | null
  durum: IcraAlacakDurumApi
  durumLabel: string
  iptalMi: boolean
  ozet: {
    toplamAlacak: string
    taksitToplami: string
    pesinatTutar: string
    tahsilEdilen: string
    kalan: string
    dagitilmamisFark: number
    taksitToplamiEslesiyor: boolean
  }
  taksitler: IcraTahsilatTaksitDto[]
  odemeler: IcraTahsilatOdemeDto[]
}

export type ListIcraTahsilatParams = {
  q?: string
  alacakTuru?: IcraAlacakTuruApi
  durum?: IcraAlacakDurumApi
  tahsilatiYapanPersonelId?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export type IcraTahsilatTipiApi = 'PESIN_TAHSIL' | 'PESINAT_TAKSIT' | 'SADECE_TAKSIT'

export type CreateIcraTahsilatPayload = {
  alacakTuru: IcraAlacakTuruApi
  borcluAd: string
  muvekkilId?: string | null
  dosyaId?: string | null
  toplamTutar: number
  tahsilatTipi?: IcraTahsilatTipiApi
  pesinatVar?: boolean
  pesinatTutar?: number
  taksitSayisi: number
  ilkVadeTarihi?: string
  tahsilatTarihi?: string
  odemeYontemi: OfisKasaOdemeYontemiApi
  tahsilatiYapanPersonelId?: string | null
  aciklama?: string | null
}

export type PatchIcraTaksitPayload = {
  vadeTarihi?: string
  tutar?: number
  aciklama?: string | null
}

export type CreateIcraTaksitOdemePayload = {
  tutar: number
  odemeTarihi: string
  odemeYontemi: OfisKasaOdemeYontemiApi
  tahsilatiYapanPersonelId?: string | null
  aciklama?: string | null
}

export type IcraTahsilatListResponse = {
  ok: true
  ozet: IcraTahsilatOzetDto
  items: IcraTahsilatListeSatirDto[]
  total: number
}

export type IcraTahsilatDetayResponse = {
  ok: true
  alacak: IcraTahsilatDetayDto
}
