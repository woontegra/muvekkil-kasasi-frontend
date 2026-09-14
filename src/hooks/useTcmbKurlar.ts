import { useQuery } from '@tanstack/react-query'
import {
  getTcmbCapraz,
  getTcmbRates,
  TCMB_QUERY_STALE_MS,
  tcmbCaprazQueryKey,
  tcmbRatesQueryKey
} from '../api/kurlar'
import type { ParaBirimi } from '../utils/paraBirimi'
import type { TcmbRatesResponse } from '../types/kurlar'

/** Bugünün bülteni henüz yokken (fallback, stale değil) kısa istemci cache. */
const TCMB_AWAITING_TODAY_STALE_MS = 20 * 60 * 1000

function todayYmd(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function ratesStaleTime(data: TcmbRatesResponse | undefined): number {
  if (data?.available && data.fallbackKullanildi && !data.stale) {
    return TCMB_AWAITING_TODAY_STALE_MS
  }
  return TCMB_QUERY_STALE_MS
}

/** Dashboard üst bar — güncel TCMB USD/EUR alış. */
export function useTcmbHeaderRates() {
  const date = todayYmd()
  return useQuery({
    queryKey: tcmbRatesQueryKey(date),
    queryFn: () => getTcmbRates({ date }),
    staleTime: (q) => ratesStaleTime(q.state.data),
    gcTime: TCMB_QUERY_STALE_MS * 2,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1
  })
}

/** Ödeme / döviz formları — çapraz kur (baz → karşı). */
export function useTcmbCaprazKur(
  baz: ParaBirimi,
  karsi: ParaBirimi,
  date: string,
  enabled = true
) {
  const active = enabled && baz !== karsi && Boolean(date)
  return useQuery({
    queryKey: tcmbCaprazQueryKey(baz, karsi, date),
    queryFn: () => getTcmbCapraz({ baz, karsi, date }),
    enabled: active,
    staleTime: TCMB_QUERY_STALE_MS,
    gcTime: TCMB_QUERY_STALE_MS * 2,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: 1
  })
}
