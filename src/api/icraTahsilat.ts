import { apiFetch } from './client'
import type {
  CreateIcraTahsilatPayload,
  CreateIcraTaksitOdemePayload,
  IcraTahsilatDetayResponse,
  IcraTahsilatListResponse,
  IcraTahsilatOdemeDto,
  ListIcraTahsilatParams,
  PatchIcraTaksitPayload
} from '../types/icraTahsilat'

function toQuery(params: ListIcraTahsilatParams): string {
  const sp = new URLSearchParams()
  if (params.q?.trim()) sp.set('q', params.q.trim())
  if (params.alacakTuru) sp.set('alacakTuru', params.alacakTuru)
  if (params.durum) sp.set('durum', params.durum)
  if (params.tahsilatiYapanPersonelId) sp.set('tahsilatiYapanPersonelId', params.tahsilatiYapanPersonelId)
  if (params.startDate) sp.set('startDate', params.startDate)
  if (params.endDate) sp.set('endDate', params.endDate)
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export async function listIcraTahsilat(params: ListIcraTahsilatParams = {}): Promise<IcraTahsilatListResponse> {
  return apiFetch<IcraTahsilatListResponse>(`/api/v1/icra-tahsilat${toQuery(params)}`)
}

export async function getIcraTahsilat(id: string): Promise<IcraTahsilatDetayResponse> {
  return apiFetch<IcraTahsilatDetayResponse>(`/api/v1/icra-tahsilat/${encodeURIComponent(id)}`)
}

export async function createIcraTahsilat(body: CreateIcraTahsilatPayload): Promise<IcraTahsilatDetayResponse> {
  return apiFetch<IcraTahsilatDetayResponse>('/api/v1/icra-tahsilat', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function iptalIcraTahsilat(id: string): Promise<IcraTahsilatDetayResponse> {
  return apiFetch<IcraTahsilatDetayResponse>(`/api/v1/icra-tahsilat/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ durum: 'IPTAL' })
  })
}

export async function patchIcraTaksit(taksitId: string, body: PatchIcraTaksitPayload): Promise<IcraTahsilatDetayResponse> {
  return apiFetch<IcraTahsilatDetayResponse>(`/api/v1/icra-tahsilat/taksit/${encodeURIComponent(taksitId)}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export async function deleteIcraTaksit(taksitId: string): Promise<IcraTahsilatDetayResponse> {
  return apiFetch<IcraTahsilatDetayResponse>(`/api/v1/icra-tahsilat/taksit/${encodeURIComponent(taksitId)}`, {
    method: 'DELETE'
  })
}

export async function createIcraTaksitOdeme(
  alacakId: string,
  taksitId: string,
  body: CreateIcraTaksitOdemePayload
): Promise<IcraTahsilatDetayResponse> {
  return apiFetch<IcraTahsilatDetayResponse>(
    `/api/v1/icra-tahsilat/${encodeURIComponent(alacakId)}/taksit/${encodeURIComponent(taksitId)}/odeme`,
    { method: 'POST', body: JSON.stringify(body) }
  )
}

export async function listIcraTaksitOdemeler(
  alacakId: string,
  taksitId: string
): Promise<{ ok: true; items: IcraTahsilatOdemeDto[] }> {
  return apiFetch<{ ok: true; items: IcraTahsilatOdemeDto[] }>(
    `/api/v1/icra-tahsilat/${encodeURIComponent(alacakId)}/taksit/${encodeURIComponent(taksitId)}/odemeler`
  )
}

export async function markIcraOdemeSmmKesildi(odemeId: string): Promise<{ ok: true; odeme: IcraTahsilatOdemeDto }> {
  return apiFetch<{ ok: true; odeme: IcraTahsilatOdemeDto }>(
    `/api/v1/icra-tahsilat/odeme/${encodeURIComponent(odemeId)}/smm-kesildi`,
    { method: 'PATCH' }
  )
}
