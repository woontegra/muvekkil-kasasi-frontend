import type { QueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type {
  CreateFinansKalemiPayload,
  FinansKalemAktifFilter,
  FinansKalemTuruApi,
  FinansKalemiOneResponse,
  FinansKalemleriListResponse,
  FinansKalemleriReorderResponse,
  ListFinansKalemleriParams,
  ReorderFinansKalemleriPayload,
  UpdateFinansKalemiPayload
} from '../types/finansKalemi'

export const FINANS_KALEMLERI_QUERY_KEY = ['finans-kalemleri'] as const

export type FinansKalemleriQueryKeyParams = {
  tur?: FinansKalemTuruApi
  aktif?: FinansKalemAktifFilter
  includeSistem?: boolean
}

export function finansKalemleriQueryKey(
  params: FinansKalemleriQueryKeyParams = {}
): readonly [typeof FINANS_KALEMLERI_QUERY_KEY[0], FinansKalemleriQueryKeyParams] {
  return [FINANS_KALEMLERI_QUERY_KEY[0], params]
}

function toQuery(params: ListFinansKalemleriParams): string {
  const sp = new URLSearchParams()
  if (params.tur) sp.set('tur', params.tur)
  if (params.aktif) sp.set('aktif', params.aktif)
  else sp.set('aktif', 'true')
  if (params.includeSistem) sp.set('includeSistem', 'true')
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

export async function listFinansKalemleri(
  params: ListFinansKalemleriParams = {}
): Promise<FinansKalemleriListResponse> {
  return apiFetch<FinansKalemleriListResponse>(`/api/v1/finans-kalemleri${toQuery(params)}`)
}

export async function createFinansKalemi(body: CreateFinansKalemiPayload): Promise<FinansKalemiOneResponse> {
  return apiFetch<FinansKalemiOneResponse>('/api/v1/finans-kalemleri', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function updateFinansKalemi(
  id: string,
  body: UpdateFinansKalemiPayload
): Promise<FinansKalemiOneResponse> {
  return apiFetch<FinansKalemiOneResponse>(`/api/v1/finans-kalemleri/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export async function archiveFinansKalemi(id: string): Promise<FinansKalemiOneResponse> {
  return apiFetch<FinansKalemiOneResponse>(`/api/v1/finans-kalemleri/${encodeURIComponent(id)}/archive`, {
    method: 'POST'
  })
}

export async function activateFinansKalemi(id: string): Promise<FinansKalemiOneResponse> {
  return apiFetch<FinansKalemiOneResponse>(`/api/v1/finans-kalemleri/${encodeURIComponent(id)}/activate`, {
    method: 'POST'
  })
}

export async function reorderFinansKalemleri(
  body: ReorderFinansKalemleriPayload
): Promise<FinansKalemleriReorderResponse> {
  return apiFetch<FinansKalemleriReorderResponse>('/api/v1/finans-kalemleri/reorder', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export function invalidateFinansKalemleri(qc: QueryClient): void {
  void qc.invalidateQueries({ queryKey: FINANS_KALEMLERI_QUERY_KEY })
}
