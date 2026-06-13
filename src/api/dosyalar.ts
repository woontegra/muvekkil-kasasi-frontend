import { apiFetch } from './client'
import type {
  CreateDosyaPayload,
  DosyaCreateResponse,
  DosyaDto,
  DosyaDurumuApi,
  DosyaListResponse,
  DosyaOneResponse,
  DosyaTuruApi,
  UpdateDosyaPayload
} from '../types/dosya'
export type ListMuvekkilDosyalariParams = {
  q?: string
  durum?: DosyaDurumuApi
  dosyaTuru?: DosyaTuruApi
  page?: number
  limit?: number
}

function buildListQuery(params: ListMuvekkilDosyalariParams): string {
  const sp = new URLSearchParams()
  if (params.q?.trim()) sp.set('q', params.q.trim())
  if (params.durum) sp.set('durum', params.durum)
  if (params.dosyaTuru) sp.set('dosyaTuru', params.dosyaTuru)
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export async function listMuvekkilDosyalari(
  muvekkilId: string,
  params: ListMuvekkilDosyalariParams = {}
): Promise<DosyaListResponse> {
  return apiFetch<DosyaListResponse>(
    `/api/v1/muvekkiller/${encodeURIComponent(muvekkilId)}/dosyalar${buildListQuery(params)}`
  )
}

export async function createDosya(muvekkilId: string, body: CreateDosyaPayload): Promise<DosyaDto> {
  const r = await apiFetch<DosyaCreateResponse>(`/api/v1/muvekkiller/${encodeURIComponent(muvekkilId)}/dosyalar`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
  return r.dosya
}

export async function getDosya(id: string): Promise<DosyaOneResponse> {
  return apiFetch<DosyaOneResponse>(`/api/v1/dosyalar/${encodeURIComponent(id)}`)
}

export async function updateDosya(id: string, body: UpdateDosyaPayload): Promise<DosyaDto> {
  const r = await apiFetch<DosyaCreateResponse>(`/api/v1/dosyalar/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
  return r.dosya
}

export async function deactivateDosya(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/dosyalar/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}
