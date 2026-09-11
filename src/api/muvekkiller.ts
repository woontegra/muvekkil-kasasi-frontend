import { apiFetch } from './client'
import type { OfisKasaHareketleriListResponse } from '../types/ofisKasasi'
import type {
  CreateMuvekkilPayload,
  MuvekkilCreateResponse,
  MuvekkilDto,
  MuvekkilListResponse,
  MuvekkilOneResponse,
  MuvekkilTurApi
} from '../types/muvekkil'

export type ListMuvekkilOfisGelirleriParams = {
  page?: number
  limit?: number
}

export type ListMuvekkillerParams = {
  q?: string
  tur?: MuvekkilTurApi
  otomatikHatirlatma?: 'TUMU' | 'ACIK' | 'KAPALI'
  page?: number
  limit?: number
}

function buildQuery(params: ListMuvekkillerParams): string {
  const sp = new URLSearchParams()
  if (params.q?.trim()) sp.set('q', params.q.trim())
  if (params.tur) sp.set('tur', params.tur)
  if (params.otomatikHatirlatma && params.otomatikHatirlatma !== 'TUMU') {
    sp.set('otomatikHatirlatma', params.otomatikHatirlatma)
  }
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export async function listMuvekkiller(params: ListMuvekkillerParams = {}): Promise<MuvekkilListResponse> {
  return apiFetch<MuvekkilListResponse>(`/api/v1/muvekkiller${buildQuery(params)}`)
}

export async function getMuvekkil(id: string): Promise<MuvekkilDto> {
  const r = await apiFetch<MuvekkilOneResponse>(`/api/v1/muvekkiller/${encodeURIComponent(id)}`)
  return r.muvekkil
}

export async function createMuvekkil(body: CreateMuvekkilPayload): Promise<MuvekkilDto> {
  const r = await apiFetch<MuvekkilCreateResponse>('/api/v1/muvekkiller', {
    method: 'POST',
    body: JSON.stringify(body)
  })
  return r.muvekkil
}

export async function updateMuvekkil(id: string, body: CreateMuvekkilPayload): Promise<MuvekkilDto> {
  const r = await apiFetch<MuvekkilCreateResponse>(`/api/v1/muvekkiller/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
  return r.muvekkil
}

export async function deactivateMuvekkil(id: string): Promise<void> {
  await apiFetch<void>(`/api/v1/muvekkiller/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}

function buildOfisGelirleriQuery(params: ListMuvekkilOfisGelirleriParams): string {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export async function listMuvekkilOfisGelirleri(
  muvekkilId: string,
  params: ListMuvekkilOfisGelirleriParams = {}
): Promise<OfisKasaHareketleriListResponse> {
  return apiFetch<OfisKasaHareketleriListResponse>(
    `/api/v1/muvekkiller/${encodeURIComponent(muvekkilId)}/ofis-gelirleri${buildOfisGelirleriQuery(params)}`
  )
}
