import type { QueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type {
  ListTahsilatMerkeziParams,
  ManualWhatsAppPreviewResponse,
  TahsilatMerkeziListResponse,
  TahsilatMerkeziOzetResponse
} from '../types/tahsilatMerkezi'

export const TAKSILAT_MERKEZI_QUERY_KEY = ['tahsilat-merkezi'] as const

function toQuery(params: ListTahsilatMerkeziParams): string {
  const sp = new URLSearchParams()
  if (params.gorunum) sp.set('gorunum', params.gorunum)
  if (params.muvekkilId) sp.set('muvekkilId', params.muvekkilId)
  if (params.dosyaId) sp.set('dosyaId', params.dosyaId)
  if (params.vadeBas) sp.set('vadeBas', params.vadeBas)
  if (params.vadeBit) sp.set('vadeBit', params.vadeBit)
  if (params.durum) sp.set('durum', params.durum)
  if (params.personelId) sp.set('personelId', params.personelId)
  if (params.q) sp.set('q', params.q)
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export async function getTahsilatMerkeziOzet(personelId?: string): Promise<TahsilatMerkeziOzetResponse> {
  const qs = personelId ? `?personelId=${encodeURIComponent(personelId)}` : ''
  return apiFetch<TahsilatMerkeziOzetResponse>(`/api/v1/tahsilat-merkezi/ozet${qs}`)
}

export async function listTahsilatMerkezi(
  params: ListTahsilatMerkeziParams = {}
): Promise<TahsilatMerkeziListResponse> {
  return apiFetch<TahsilatMerkeziListResponse>(`/api/v1/tahsilat-merkezi/liste${toQuery(params)}`)
}

export function invalidateTahsilatMerkezi(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: TAKSILAT_MERKEZI_QUERY_KEY })
}

export async function previewManualWhatsApp(taksitId: string): Promise<ManualWhatsAppPreviewResponse> {
  return apiFetch<ManualWhatsAppPreviewResponse>(
    `/api/v1/tahsilat-merkezi/${encodeURIComponent(taksitId)}/manual-whatsapp/preview`
  )
}

export async function prepareManualWhatsApp(
  taksitId: string,
  body: { mesaj: string; idempotencyKey: string; openDeepLink?: boolean }
): Promise<{
  ok: true
  status: 'READY' | 'DUPLICATE' | 'FAILED'
  jobId?: string
  deepLinkUrl?: string | null
  telefonMaskeli?: string
  message?: string
}> {
  return apiFetch(`/api/v1/tahsilat-merkezi/${encodeURIComponent(taksitId)}/manual-whatsapp/prepare`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export type ManualSmsPreviewResponse = {
  ok?: true
  taksitId: string
  muvekkilAdi: string
  dosyaBilgisi: string
  vadeTarihi: string
  kalanTutar: string
  telefonMaskeli: string | null
  mesaj: string
  smsParcaSayisi: number
  smsKrediTuketimi: number
  bakiye: number
  bakiyeSonrasiTahmini: number
  testModu: boolean
}

export async function previewManualSms(taksitId: string): Promise<ManualSmsPreviewResponse> {
  return apiFetch<ManualSmsPreviewResponse>(
    `/api/v1/tahsilat-merkezi/${encodeURIComponent(taksitId)}/manual-sms/preview`
  )
}

export async function sendManualSms(
  taksitId: string,
  body: { mesaj: string; idempotencyKey: string }
): Promise<{ ok: true; status: string; jobId?: string; message?: string }> {
  return apiFetch(`/api/v1/tahsilat-merkezi/${encodeURIComponent(taksitId)}/manual-sms/send`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}
