export type PrimKuralKapsamApi = 'TENANT_DEFAULT' | 'USER_SPECIFIC'
export type PrimHesaplamaTipiApi = 'TOTAL_BRACKET' | 'PROGRESSIVE'
export type PrimDonemOdemeDurumuApi = 'HESAPLANDI' | 'ODENDI'
export type TahsilatKaynakApi = 'DOSYA_AVANS' | 'VEKALET' | 'OFIS_GELIR' | 'ICRA'

export type PrimKademeDto = {
  id?: string
  minTutar: string
  maxTutar: string | null
  oranYuzde: string
  siraNo: number
}

export type PrimKuralDto = {
  id: string
  tenantId: string
  ad: string
  aktifMi: boolean
  kapsam: PrimKuralKapsamApi
  userId: string | null
  userAdSoyad: string | null
  primPersonelId: string | null
  primPersonelAdSoyad: string | null
  hesaplamaTipi: PrimHesaplamaTipiApi
  donemTipi: 'MONTHLY'
  dosyaTahsilatMi: boolean
  vekaletTahsilatMi: boolean
  ofisKasaGelirMi: boolean
  icraTahsilatMi: boolean
  kademeler: PrimKademeDto[]
  createdAt: string
  updatedAt: string
}

export type PrimRaporSatirDto = {
  primDonemId: string | null
  primPersonelId: string
  primPersonelAdSoyad: string
  userId: string | null
  userAdSoyad?: string | null
  yil: number
  ay: number
  toplamTahsilat: string
  hesaplananPrim: string
  uygulananKuralAd: string | null
  hesaplamaTipi: PrimHesaplamaTipiApi | null
  durum: PrimDonemOdemeDurumuApi | null
}

export type PrimKademeHesapDetay = {
  minTutar: number
  maxTutar: number | null
  uygulananTutar: number
  oranYuzde: number
  primTutari: number
}

export type PrimTahsilatSatirDto = {
  id: string
  kaynak: TahsilatKaynakApi
  tarih: string
  tutar: string
  aciklama: string | null
  muvekkilAd: string | null
  dosyaBaslik: string | null
  kasaTuru: string
  kaynakKayitId: string
}

export type PrimRaporDetayDto = {
  ozet: {
    primDonemId: string
    primPersonelId: string
    primPersonelAdSoyad: string
    userId: string | null
    userAdSoyad: string | null
    yil: number
    ay: number
    toplamTahsilat: string
    hesaplananPrim: string
    uygulananKuralAd: string | null
    hesaplamaTipi: PrimHesaplamaTipiApi | null
    durum: PrimDonemOdemeDurumuApi
    odendiTarihi: string | null
    not: string | null
  }
  kademeHesabi: PrimKademeHesapDetay[]
  tahsilatlar: PrimTahsilatSatirDto[]
}

export type CreatePrimKuralPayload = {
  ad: string
  aktifMi?: boolean
  kapsam: PrimKuralKapsamApi
  userId?: string | null
  primPersonelId?: string | null
  hesaplamaTipi: PrimHesaplamaTipiApi
  dosyaTahsilatMi?: boolean
  vekaletTahsilatMi?: boolean
  ofisKasaGelirMi?: boolean
  icraTahsilatMi?: boolean
  kademeler: Array<{
    minTutar: number
    maxTutar?: number | null
    oranYuzde: number
    siraNo?: number
  }>
}

export type UpdatePrimKuralPayload = Partial<CreatePrimKuralPayload>

export type PrimRaporQueryParams = {
  yil: number
  ay: number
  userId?: string
  primPersonelId?: string
  tahsilatTuru?: 'DOSYA_AVANS' | 'VEKALET' | 'OFIS_GELIR' | 'ICRA' | 'TUMU'
}

export type PersonelPrimOzetDto = {
  primPersonelId: string
  adSoyad: string
  unvan: string | null
  aktifMi: boolean
  toplamTahsilatBuAy: string
  tahminiPrim: string
  primDonemId: string | null
  primDonemDurum: PrimDonemOdemeDurumuApi | null
}

export type PersonelTahsilatKartDto = PrimTahsilatSatirDto & {
  onayDurumu: 'ONAYSIZ' | 'ONAYLI' | 'REDDEDILDI'
  primHesabinaDahilMi: boolean
  tahsilatiYapanPersonelId: string
  tahsilatiYapanAdSoyad: string
}

export type PersonelPrimPanelDto = {
  personel: {
    id: string
    adSoyad: string
    unvan: string | null
    aktifMi: boolean
  }
  ozet: {
    yil: number
    ay: number
    toplamTahsilatBuAy: string
    primDahilTahsilat: string
    tahminiPrim: string
    odenmisPrim: string
    tahsilatAdedi: number
    primDahilTahsilatAdedi: number
    uygulananKuralAd: string | null
    primDonemId: string | null
    primDonemDurum: PrimDonemOdemeDurumuApi | null
    kademeHesabi: PrimKademeHesapDetay[]
  }
  kural: PrimKuralDto | null
  tahsilatlar: PersonelTahsilatKartDto[]
}

export type PersonelPanelDetayParams = {
  yil: number
  ay: number
  tahsilatTuru?: 'DOSYA_AVANS' | 'VEKALET' | 'OFIS_GELIR' | 'ICRA' | 'TUMU'
  onayDurumu?: 'TUMU' | 'ONAYSIZ' | 'ONAYLI' | 'REDDEDILDI'
  /** true ise prime dahil olmayan tahsilatlar da listelenir */
  includeNonPremium?: boolean
  /** @deprecated includeNonPremium kullanın */
  sadecePrimDahil?: boolean
}
