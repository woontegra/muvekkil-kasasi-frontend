export type AvansMakbuzListeDto = {
  id: string
  tarih: string
  belgeNo: string
  tutar: string
  aciklama: string | null
  makbuzNo: string
}

export type VekaletMakbuzListeDto = {
  id: string
  taksitNo: number
  odemeTarihi: string | null
  makbuzNo: string | null
  tutar: string
  smmKesildiMi: boolean
  smmNo: string | null
}

export type DosyaMakbuzlariResponse = {
  ok: true
  avansMakbuzlari: AvansMakbuzListeDto[]
  vekaletMakbuzlari: VekaletMakbuzListeDto[]
}
