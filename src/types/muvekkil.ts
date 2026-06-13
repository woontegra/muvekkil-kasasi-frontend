export type MuvekkilTurApi = 'GERCEK' | 'TUZEL'

export type MuvekkilDto = {
  id: string
  tenantId: string
  tur: MuvekkilTurApi
  gorunenAd: string
  adSoyad: string
  sirketUnvani: string | null
  telefon: string | null
  eposta: string | null
  not: string | null
  yetkiliAdSoyad: string
  yetkiliTelefon: string
  mudurAdSoyad: string
  mudurTelefon: string
  muhasebeAdSoyad: string
  muhasebeTelefon: string
  aktifMi: boolean
  createdById: string
  updatedById: string | null
  createdAt: string
  updatedAt: string
}

export type MuvekkilListResponse = {
  ok: true
  items: MuvekkilDto[]
  total: number
  page: number
  limit: number
}

export type MuvekkilOneResponse = {
  ok: true
  muvekkil: MuvekkilDto
}

export type MuvekkilCreateResponse = {
  ok: true
  muvekkil: MuvekkilDto
}

export type CreateMuvekkilPayload = {
  tur: MuvekkilTurApi
  adSoyad: string
  sirketUnvani: string | null
  telefon: string
  eposta: string | null
  not: string | null
  yetkiliAdSoyad: string
  yetkiliTelefon: string
  mudurAdSoyad: string
  mudurTelefon: string
  muhasebeAdSoyad: string
  muhasebeTelefon: string
}
