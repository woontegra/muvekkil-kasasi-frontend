import { apiFetch } from './client'
import type {
  CreateDuzeltmePayload,
  CreateKasaHareketiPayload,
  KasaHareketleriListResponse,
  KasaHareketOneResponse,
  KasaOzetResponse
} from '../types/kasa'

export type ListKasaHareketleriParams = {
  q?: string
  tip?: string
  onayDurumu?: string
  page?: number
  limit?: number
}

function buildListQuery(params: ListKasaHareketleriParams): string {
  const sp = new URLSearchParams()
  if (params.q?.trim()) sp.set('q', params.q.trim())
  if (params.tip) sp.set('tip', params.tip)
  if (params.onayDurumu) sp.set('onayDurumu', params.onayDurumu)
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export async function listKasaHareketleri(
  dosyaId: string,
  params: ListKasaHareketleriParams = {}
): Promise<KasaHareketleriListResponse> {
  return apiFetch<KasaHareketleriListResponse>(
    `/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/kasa-hareketleri${buildListQuery(params)}`
  )
}

export async function createKasaHareketi(
  dosyaId: string,
  payload: CreateKasaHareketiPayload
): Promise<KasaHareketOneResponse> {
  return apiFetch<KasaHareketOneResponse>(`/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/kasa-hareketleri`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function approveKasaHareketi(id: string): Promise<KasaHareketOneResponse> {
  return apiFetch<KasaHareketOneResponse>(`/api/v1/kasa-hareketleri/${encodeURIComponent(id)}/onayla`, {
    method: 'POST',
    body: JSON.stringify({})
  })
}

export async function rejectKasaHareketi(id: string, redSebebi: string): Promise<KasaHareketOneResponse> {
  return apiFetch<KasaHareketOneResponse>(`/api/v1/kasa-hareketleri/${encodeURIComponent(id)}/reddet`, {
    method: 'POST',
    body: JSON.stringify({ redSebebi })
  })
}

export async function createDuzeltme(id: string, payload: CreateDuzeltmePayload): Promise<KasaHareketOneResponse> {
  return apiFetch<KasaHareketOneResponse>(`/api/v1/kasa-hareketleri/${encodeURIComponent(id)}/duzeltme`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function deleteKasaHareketi(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/kasa-hareketleri/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}

export async function getKasaOzet(dosyaId: string): Promise<KasaOzetResponse> {
  return apiFetch<KasaOzetResponse>(`/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/kasa-ozet`)
}
