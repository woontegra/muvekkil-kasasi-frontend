export type PrimPersonelDto = {
  id: string
  tenantId: string
  adSoyad: string
  telefon: string | null
  eposta: string | null
  unvan: string | null
  aktifMi: boolean
  not: string | null
  bagliUserId: string | null
  bagliUserAdSoyad: string | null
  createdAt: string
  updatedAt: string
}

export type CreatePrimPersonelPayload = {
  adSoyad: string
  telefon?: string | null
  eposta?: string | null
  unvan?: string | null
  not?: string | null
  bagliUserId?: string | null
  aktifMi?: boolean
}

export type UpdatePrimPersonelPayload = Partial<CreatePrimPersonelPayload>

export type PrimPersonelLinkUserDto = {
  id: string
  adSoyad: string
  kullaniciAdi: string
  eposta: string | null
  telefon: string | null
  role: 'BURO_SAHIBI' | 'AVUKAT_YONETICI' | 'KATIP_PERSONEL'
  aktifMi: boolean
  baskaPersoneleBagli: boolean
  bagliPersonelAdSoyad: string | null
}
