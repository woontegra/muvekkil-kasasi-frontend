import { apiFetch } from './client'
import type {
  CreateOfisKasaDovizDonusumPayload,
  CreateOfisKasaDuzeltmePayload,
  CreateOfisKasaHareketiPayload,
  ListOfisKasaHareketleriParams,
  OfisKasaDovizDonusumResponse,
  OfisKasaHareketleriListResponse,
  OfisKasaHareketOneResponse,
  OfisKasaOzetResponse
} from '../types/ofisKasasi'

function toQuery(params: ListOfisKasaHareketleriParams): string {
  const sp = new URLSearchParams()
  if (params.q?.trim()) sp.set('q', params.q.trim())
  if (params.muvekkilId?.trim()) sp.set('muvekkilId', params.muvekkilId.trim())
  if (params.islemTipi) sp.set('islemTipi', params.islemTipi)
  if (params.onayDurumu) sp.set('onayDurumu', params.onayDurumu)
  if (params.kategori?.trim()) sp.set('kategori', params.kategori.trim())
  if (params.paraBirimi) sp.set('paraBirimi', params.paraBirimi)
  if (params.startDate) sp.set('startDate', params.startDate)
  if (params.endDate) sp.set('endDate', params.endDate)
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export async function listOfisKasaHareketleri(
  params: ListOfisKasaHareketleriParams = {}
): Promise<OfisKasaHareketleriListResponse> {
  return apiFetch<OfisKasaHareketleriListResponse>(`/api/v1/ofis-kasasi/hareketler${toQuery(params)}`)
}

export async function getOfisKasaOzet(): Promise<OfisKasaOzetResponse> {
  return apiFetch<OfisKasaOzetResponse>('/api/v1/ofis-kasasi/ozet')
}

export async function createOfisKasaHareketi(body: CreateOfisKasaHareketiPayload): Promise<OfisKasaHareketOneResponse> {
  return apiFetch<OfisKasaHareketOneResponse>('/api/v1/ofis-kasasi/hareketler', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function createOfisKasaDovizDonusum(
  body: CreateOfisKasaDovizDonusumPayload
): Promise<OfisKasaDovizDonusumResponse> {
  return apiFetch<OfisKasaDovizDonusumResponse>('/api/v1/ofis-kasasi/doviz-donusum', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function deleteOfisKasaDovizDonusum(dovizDonusumId: string): Promise<void> {
  await apiFetch<void>(`/api/v1/ofis-kasasi/doviz-donusum/${encodeURIComponent(dovizDonusumId)}`, {
    method: 'DELETE'
  })
}

export async function approveOfisKasaHareketi(id: string): Promise<OfisKasaHareketOneResponse> {
  return apiFetch<OfisKasaHareketOneResponse>(`/api/v1/ofis-kasasi/hareketler/${encodeURIComponent(id)}/onayla`, {
    method: 'POST'
  })
}

export async function rejectOfisKasaHareketi(id: string, redSebebi: string): Promise<OfisKasaHareketOneResponse> {
  return apiFetch<OfisKasaHareketOneResponse>(`/api/v1/ofis-kasasi/hareketler/${encodeURIComponent(id)}/reddet`, {
    method: 'POST',
    body: JSON.stringify({ redSebebi })
  })
}

export async function createOfisKasaDuzeltme(
  id: string,
  body: CreateOfisKasaDuzeltmePayload
): Promise<OfisKasaHareketOneResponse> {
  return apiFetch<OfisKasaHareketOneResponse>(`/api/v1/ofis-kasasi/hareketler/${encodeURIComponent(id)}/duzeltme`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function deleteOfisKasaHareketi(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/ofis-kasasi/hareketler/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}

export type GuvenliOfisGiderSilPayload = {
  sifre: string
  deleteReason: string
}

export type GuvenliOfisGiderSilResponse = {
  ok: true
  message: string
  softDeletedIds: string[]
  auditMessage: string
  mode?: 'GIDER_SIL' | 'GELIR_SIL' | 'TAHSILAT_IPTAL'
  alreadyDone?: boolean
}

export async function guvenliOfisGiderSil(
  id: string,
  payload: GuvenliOfisGiderSilPayload
): Promise<GuvenliOfisGiderSilResponse> {
  return apiFetch<GuvenliOfisGiderSilResponse>(
    `/api/v1/ofis-kasasi/hareketler/${encodeURIComponent(id)}/guvenli-sil`,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  )
}
