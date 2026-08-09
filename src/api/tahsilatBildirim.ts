import type { QueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type {
  ListTahsilatBildirimIsleriParams,
  TahsilatBildirimAyarlarResponse,
  TahsilatBildirimAyarDto,
  TahsilatBildirimIslerResponse,
  TahsilatBildirimKuraliDto,
  TahsilatBildirimOzetResponse,
  TahsilatBildirimPlanlaResponse,
  TahsilatBildirimSablonuDto,
  TahsilatBildirimSimuleResponse,
  UpdateTahsilatBildirimAyarPayload,
  UpdateTahsilatBildirimKuralPayload,
  UpdateTahsilatBildirimSablonPayload,
  WhatsAppDurumResponse
} from '../types/tahsilatBildirim'

export const TAHSILAT_BILDIRIM_QUERY_KEY = ['tahsilat-bildirim'] as const

function toQuery(params: ListTahsilatBildirimIsleriParams): string {
  const sp = new URLSearchParams()
  if (params.gorunum) sp.set('gorunum', params.gorunum)
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export async function getTahsilatBildirimAyarlar(): Promise<TahsilatBildirimAyarlarResponse> {
  return apiFetch<TahsilatBildirimAyarlarResponse>('/api/v1/tahsilat-bildirim/ayarlar')
}

export async function updateTahsilatBildirimAyarlar(
  body: UpdateTahsilatBildirimAyarPayload
): Promise<{ ok: true; ayar: TahsilatBildirimAyarDto }> {
  return apiFetch<{ ok: true; ayar: TahsilatBildirimAyarDto }>('/api/v1/tahsilat-bildirim/ayarlar', {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export async function updateTahsilatBildirimKural(
  id: string,
  body: UpdateTahsilatBildirimKuralPayload
): Promise<{ ok: true; kural: TahsilatBildirimKuraliDto }> {
  return apiFetch<{ ok: true; kural: TahsilatBildirimKuraliDto }>(
    `/api/v1/tahsilat-bildirim/kurallar/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body)
    }
  )
}

export async function updateTahsilatBildirimSablon(
  id: string,
  body: UpdateTahsilatBildirimSablonPayload
): Promise<{ ok: true; sablon: TahsilatBildirimSablonuDto }> {
  return apiFetch<{ ok: true; sablon: TahsilatBildirimSablonuDto }>(
    `/api/v1/tahsilat-bildirim/sablonlar/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(body)
    }
  )
}

export async function getTahsilatBildirimOzet(): Promise<TahsilatBildirimOzetResponse> {
  return apiFetch<TahsilatBildirimOzetResponse>('/api/v1/tahsilat-bildirim/ozet')
}

export async function listTahsilatBildirimIsleri(
  params: ListTahsilatBildirimIsleriParams = {}
): Promise<TahsilatBildirimIslerResponse> {
  return apiFetch<TahsilatBildirimIslerResponse>(`/api/v1/tahsilat-bildirim/isler${toQuery(params)}`)
}

export async function simuleTahsilatBildirimleri(): Promise<TahsilatBildirimSimuleResponse> {
  return apiFetch<TahsilatBildirimSimuleResponse>('/api/v1/tahsilat-bildirim/simule-et', {
    method: 'POST'
  })
}

export async function planlaTahsilatBildirimleri(): Promise<TahsilatBildirimPlanlaResponse> {
  return apiFetch<TahsilatBildirimPlanlaResponse>('/api/v1/tahsilat-bildirim/planla', {
    method: 'POST'
  })
}

export async function getTahsilatBildirimWhatsAppDurum(): Promise<WhatsAppDurumResponse> {
  return apiFetch<WhatsAppDurumResponse>('/api/v1/tahsilat-bildirim/whatsapp-durum')
}

export type OpenBildirimJobWhatsAppResponse = {
  ok: true
  jobId: string
  deepLinkUrl?: string | null
  telefonMaskeli?: string | null
  durum?: string
}

export async function openBildirimJobWhatsApp(
  jobId: string,
  body?: { mesaj?: string }
): Promise<OpenBildirimJobWhatsAppResponse> {
  return apiFetch<OpenBildirimJobWhatsAppResponse>(
    `/api/v1/tahsilat-bildirim/isler/${encodeURIComponent(jobId)}/whatsapp-ac`,
    {
      method: 'POST',
      body: JSON.stringify(body ?? {})
    }
  )
}

export type MarkBildirimJobGonderildiResponse = {
  ok: true
  jobId: string
  durum?: string
  already?: boolean
}

export async function markBildirimJobGonderildi(jobId: string): Promise<MarkBildirimJobGonderildiResponse> {
  return apiFetch<MarkBildirimJobGonderildiResponse>(
    `/api/v1/tahsilat-bildirim/isler/${encodeURIComponent(jobId)}/gonderildi-isaretle`,
    { method: 'POST' }
  )
}

export function invalidateTahsilatBildirim(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: TAHSILAT_BILDIRIM_QUERY_KEY })
}
