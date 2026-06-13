export type VekaletTaksitOdemeDurumuApi = 'ODENMEDI' | 'ODENDI' | 'IPTAL'

export type VekaletUcretiDto = {
  id: string
  tenantId: string
  dosyaId: string
  muvekkilId: string
  toplamTutar: string
  aciklama: string | null
  createdById: string
  updatedById: string | null
  createdAt: string
  updatedAt: string
}

export type VekaletTaksitiDto = {
  id: string
  tenantId: string
  dosyaId: string
  muvekkilId: string
  vekaletUcretiId: string
  taksitNo: number
  vadeTarihi: string
  tutar: string
  odemeDurumu: VekaletTaksitOdemeDurumuApi
  odemeTarihi: string | null
  aciklama: string | null
  makbuzNo: string | null
  smmKesildiMi: boolean
  smmKesimTarihi: string | null
  smmNo: string | null
  smmAciklama: string | null
  createdById: string
  updatedById: string | null
  createdAt: string
  updatedAt: string
}

export type DosyaVekaletOzetDto = {
  anlasilan: string
  odenenToplam: string
  kalanVekalet: string
  odenmemisTaksitSayisi: number
  smmBekleyenSayisi: number
}

export type DosyaVekaletResponse = {
  ok: true
  vekaletUcreti: VekaletUcretiDto | null
  taksitler: VekaletTaksitiDto[]
  ozet: DosyaVekaletOzetDto
  smmBekleyen: VekaletTaksitiDto[]
}

export type UpsertVekaletPayload = {
  toplamTutar: number
  aciklama?: string | null
}

export type CreateVekaletTaksitPayload = {
  taksitNo: number
  vadeTarihi: string
  tutar: number
  aciklama?: string | null
}

export type UpdateVekaletTaksitPayload = {
  taksitNo?: number
  vadeTarihi?: string
  tutar?: number
  odemeDurumu?: 'ODENMEDI' | 'ODENDI'
  odemeTarihi?: string | null
  aciklama?: string | null
}

export type MarkTaksitPaidPayload = {
  odemeTarihi?: string
  aciklama?: string | null
}

export type MarkTaksitSmmPayload = {
  smmNo: string
  smmKesimTarihi: string
  smmAciklama?: string | null
}
