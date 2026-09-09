import { apiFetch } from './client'

export type WhatsAppKrediDurum = 'NORMAL' | 'DUSUK' | 'KRITIK' | 'TUKENDI'

export type WhatsAppMesajPaketiDto = {
  id: string
  mesajAdedi: number
  label: string
  fiyatTL: number
  aktif: boolean
}

export type WhatsAppMesajPaketTalepDto = {
  id: string
  tenantId: string
  packageId: string
  mesajAdedi: number
  fiyatTL: number
  paymentReference: string
  durum: 'BEKLIYOR' | 'ONAYLANDI' | 'REDDEDILDI' | 'IPTAL'
  adminNotu: string | null
  createdAt: string
  updatedAt: string
  approvedAt: string | null
  approvedByAdminId: string | null
}

export type WhatsAppMesajKrediResponse = {
  ok: true
  bakiye: number
  toplamKullanilan: number
  toplamEklenen: number
  durum: WhatsAppKrediDurum
  dusukBakiye: boolean
  kritikBakiye: boolean
  yillikDahilKredi: number
  paketler: WhatsAppMesajPaketiDto[]
  bekleyenPackageIds: string[]
}

export type WhatsAppPaketTalepCreateResponse = {
  ok: true
  talep: WhatsAppMesajPaketTalepDto
  alreadyExists?: boolean
  message: string
}

export const WHATSAPP_MESAJ_KREDI_QUERY_KEY = ['whatsapp-mesaj-kredisi'] as const
export const WHATSAPP_MESAJ_TALEP_QUERY_KEY = ['whatsapp-mesaj-paket-talepleri'] as const

export async function getWhatsAppMesajKredisi(): Promise<WhatsAppMesajKrediResponse> {
  return apiFetch('/api/v1/whatsapp-mesaj-kredisi')
}

export async function createWhatsAppPaketTalebi(
  packageId: string
): Promise<WhatsAppPaketTalepCreateResponse> {
  return apiFetch('/api/v1/whatsapp-mesaj-kredisi/talepler', {
    method: 'POST',
    body: JSON.stringify({ packageId })
  })
}

export async function listWhatsAppPaketTalepleri(opts?: {
  durum?: string
}): Promise<{ ok: true; items: WhatsAppMesajPaketTalepDto[] }> {
  const sp = new URLSearchParams()
  if (opts?.durum) sp.set('durum', opts.durum)
  const q = sp.toString()
  return apiFetch(`/api/v1/whatsapp-mesaj-kredisi/talepler${q ? `?${q}` : ''}`)
}
