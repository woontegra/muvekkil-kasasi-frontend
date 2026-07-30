export type BildirimKanali = 'SMS' | 'WHATSAPP'

export type BildirimKuralTuru = 'VADEDEN_ONCE' | 'VADE_GUNU' | 'VADE_SONRASI'

export type BildirimIsDurumu =
  | 'PLANLANDI'
  | 'KUYRUKTA'
  | 'SIMULASYON_TAMAMLANDI'
  | 'GONDERILDI'
  | 'TESLIM_EDILDI'
  | 'OKUNDU'
  | 'BASARISIZ'
  | 'IPTAL_EDILDI'
  | 'ATLANDI'

export type WhatsAppBaglantiDurumu =
  | 'BAGLI_DEGIL'
  | 'ONAY_BEKLIYOR'
  | 'BAGLI'
  | 'HATA'
  | 'PENDING'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DISABLED'

export type TahsilatBildirimIsGorunum = 'PLANLANANLAR' | 'BUGUN' | 'GECMIS' | 'ATLANANLAR'

export type TahsilatBildirimAyarDto = {
  id: string
  tenantId: string
  otomasyonAktif: boolean
  testModu: boolean
  /** @deprecated SMS kanalı kaldırıldı; geriye dönük uyumluluk için opsiyonel. */
  otomatikSmsAktif?: boolean
  /** @deprecated SMS kanalı kaldırıldı; geriye dönük uyumluluk için opsiyonel. */
  dusukSmsBakiyeEsigi?: number
  izinliSaatBaslangic: number
  izinliSaatBitis: number
  createdAt: string
  updatedAt: string
}

export type TahsilatBildirimKuraliDto = {
  id: string
  tenantId: string
  kuralTuru: BildirimKuralTuru
  aktifMi: boolean
  gunOffset: number
  gonderimSaatiDk: number
  kanal: BildirimKanali
  createdAt: string
  updatedAt: string
}

export type TahsilatBildirimSablonuDto = {
  id: string
  tenantId: string
  kuralTuru: BildirimKuralTuru
  kanal: BildirimKanali
  metin: string
  createdAt: string
  updatedAt: string
}

export type WhatsAppDurumDto = {
  durum: WhatsAppBaglantiDurumu | string
  mesaj?: string
  gercekGonderimAktif?: boolean
  wabaIdMasked?: string | null
  phoneNumberIdMasked?: string | null
  sonHataOzeti?: string | null
  aktifProvider?: string
  cloudApiEnabled?: boolean
  bilgi?: string
}

export type TahsilatBildirimAyarlarResponse = {
  ok: true
  ayar: TahsilatBildirimAyarDto
  kurallar: TahsilatBildirimKuraliDto[]
  sablonlar: TahsilatBildirimSablonuDto[]
  whatsapp: {
    aktifProvider: string
    cloudApiEnabled?: boolean
    bilgi: string
  }
}

export type TahsilatBildirimOzetDto = {
  /** Bugün planlanan iş sayısı (vade günü penceresi). */
  bugun: number
  /** Planlanan / kuyruktaki yaklaşan işler. */
  planlananlar: number
  gecmis: number
  atlananlar: number
  simulasyon: number
  /** Kullanıcı sözleşmesi alanları (varsa). */
  bugunPlanlanan?: number
  yaklasan?: number
  simulasyonTamamlanan?: number
  atlanan?: number
  basarisiz?: number
  iptalEdilen?: number
  gonderilen?: number
  teslimEdilen?: number
  bakiyeYetersiz?: number
  testModu?: boolean
  otomasyonAktif?: boolean
}

export type TahsilatBildirimOzetResponse = {
  ok: true
  ozet: TahsilatBildirimOzetDto
}

export type TahsilatBildirimIsiDto = {
  id: string
  tenantId: string
  muvekkilId: string
  muvekkilAd: string | null
  dosyaId: string
  dosyaBaslik: string | null
  dosyaNo: string | null
  taksitId: string
  taksitNo: number | null
  vadeTarihi: string | null
  kanal: BildirimKanali | string
  kuralTuru: BildirimKuralTuru | string
  planlananAt: string
  planYmd?: string
  kalanTutarSnapshot: string
  durum: BildirimIsDurumu
  iptalNedeni: string | null
  atlamaNedeni: string | null
  hataOzeti: string | null
  uygunlukAciklama?: string | null
  smsParcaSayisi?: number | null
  smsKrediTuketimi?: number | null
  telefonMaskeli?: string | null
  manuelTetikleme?: boolean
  denemeSayisi?: number
  sonDenemeAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type ListTahsilatBildirimIsleriParams = {
  gorunum?: TahsilatBildirimIsGorunum
  page?: number
  limit?: number
}

export type TahsilatBildirimIslerResponse = {
  ok: true
  items: TahsilatBildirimIsiDto[]
  total: number
  page?: number
  limit?: number
  ozet?: TahsilatBildirimOzetDto
}

export type UpdateTahsilatBildirimAyarPayload = {
  otomasyonAktif?: boolean
  testModu?: boolean
  izinliSaatBaslangic?: number
  izinliSaatBitis?: number
}

export type UpdateTahsilatBildirimKuralPayload = {
  aktifMi?: boolean
  gunOffset?: number
  gonderimSaatiDk?: number
}

export type UpdateTahsilatBildirimSablonPayload = {
  metin: string
}

export type TahsilatBildirimSimulasyonOzetDto = {
  processed: number
  simulasyon: number
  atlananTelefon: number
  atlananIzin: number
  atlananDosya: number
  atlananSablon: number
  basarisiz: number
  skippedAlreadyDone: number
  deferredWindow: number
  hazirlanacak: number
  tenantId: string
}

export type TahsilatBildirimSimuleResponse = {
  ok: true
  ozet: TahsilatBildirimSimulasyonOzetDto
}

export type TahsilatBildirimPlanlaResult = {
  tenantId: string
  skipped: boolean
  reason?: string
  created: number
  cancelled: number
}

export type TahsilatBildirimPlanlaResponse = {
  ok: true
  result: TahsilatBildirimPlanlaResult
}

export type WhatsAppDurumResponse = {
  ok: true
} & WhatsAppDurumDto

export const BILDIRIM_IS_DURUM_LABEL: Record<BildirimIsDurumu, string> = {
  PLANLANDI: 'Planlandı',
  KUYRUKTA: 'Kuyrukta',
  SIMULASYON_TAMAMLANDI: 'Simülasyon',
  GONDERILDI: 'Gönderildi',
  TESLIM_EDILDI: 'Teslim edildi',
  OKUNDU: 'Okundu',
  BASARISIZ: 'Başarısız',
  IPTAL_EDILDI: 'İptal',
  ATLANDI: 'Atlandı'
}

export const BILDIRIM_KURAL_TURU_LABEL: Record<BildirimKuralTuru, string> = {
  VADEDEN_ONCE: 'Vadeden önce',
  VADE_GUNU: 'Vade günü',
  VADE_SONRASI: 'Vade sonrası'
}

export const BILDIRIM_GORUNUM_LABEL: Record<TahsilatBildirimIsGorunum, string> = {
  PLANLANANLAR: 'Planlananlar',
  BUGUN: 'Bugün',
  GECMIS: 'Geçmiş',
  ATLANANLAR: 'Atlananlar / Hatalar'
}

export function bildirimIsDurumLabel(d: string): string {
  return BILDIRIM_IS_DURUM_LABEL[d as BildirimIsDurumu] ?? d
}

export function bildirimKuralTuruLabel(k: string): string {
  return BILDIRIM_KURAL_TURU_LABEL[k as BildirimKuralTuru] ?? k
}

/** Özet alanlarını hem yeni hem mevcut API şekline göre okur. */
export function readBildirimOzetCounts(ozet: TahsilatBildirimOzetDto | undefined): {
  bugunPlanlanan: number
  yaklasan: number
  simulasyon: number
  atlanan: number
  basarisiz: number
  iptalEdilen: number
  testModu: boolean | undefined
  otomasyonAktif: boolean | undefined
} {
  return {
    bugunPlanlanan: ozet?.bugunPlanlanan ?? ozet?.bugun ?? 0,
    yaklasan: ozet?.yaklasan ?? ozet?.planlananlar ?? 0,
    simulasyon: ozet?.simulasyonTamamlanan ?? ozet?.simulasyon ?? 0,
    atlanan: ozet?.atlanan ?? ozet?.atlananlar ?? 0,
    basarisiz: ozet?.basarisiz ?? 0,
    iptalEdilen: ozet?.iptalEdilen ?? 0,
    testModu: ozet?.testModu,
    otomasyonAktif: ozet?.otomasyonAktif
  }
}
