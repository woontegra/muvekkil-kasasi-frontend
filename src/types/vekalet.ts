export type VekaletTaksitOdemeDurumuApi = 'ODENMEDI' | 'KISMI_ODENDI' | 'ODENDI' | 'IPTAL'

export type TaksitComputedDurumApi = 'ODENMEDI' | 'KISMI_ODENDI' | 'ODENDI' | 'GECIKTI'

export type TaksitSmmDurumApi = 'YOK' | 'BEKLIYOR' | 'KESILDI'

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
  taksitTutari?: string
  odenenToplam?: string
  kalanTutar?: string
  durum?: TaksitComputedDurumApi
  sonOdemeTarihi?: string | null
  sonMakbuzNo?: string | null
  smmDurumu?: TaksitSmmDurumApi
  smmBekleyenOdemeId?: string | null
}

export type VekaletTaksitOdemeDto = {
  id: string
  tenantId: string
  muvekkilId: string
  dosyaId: string
  taksitId: string
  odemeTarihi: string
  tutar: string
  odemeYontemi: import('./kasa').OdemeYontemiApi
  aciklama: string | null
  makbuzNo: string
  smmKesildiMi: boolean
  kasaHareketId: string | null
  ofisKasaHareketId: string | null
  tahsilatiYapanUserId: string | null
  tahsilatiYapanPersonelId: string | null
  createdById: string
  createdAt: string
  updatedAt: string
}

export type VekaletOdemeMakbuzDto = {
  buro: Record<string, unknown>
  muvekkil: Record<string, unknown>
  dosya: Record<string, unknown>
  mahkemeIcra: string | null
  dosyaNo: string | null
  taksitNo: number
  taksitTutari: string
  odemeTarihi: string
  odemeYontemi: string
  tahsilatTutari: string
  anlasilanVekalet: string
  odenenToplam: string
  kalanVekalet: string
  makbuzNo: string
  smmKesildiMi: boolean
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
  smmBekleyen: Record<string, unknown>[]
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

export type CreateVekaletTaksitOdemePayload = {
  tutar: number
  odemeTarihi?: string
  odemeYontemi: import('./kasa').OdemeYontemiApi
  aciklama?: string | null
  tahsilatiYapanUserId?: string | null
  tahsilatiYapanPersonelId?: string | null
}

export type CreateVekaletPesinOdemePayload = CreateVekaletTaksitOdemePayload

export type CreateVekaletTaksitPlaniPayload = {
  taksitSayisi: number
  ilkVadeTarihi: string
  taksitTutari: number
  aciklama?: string | null
}

export type CreateTekVekaletTaksitiPayload = {
  vadeTarihi: string
  tutar?: number
  aciklama?: string | null
}
