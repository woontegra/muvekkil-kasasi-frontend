/** GET /api/v1/smm/bekleyenler satırı. */
export type SmmBekleyenDto = {
  id: string
  tenantId: string
  muvekkilId: string
  muvekkilAd: string
  dosyaId: string
  dosyaBaslik: string
  dosyaNo: string | null
  dosyaTuru: string
  tahsilatTarihi: string | null
  tahsilatTuru: string
  tutar: string
  odemeYontemi: string | null
  belgeNo: string | null
  smmKesildiMi: boolean
}

export type SmmBekleyenlerResponse = {
  ok: true
  items: SmmBekleyenDto[]
  total: number
}
