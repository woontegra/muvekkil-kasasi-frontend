import type { QueryClient } from '@tanstack/react-query'
import {
  getTcmbRates,
  TCMB_CAPRAZ_QUERY_KEY,
  TCMB_RATES_QUERY_KEY,
  TCMB_YAKLASIK_TRY_QUERY_KEY,
  tcmbRatesQueryKey
} from '../api/kurlar'
import type { TcmbRatesAvailableResponse, TcmbRatesResponse } from '../types/kurlar'

export const TCMB_REFRESH_UPDATED_MESSAGE = 'TCMB kurları güncellendi.'
export const TCMB_REFRESH_UNCHANGED_MESSAGE =
  'TCMB kuru kontrol edildi, yayımlanan kurda değişiklik yok.'
export const TCMB_REFRESH_FAILED_MESSAGE =
  'TCMB kurları şu anda yenilenemedi. Son alınan kur gösterilmeye devam ediyor.'

export type TcmbRefreshOutcome =
  | { status: 'updated'; message: string; data: TcmbRatesAvailableResponse }
  | { status: 'unchanged'; message: string; data: TcmbRatesAvailableResponse }
  | { status: 'failed'; message: string }

function fingerprint(snap: TcmbRatesAvailableResponse): string {
  return [
    snap.usdDovizAlis,
    snap.eurDovizAlis,
    snap.effectiveDate,
    snap.bulunanTcmbKurTarihi
  ].join('|')
}

function todayYmd(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Manuel yenileme: backend forceRefresh ile TCMB kaynağını sorgular,
 * üst bar + yaklasik-try sorgularını invalidate eder.
 * Hata/stale’de önceki React Query verisi korunur.
 */
export async function refreshTcmbRatesManually(
  queryClient: QueryClient,
  opts?: { date?: string }
): Promise<TcmbRefreshOutcome> {
  const date = opts?.date ?? todayYmd()
  const key = tcmbRatesQueryKey(date)
  const previous = queryClient.getQueryData<TcmbRatesResponse>(key)

  try {
    const next = await getTcmbRates({ date, forceRefresh: true })
    if (!next.available || next.stale) {
      return { status: 'failed', message: TCMB_REFRESH_FAILED_MESSAGE }
    }

    const prevAvail =
      previous?.available === true ? (previous as TcmbRatesAvailableResponse) : null
    const changed = !prevAvail || fingerprint(prevAvail) !== fingerprint(next)

    queryClient.setQueryData(key, next)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [...TCMB_RATES_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: [...TCMB_CAPRAZ_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: [...TCMB_YAKLASIK_TRY_QUERY_KEY] })
    ])

    if (changed) {
      return { status: 'updated', message: TCMB_REFRESH_UPDATED_MESSAGE, data: next }
    }
    return { status: 'unchanged', message: TCMB_REFRESH_UNCHANGED_MESSAGE, data: next }
  } catch {
    return { status: 'failed', message: TCMB_REFRESH_FAILED_MESSAGE }
  }
}
