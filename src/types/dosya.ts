import type { MuvekkilDto } from './muvekkil'

export type DosyaDurumuApi = 'AKTIF' | 'PASIF' | 'KAPANDI' | 'ARSIV'
export type DosyaTuruApi = 'DAVA' | 'ICRA' | 'DANISMANLIK' | 'DIGER'

export type DosyaDto = {
  id: string
  tenantId: string
  muvekkilId: string
  konuBasligi: string
  mahkeme: string | null
  icraDairesi: string | null
  dosyaNo: string | null
  dosyaTuru: DosyaTuruApi
  durum: DosyaDurumuApi
  aciklama: string | null
  aktifMi: boolean
  createdById: string
  updatedById: string | null
  createdAt: string
  updatedAt: string
}

export type DosyaListResponse = {
  ok: true
  items: DosyaDto[]
  total: number
  page: number
  limit: number
}

export type DosyaOneResponse = {
  ok: true
  dosya: DosyaDto
  muvekkil: MuvekkilDto
}

export type DosyaCreateResponse = {
  ok: true
  dosya: DosyaDto
}

export type CreateDosyaPayload = {
  konuBasligi: string
  mahkeme: string | null
  icraDairesi: string | null
  dosyaNo: string | null
  dosyaTuru: DosyaTuruApi
  durum: DosyaDurumuApi
  aciklama: string | null
}

export type UpdateDosyaPayload = CreateDosyaPayload
