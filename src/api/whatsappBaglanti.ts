import { apiFetch } from './client'

export const WHATSAPP_BAGLANTI_QUERY_KEY = ['whatsapp-baglanti'] as const

export type WhatsAppBaglantiDurumResponse = {
  ok: true
  durum: string
  provider?: string
  connected: boolean
  wabaIdMasked?: string | null
  phoneNumberIdMasked?: string | null
  displayPhoneNumber?: string | null
  verifiedName?: string | null
  businessAccountName?: string | null
  webhookOverrideActive?: boolean
  webhookOverrideCallback?: string | null
  connectedAt?: string | null
  disconnectedAt?: string | null
  lastWebhookAt?: string | null
  sonHataOzeti?: string | null
  cloudApiEnabled?: boolean
  aktifProvider?: string
  gercekGonderimAktif?: boolean
  /** BAGLI + webhook override yok — SuperAdmin UI için paylaşılan/test bağlantısı. */
  sharedWebhookTestConnection?: boolean
  connectionMode?: 'CLOUD_API' | 'COEXISTENCE' | null
  platformType?: string | null
  isOnBizApp?: boolean | null
  coexistenceOnboardedAt?: string | null
  coexistenceDisconnectedAt?: string | null
  /** Kayıtlı WABA + telefon var — Coexistence yeniden bağlantısı yapılabilir. */
  yenidenBaglanabilir?: boolean
  templateOzet?: {
    onayli: number
    bekleyen: number
    reddedilen: number
    toplam: number
  }
}

export type EmbeddedSignupConfigResponse = {
  ok: true
  appId: string | null
  configId: string | null
  graphVersion: string
  configured: boolean
  metaUygulamaEksikleri?: string[]
  coexistenceEnabled?: boolean
}

export type CoexistenceSyncTur = 'KISILER' | 'GECMIS'

export type CoexistenceSyncDurum = {
  durum: string
  requestedAt: string | null
  progress: number | null
  itemsReceived: number
  lastWebhookAt: string | null
  hataOzeti: string | null
}

export type CoexistenceDurumResponse = {
  ok: true
  ozellikAktif: boolean
  metaUygulamaHazir: boolean
  metaUygulamaEksikleri: string[]
  ortakMetaUygulamasi: boolean
  connectionMode: string | null
  tokenUygulamasiUyumlu: boolean
  webhookMuvekkileYonlu: boolean
  platformType: string | null
  isOnBizApp: boolean | null
  phoneStatus: string | null
  metaStatusCheckedAt: string | null
  onboardedAt: string | null
  syncDeadline: string | null
  syncWindowOpen: boolean
  disconnectedAt: string | null
  disconnectReason: string | null
  yenidenBaglanabilir: boolean
  eslestirme: Record<CoexistenceSyncTur, CoexistenceSyncDurum | null>
}

export type MesajDurumuResponse = {
  ok: true
  baglantiVar: boolean
  connectionMode?: string | null
  metaStatusCheckedAt?: string | null
  lastWebhookAt?: string | null
  sonGelenMesajAt?: string | null
  son24SaatGelenMesaj?: number
  sonGonderildiAt?: string | null
  sonTeslimAt?: string | null
  sonOkunduAt?: string | null
  sonBasarisizAt?: string | null
  sonTelefondanGonderimAt?: string | null
  basariKriterleri?: {
    bagli: boolean
    metaConnectedCloudApi: boolean
    gelenMesajAlindi: boolean
    gidenMesajTeslimEdildi: boolean
  }
}

export async function getMesajDurumu(): Promise<MesajDurumuResponse> {
  return apiFetch<MesajDurumuResponse>('/api/v1/whatsapp-baglanti/mesaj-durumu')
}

export async function kaydetTelefon(pin: string): Promise<{ ok: true }> {
  return apiFetch('/api/v1/whatsapp-baglanti/telefon-kaydi', {
    method: 'POST',
    body: JSON.stringify({ pin })
  })
}

export async function getCoexistenceDurum(): Promise<CoexistenceDurumResponse> {
  return apiFetch<CoexistenceDurumResponse>('/api/v1/whatsapp-baglanti/coexistence/durum')
}

export async function baglanCoexistence(body: {
  mod: 'ILK_BAGLANTI' | 'YENIDEN_BAGLANTI'
  code: string
  wabaId: string
  phoneNumberId?: string | null
}): Promise<{ ok: true; uyarilar?: string[] }> {
  return apiFetch('/api/v1/whatsapp-baglanti/coexistence/baglan', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function esitleCoexistence(tur: CoexistenceSyncTur): Promise<CoexistenceDurumResponse> {
  return apiFetch('/api/v1/whatsapp-baglanti/coexistence/esitle', {
    method: 'POST',
    body: JSON.stringify({ tur })
  })
}

export async function yenileCoexistenceMetaDurum(): Promise<CoexistenceDurumResponse> {
  return apiFetch('/api/v1/whatsapp-baglanti/coexistence/meta-durum-yenile', {
    method: 'POST',
    body: '{}'
  })
}

export async function getWhatsAppBaglantiDurum(): Promise<WhatsAppBaglantiDurumResponse> {
  return apiFetch<WhatsAppBaglantiDurumResponse>('/api/v1/whatsapp-baglanti/durum')
}

export async function getEmbeddedSignupConfig(): Promise<EmbeddedSignupConfigResponse> {
  return apiFetch<EmbeddedSignupConfigResponse>('/api/v1/whatsapp-baglanti/embedded-signup-config')
}

export async function completeEmbeddedSignup(body: {
  code: string
  wabaId: string
  phoneNumberId: string
}): Promise<{ ok: true; baglanti: Record<string, unknown> }> {
  return apiFetch('/api/v1/whatsapp-baglanti/embedded-signup/complete', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function dogrulaWhatsAppBaglanti(): Promise<{ ok: true; baglanti: Record<string, unknown> }> {
  return apiFetch('/api/v1/whatsapp-baglanti/dogrula', { method: 'POST', body: '{}' })
}

export async function senkronWhatsAppSablonlari(): Promise<{
  ok: true
  synced: number
  reconciledGhosts?: number
  paginationComplete?: boolean
  templates?: unknown[]
}> {
  return apiFetch('/api/v1/whatsapp-baglanti/sablon-senkron', { method: 'POST', body: '{}' })
}

export async function kaldirWhatsAppBaglanti(): Promise<{ ok: true; baglanti: Record<string, unknown> }> {
  return apiFetch('/api/v1/whatsapp-baglanti/baglantiyi-kaldir', { method: 'POST', body: '{}' })
}

export type SablonParaBirimi = 'TRY' | 'USD' | 'EUR'

/** Tutar değişkenlerinin yanına sabit yazılmış para birimleri ve şablonun kullanılabileceği taksit para birimleri. */
export type SablonParaBirimiUyumu = {
  sabitParaBirimleri: SablonParaBirimi[]
  uyumluParaBirimleri: SablonParaBirimi[]
}

export function paraBirimiKisaEtiket(pb: SablonParaBirimi): string {
  return pb === 'TRY' ? 'TL' : pb
}

export type HazirSablonKatalogItem = {
  libraryKey: string
  /** Aynı mesajın TL/USD/EUR sürümlerini gruplayan anahtar. */
  familyKey?: string
  /** null: tutar içermeyen şablon (randevu). */
  paraBirimi?: SablonParaBirimi | null
  displayName: string
  shortDescription: string
  suggestedUse: string
  category: string
  language: string
  metaTemplateName: string
  bodyPreview: string
  variables: string[]
  suggestedKuralTuru: string | null
  statusCode: string
  statusLabel: string
  rejectionReason: string | null
  canSubmitToMeta: boolean
  canUseInAutomation: boolean
  local: Record<string, unknown> | null
  templateGroup?: 'TAHSILAT' | 'RANDEVU'
}

export async function getHazirSablonKutuphanesi(): Promise<{
  ok: true
  catalog: HazirSablonKatalogItem[]
  connectionReady: boolean
}> {
  return apiFetch('/api/v1/whatsapp-baglanti/hazir-sablon-kutuphanesi')
}

export async function metaOnayinaGonderHazirSablon(libraryKey: string): Promise<{
  ok: true
  alreadyExists?: boolean
  template?: Record<string, unknown>
  note?: string
}> {
  return apiFetch(
    `/api/v1/whatsapp-baglanti/hazir-sablon-kutuphanesi/${encodeURIComponent(libraryKey)}/meta-onayina-gonder`,
    { method: 'POST', body: '{}' }
  )
}

export async function getOnayliWhatsAppSablonlari(): Promise<{
  ok: true
  templates: Array<{
    id: string
    libraryKey: string | null
    metaName: string
    language: string
    statusNormalized: string
    statusLabel: string
    usageArea?: string | null
    paraBirimiUyumu?: SablonParaBirimiUyumu | null
  }>
}> {
  return apiFetch('/api/v1/whatsapp-baglanti/onayli-sablonlar')
}

export async function getOnayliWhatsAppSablonlariByKural(
  kuralTuru: 'VADEDEN_ONCE' | 'VADE_GUNU' | 'VADE_SONRASI'
): Promise<{
  ok: true
  templates: Array<{
    id: string
    libraryKey: string | null
    metaName: string
    language: string
    statusNormalized: string
    statusLabel: string
    usageArea?: string | null
    paraBirimiUyumu?: SablonParaBirimiUyumu | null
  }>
}> {
  return apiFetch(`/api/v1/whatsapp-baglanti/onayli-sablonlar?kuralTuru=${encodeURIComponent(kuralTuru)}`)
}

export type OzelSablonDegisken = {
  index: number
  systemField:
    | 'muvekkilAdi'
    | 'dosyaNumarasi'
    | 'taksitTutari'
    | 'kalanTutar'
    | 'vadeTarihi'
    | 'odenenTutar'
    | 'odemeTarihi'
    | 'randevuTarihi'
    | 'randevuSaati'
    | 'buroAdi'
    | 'buroTelefon'
  exampleValue: string
}

export type OzelSablonDto = {
  id: string
  displayName: string
  metaName: string
  usageArea: string
  category: 'UTILITY' | 'MARKETING'
  language: 'tr'
  bodyText: string
  footerText: string | null
  variables: OzelSablonDegisken[]
  statusNormalized: string
  rejectionReason: string | null
  createdAt?: string | null
  submittedAt?: string | null
  approvedAt?: string | null
  lastSyncedAt?: string | null
  isEditable: boolean
  isDeletable: boolean
  canSubmitToMeta: boolean
  paraBirimiUyumu?: SablonParaBirimiUyumu | null
}

export type CreateOzelSablonPayload = {
  displayName: string
  metaName: string
  usageArea: 'VADEDEN_ONCE' | 'VADE_GUNU' | 'VADE_SONRASI' | 'KISMI_ODEME_SONRASI' | 'ODEME_ALINDI' | 'RANDEVU_HATIRLATMA' | 'MANUEL'
  category: 'UTILITY' | 'MARKETING'
  language: 'tr'
  bodyText: string
  footerText?: string | null
  variables: OzelSablonDegisken[]
}

export async function getOzelWhatsAppSablonlari(): Promise<{ ok: true; templates: OzelSablonDto[] }> {
  return apiFetch('/api/v1/whatsapp-baglanti/ozel-sablonlar')
}

export async function createOzelWhatsAppSablonu(
  body: CreateOzelSablonPayload
): Promise<{ ok: true; template: OzelSablonDto }> {
  return apiFetch('/api/v1/whatsapp-baglanti/ozel-sablonlar', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function updateOzelWhatsAppSablonu(
  id: string,
  body: CreateOzelSablonPayload
): Promise<{ ok: true; template: OzelSablonDto }> {
  return apiFetch(`/api/v1/whatsapp-baglanti/ozel-sablonlar/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export async function deleteOzelWhatsAppSablonu(id: string): Promise<{ ok: true; deletedId: string }> {
  return apiFetch(`/api/v1/whatsapp-baglanti/ozel-sablonlar/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}

export async function submitOzelWhatsAppSablonu(id: string): Promise<{ ok: true; template: OzelSablonDto }> {
  return apiFetch(`/api/v1/whatsapp-baglanti/ozel-sablonlar/${encodeURIComponent(id)}/meta-onayina-gonder`, {
    method: 'POST',
    body: '{}'
  })
}

export async function copyHazirTemplateAsOzel(libraryKey: string): Promise<{ ok: true; template: OzelSablonDto }> {
  return apiFetch(
    `/api/v1/whatsapp-baglanti/hazir-sablon-kutuphanesi/${encodeURIComponent(libraryKey)}/kopyala-ozellestir`,
    { method: 'POST', body: '{}' }
  )
}

export async function copyOzelTemplateAsDraft(id: string): Promise<{ ok: true; template: OzelSablonDto }> {
  return apiFetch(`/api/v1/whatsapp-baglanti/ozel-sablonlar/${encodeURIComponent(id)}/kopyala-ozellestir`, {
    method: 'POST',
    body: '{}'
  })
}
