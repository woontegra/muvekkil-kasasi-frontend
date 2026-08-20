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

export type HazirSablonKatalogItem = {
  libraryKey: string
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
