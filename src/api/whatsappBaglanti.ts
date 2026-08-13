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
  templates?: unknown[]
}> {
  return apiFetch('/api/v1/whatsapp-baglanti/sablon-senkron', { method: 'POST', body: '{}' })
}

export async function kaldirWhatsAppBaglanti(): Promise<{ ok: true; baglanti: Record<string, unknown> }> {
  return apiFetch('/api/v1/whatsapp-baglanti/baglantiyi-kaldir', { method: 'POST', body: '{}' })
}
