import { apiFetch } from './client'
import type { CreatePrimPersonelPayload, PrimPersonelDto, PrimPersonelLinkUserDto, UpdatePrimPersonelPayload } from '../types/primPersonel'

export async function listPrimPersoneller(params?: {
  q?: string
  aktifMi?: boolean
  page?: number
  limit?: number
}): Promise<{ ok: true; items: PrimPersonelDto[]; total: number; page: number; limit: number }> {
  const sp = new URLSearchParams()
  if (params?.q) sp.set('q', params.q)
  if (params?.aktifMi !== undefined) sp.set('aktifMi', String(params.aktifMi))
  if (params?.page) sp.set('page', String(params.page))
  if (params?.limit) sp.set('limit', String(params.limit))
  const qs = sp.toString()
  return apiFetch(`/api/v1/prim-personel${qs ? `?${qs}` : ''}`)
}

export async function listAktifPrimPersonel(): Promise<{ ok: true; items: PrimPersonelDto[] }> {
  return apiFetch('/api/v1/prim-personel/aktif')
}

export async function getBagliPrimPersonel(): Promise<{ ok: true; personel: PrimPersonelDto | null }> {
  return apiFetch('/api/v1/prim-personel/bagli-ben')
}

export async function listPrimPersonelLinkKullanicilar(
  exceptPersonelId?: string
): Promise<{ ok: true; items: PrimPersonelLinkUserDto[] }> {
  const sp = new URLSearchParams()
  if (exceptPersonelId) sp.set('exceptPersonelId', exceptPersonelId)
  const qs = sp.toString()
  return apiFetch(`/api/v1/prim-personel/link-kullanicilar${qs ? `?${qs}` : ''}`)
}

export async function getPrimPersonel(id: string): Promise<{ ok: true; personel: PrimPersonelDto }> {
  return apiFetch(`/api/v1/prim-personel/${encodeURIComponent(id)}`)
}

export async function createPrimPersonel(
  body: CreatePrimPersonelPayload
): Promise<{ ok: true; personel: PrimPersonelDto; duplicateNameWarning?: boolean }> {
  return apiFetch('/api/v1/prim-personel', { method: 'POST', body: JSON.stringify(body) })
}

export async function updatePrimPersonel(
  id: string,
  body: UpdatePrimPersonelPayload
): Promise<{ ok: true; personel: PrimPersonelDto }> {
  return apiFetch(`/api/v1/prim-personel/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}
