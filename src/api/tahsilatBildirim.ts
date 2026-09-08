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

export async function assignTahsilatBildirimKuralMetaSablon(
  id: string,
  metaSablonId: string | null
): Promise<{ ok: true; metaSablonId?: string | null; libraryKey?: string | null }> {
  return apiFetch(`/api/v1/tahsilat-bildirim/kurallar/${encodeURIComponent(id)}/meta-sablon`, {
    method: 'PATCH',
    body: JSON.stringify({ metaSablonId })
  })
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

export type KuralTestAdayTaksit = {
  id: string
  taksitNo: number
  vadeTarihi: string
  vadeYmd: string
  tutar: string
  kalanTutar: string
  odemeDurumu: string
  muvekkilAd: string
  dosyaBaslik: string
  dosyaNo: string | null
  label: string
}

export async function listKuralTestAdayTaksitler(
  q?: string
): Promise<{ ok: true; items: KuralTestAdayTaksit[] }> {
  const qs = q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''
  return apiFetch(`/api/v1/tahsilat-bildirim/test-aday-taksitler${qs}`)
}

export type KuralTestOnizlemeResponse = {
  ok: true
  kuralId: string
  kuralTuru: string
  taksit: Record<string, unknown>
  metaSablon: {
    id: string
    metaName: string
    language: string
    statusNormalized: string
    libraryKey: string | null
  } | null
  degiskenler: Record<string, string>
  onizlemeMetin: string | null
  onizlemeEksik: string[]
  templateHazir: boolean
  templateEksik: string[]
  notlar: string[]
}

export async function getKuralTestOnizleme(
  kuralId: string,
  taksitId: string
): Promise<KuralTestOnizlemeResponse> {
  return apiFetch(
    `/api/v1/tahsilat-bildirim/kurallar/${encodeURIComponent(kuralId)}/test-onizleme?taksitId=${encodeURIComponent(taksitId)}`
  )
}

export type KuralTestGonderResponse = {
  ok: boolean
  idempotent?: boolean
  durum?: string
  /** META_KABUL = wamid var; TESLIM_EDILDI = webhook delivered/read */
  deliveryLabel?: 'META_KABUL' | 'TESLIM_EDILDI' | string
  jobId?: string
  providerMessageId?: string | null
  telefonMaskeli?: string | null
  message?: string
  errorCode?: string | null
  webhook?: {
    statusRaw?: string | null
    errorCode?: string | null
    received?: boolean
    overrideActive?: boolean | null
    hasOverrideCallback?: boolean | null
    lastWebhookAt?: string | null
  } | null
  metaError?: {
    httpStatus?: number | null
    message?: string | null
    type?: string | null
    code?: number | string | null
    error_subcode?: number | null
    error_user_title?: string | null
    error_user_msg?: string | null
    details?: string | null
    fbtrace_id?: string | null
  } | null
}

export async function sendKuralTestGonder(
  kuralId: string,
  body: { taksitId: string; testTelefon: string; confirm: true }
): Promise<KuralTestGonderResponse> {
  return apiFetch(`/api/v1/tahsilat-bildirim/kurallar/${encodeURIComponent(kuralId)}/test-gonder`, {
    method: 'POST',
    body: JSON.stringify(body)
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
