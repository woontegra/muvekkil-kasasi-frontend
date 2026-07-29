/** Backend `MuvekkilEkstrePayload` — frontend yeniden hesaplamaz. */

export type MuvekkilEkstreDurumLabel =
  | 'Tam Ödendi'
  | 'Kısmi Ödendi'
  | 'Gecikmiş'
  | 'Bekliyor'
  | 'İptal'

export type MuvekkilEkstreDto = {
  belgeRef: string
  ekstreTarihi: string
  itibariyleTarih: string
  itibariyleAciklama: string
  buro: {
    buroAdi: string
    telefon: string | null
    eposta: string | null
    adres: string | null
  }
  muvekkil: {
    id: string
    gorunenAd: string
    telefonVar: boolean
  }
  dosya: {
    id: string
    konuBasligi: string
    dosyaNo: string | null
    mahkeme: string | null
    icraDairesi: string | null
  }
  vekaletOzeti: {
    kararlastirilanToplam: string
    tahsilEdilenToplam: string
    kalanToplam: string
    tahsilatOrani: number
    gecikmisToplam: string
    sonrakiTaksitVade: string | null
    sonrakiTaksitTutar: string | null
  }
  taksitler: Array<{
    id: string
    taksitNo: number
    vadeTarihi: string
    taksitTutari: string
    odenenToplam: string
    kalanTutar: string
    durum: MuvekkilEkstreDurumLabel
    iptalMi: boolean
    odemeler: Array<{
      id: string
      odemeTarihi: string
      tutar: string
      odemeYontemi: string
      makbuzNo: string
      aciklama: string | null
    }>
  }>
  masrafAvansiOzeti: {
    toplamAlinanAvans: string
    toplamMasraf: string
    pozitifDuzeltme: string
    negatifDuzeltme: string
    muvekkileIade: string
    guncelBakiye: string
  }
  masrafHareketleri: Array<{
    id: string
    tarih: string
    belgeNo: string
    islemTuru: string
    aciklama: string | null
    giris: string
    cikis: string
    bakiyeSonrasi: string
  }>
  dipnot: string
}

export type MuvekkilEkstreResponse = { ok: true; ekstre: MuvekkilEkstreDto }
