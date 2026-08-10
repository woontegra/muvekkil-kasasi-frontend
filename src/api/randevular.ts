import { apiFetch } from './client'
import type {
  RandevuListResponse,
  RandevuOneResponse,
  RandevuWritePayload
} from '../types/randevu'

export type ListRandevularParams = {
  baslangic: string
  bitis: string
  muvekkilId?: string
  sorumluUserId?: string
}

function buildQuery(params: ListRandevularParams): string {
  const sp = new URLSearchParams()
  sp.set('baslangic', params.baslangic)
  sp.set('bitis', params.bitis)
  if (params.muvekkilId) sp.set('muvekkilId', params.muvekkilId)
  if (params.sorumluUserId) sp.set('sorumluUserId', params.sorumluUserId)
  return `?${sp.toString()}`
}

export async function listRandevular(params: ListRandevularParams): Promise<RandevuListResponse> {
  return apiFetch<RandevuListResponse>(`/api/v1/randevular${buildQuery(params)}`)
}

export async function getRandevu(id: string): Promise<RandevuOneResponse> {
  return apiFetch<RandevuOneResponse>(`/api/v1/randevular/${encodeURIComponent(id)}`)
}

export async function createRandevu(body: RandevuWritePayload): Promise<RandevuOneResponse> {
  return apiFetch<RandevuOneResponse>('/api/v1/randevular', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function updateRandevu(id: string, body: RandevuWritePayload): Promise<RandevuOneResponse> {
  return apiFetch<RandevuOneResponse>(`/api/v1/randevular/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export async function deleteRandevu(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/randevular/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export const RANDEVULAR_QUERY_KEY = ['randevular'] as const
