export type RandevuDto = {
  id: string
  tenantId: string
  muvekkilId: string | null
  dosyaId: string | null
  olusturanUserId: string
  sorumluUserId: string | null
  baslik: string
  baslangicAt: string
  bitisAt: string
  konum: string | null
  aciklama: string | null
  aktifMi: boolean
  createdAt: string
  updatedAt: string
  muvekkilAd: string | null
  dosyaBaslik: string | null
  sorumluAdSoyad: string | null
  olusturanAdSoyad: string
}

export type RandevuListResponse = {
  ok: true
  items: RandevuDto[]
  total: number
}

export type RandevuOneResponse = {
  ok: true
  randevu: RandevuDto
}

export type RandevuWritePayload = {
  baslik: string
  baslangicAt: string
  bitisAt: string
  konum?: string | null
  aciklama?: string | null
  muvekkilId?: string | null
  dosyaId?: string | null
  sorumluUserId?: string | null
}

export type CalendarView = 'day' | 'week' | 'month'
