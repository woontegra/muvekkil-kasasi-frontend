import { apiFetch } from './client'
import type { ParaBirimi } from '../utils/paraBirimi'
import type { TcmbCaprazResponse, TcmbRatesResponse } from '../types/kurlar'

/** Backend TCMB cache TTL ile hizalı (~6 saat). */
export const TCMB_QUERY_STALE_MS = 6 * 60 * 60 * 1000

export const TCMB_RATES_QUERY_KEY = ['tcmb-rates'] as const
export const TCMB_CAPRAZ_QUERY_KEY = ['tcmb-capraz'] as const

export function tcmbRatesQueryKey(date?: string): readonly [typeof TCMB_RATES_QUERY_KEY[0], string] {
  return [TCMB_RATES_QUERY_KEY[0], date ?? 'today']
}

export function tcmbCaprazQueryKey(
  baz: ParaBirimi,
  karsi: ParaBirimi,
  date?: string
): readonly [typeof TCMB_CAPRAZ_QUERY_KEY[0], ParaBirimi, ParaBirimi, string] {
  return [TCMB_CAPRAZ_QUERY_KEY[0], baz, karsi, date ?? 'today']
}

export type GetTcmbRatesParams = {
  date?: string
  /** true → backend bellek cache’ini atlar, TCMB’yi yeniden sorgular */
  forceRefresh?: boolean
}

export async function getTcmbRates(params?: GetTcmbRatesParams): Promise<TcmbRatesResponse> {
  const search = new URLSearchParams()
  if (params?.date) search.set('date', params.date)
  if (params?.forceRefresh) search.set('forceRefresh', 'true')
  const qs = search.toString() ? `?${search.toString()}` : ''
  return apiFetch<TcmbRatesResponse>(`/api/v1/kurlar/tcmb${qs}`)
}

export type GetTcmbCaprazParams = {
  baz: ParaBirimi
  karsi: ParaBirimi
  date?: string
}

export async function getTcmbCapraz(params: GetTcmbCaprazParams): Promise<TcmbCaprazResponse> {
  const search = new URLSearchParams({
    baz: params.baz,
    karsi: params.karsi
  })
  if (params.date) search.set('date', params.date)
  return apiFetch<TcmbCaprazResponse>(`/api/v1/kurlar/tcmb/capraz?${search.toString()}`)
}

export const TCMB_YAKLASIK_TRY_QUERY_KEY = ['tcmb-yaklasik-try'] as const

export function tcmbYaklasikTryQueryKey(
  paraBirimi: ParaBirimi,
  date?: string
): readonly [typeof TCMB_YAKLASIK_TRY_QUERY_KEY[0], ParaBirimi, string] {
  return [TCMB_YAKLASIK_TRY_QUERY_KEY[0], paraBirimi, date ?? 'today']
}

export type PostYaklasikTryParams = {
  paraBirimi: ParaBirimi
  items: Array<{ key: string; tutar: string | number }>
  date?: string
}

export async function postTcmbYaklasikTry(
  params: PostYaklasikTryParams
): Promise<import('../types/kurlar').YaklasikTryBatchResponse> {
  return apiFetch(`/api/v1/kurlar/tcmb/yaklasik-try`, {
    method: 'POST',
    body: JSON.stringify(params)
  })
}

export type PostCaprazHesapParams = {
  alacakParaBirimi: ParaBirimi
  odemeParaBirimi: ParaBirimi
  mahsupTutari?: string | number
  kasaTutari?: string | number
  uygulanacakKur?: string | number
  lastEdited: 'mahsup' | 'kasa' | 'kur'
}

export async function postCaprazHesap(
  params: PostCaprazHesapParams
): Promise<import('../types/kurlar').CaprazHesapResponse> {
  return apiFetch(`/api/v1/kurlar/capraz-hesap`, {
    method: 'POST',
    body: JSON.stringify(params)
  })
}
