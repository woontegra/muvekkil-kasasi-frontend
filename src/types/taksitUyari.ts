export type TaksitUyariListeSatir = {
  id: string
  kaynak: 'VEKALET' | 'ICRA'
  muvekkilId: string | null
  dosyaId: string | null
  muvekkilAd: string
  dosyaBaslik: string
  taksitNo: number
  taksitEtiket: string
  vadeTarihi: string
  tutar: string
  odenen: string
  kalan: string
  durum: 'GECIKTI'
}

export type TaksitUyarilariResponse = {
  ok: true
  vadesiGecmisCount: number
  bugunOdenecekCount: number
  odenmemisCount: number
  smmBekleyenCount: number
  vadesiGecmisListe: TaksitUyariListeSatir[]
}
