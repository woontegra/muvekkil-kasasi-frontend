export type ReportTenantInfo = {
  buroAdi: string
  telefon: string | null
  eposta: string | null
  adres: string | null
  vergiNo: string | null
  vergiDairesi: string | null
}

export type OfisKasaReportRow = {
  id: string
  tarih: string
  islemTipi: string
  islemTipiLabel: string
  kategoriLabel: string
  tutar: string
  odemeYontemiLabel: string
  aciklama: string | null
  belgeNo: string
  onayDurumuLabel: string
}

export type OfisKasaReportResponse = {
  ok: true
  tenant: ReportTenantInfo
  filters: {
    startDate: string | null
    endDate: string | null
    islemTipi: string | null
    kategori: string | null
    onayDurumu: string | null
    q: string | null
  }
  totals: {
    toplamGelir: string
    toplamGider: string
    duzeltmeEtkisi: string
    netBakiye: string
    hareketSayisi: number
  }
  rows: OfisKasaReportRow[]
}

export type IcraTahsilatReportAlacakRow = {
  id: string
  borcluAd: string
  muvekkilAd: string | null
  dosyaBaslik: string | null
  alacakTuruLabel: string
  toplamTutar: string
  odenenToplam: string
  kalanTutar: string
  taksitSayisi: number
  durumLabel: string
  tahsilatiYapanPersonelAd: string | null
}

export type IcraTahsilatReportTahsilatRow = {
  id: string
  tarih: string
  borcluAd: string
  alacakTuruLabel: string
  tutar: string
  odemeYontemiLabel: string
  tahsilatiYapanPersonelAd: string
  smmDurumu: string
}

export type IcraTahsilatReportResponse = {
  ok: true
  tenant: ReportTenantInfo
  filters: {
    startDate: string | null
    endDate: string | null
    alacakTuru: string | null
    durum: string | null
    tahsilatiYapanPersonelId: string | null
    q: string | null
  }
  totals: {
    toplamAlacak: string
    tahsilEdilen: string
    kalanAlacak: string
    vadesiGecmisTaksit: number
    smmBekleyen: number
    alacakSayisi: number
    tahsilatSayisi: number
  }
  alacaklar: IcraTahsilatReportAlacakRow[]
  tahsilatlar: IcraTahsilatReportTahsilatRow[]
}

export type OfisKasaReportQuery = {
  startDate?: string
  endDate?: string
  islemTipi?: string
  kategori?: string
  onayDurumu?: string
  q?: string
}

export type IcraTahsilatReportQuery = {
  startDate?: string
  endDate?: string
  alacakTuru?: string
  durum?: string
  tahsilatiYapanPersonelId?: string
  q?: string
}
