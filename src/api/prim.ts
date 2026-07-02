import { apiFetch } from './client'
import type {
  CreatePrimKuralPayload,
  PersonelPanelDetayParams,
  PersonelPrimOzetDto,
  PersonelPrimPanelDto,
  PrimKuralDto,
  PrimRaporDetayDto,
  PrimRaporQueryParams,
  PrimRaporSatirDto,
  UpdatePrimKuralPayload
} from '../types/prim'

function buildQuery(params: PrimRaporQueryParams): string {
  const sp = new URLSearchParams()
  sp.set('yil', String(params.yil))
  sp.set('ay', String(params.ay))
  if (params.userId) sp.set('userId', params.userId)
  if (params.primPersonelId) sp.set('primPersonelId', params.primPersonelId)
  if (params.tahsilatTuru) sp.set('tahsilatTuru', params.tahsilatTuru)
  return `?${sp.toString()}`
}

export async function listPrimKurallari(): Promise<{ ok: true; items: PrimKuralDto[] }> {
  return apiFetch('/api/v1/prim/kurallar')
}

export async function createPrimKurali(body: CreatePrimKuralPayload): Promise<{ ok: true; kural: PrimKuralDto }> {
  return apiFetch('/api/v1/prim/kurallar', { method: 'POST', body: JSON.stringify(body) })
}

export async function updatePrimKurali(id: string, body: UpdatePrimKuralPayload): Promise<{ ok: true; kural: PrimKuralDto }> {
  return apiFetch(`/api/v1/prim/kurallar/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(body) })
}

export async function pasifPrimKurali(id: string): Promise<{ ok: true; kural: PrimKuralDto }> {
  return apiFetch(`/api/v1/prim/kurallar/${encodeURIComponent(id)}/pasif`, { method: 'POST' })
}

export async function listPrimRapor(params: PrimRaporQueryParams): Promise<{ ok: true; items: PrimRaporSatirDto[] }> {
  return apiFetch(`/api/v1/prim/rapor${buildQuery(params)}`)
}

export async function hesaplaPrimRapor(body: PrimRaporQueryParams): Promise<{ ok: true; items: PrimRaporSatirDto[] }> {
  return apiFetch('/api/v1/prim/rapor/hesapla', { method: 'POST', body: JSON.stringify(body) })
}

export async function getPrimRaporDetay(primDonemId: string): Promise<{ ok: true; detay: PrimRaporDetayDto }> {
  return apiFetch(`/api/v1/prim/rapor/${encodeURIComponent(primDonemId)}/detay`)
}

export async function markPrimOdendi(primDonemId: string, not?: string | null): Promise<{ ok: true }> {
  return apiFetch(`/api/v1/prim/rapor/${encodeURIComponent(primDonemId)}/odendi`, {
    method: 'POST',
    body: JSON.stringify({ not: not ?? null })
  })
}

function buildPersonelPanelQuery(params: PersonelPanelDetayParams): string {
  const sp = new URLSearchParams()
  sp.set('yil', String(params.yil))
  sp.set('ay', String(params.ay))
  if (params.tahsilatTuru) sp.set('tahsilatTuru', params.tahsilatTuru)
  if (params.onayDurumu) sp.set('onayDurumu', params.onayDurumu)
  if (params.includeNonPremium) sp.set('includeNonPremium', 'true')
  if (params.sadecePrimDahil === false) sp.set('sadecePrimDahil', 'false')
  return `?${sp.toString()}`
}

export async function listPersonelPrimOzet(
  yil: number,
  ay: number
): Promise<{ ok: true; items: PersonelPrimOzetDto[] }> {
  const sp = new URLSearchParams({ yil: String(yil), ay: String(ay) })
  return apiFetch(`/api/v1/prim/personel-ozet?${sp.toString()}`)
}

export async function getPersonelPrimPanel(
  primPersonelId: string,
  params: PersonelPanelDetayParams
): Promise<{ ok: true; panel: PersonelPrimPanelDto }> {
  return apiFetch(`/api/v1/prim/personel/${encodeURIComponent(primPersonelId)}/panel${buildPersonelPanelQuery(params)}`)
}
