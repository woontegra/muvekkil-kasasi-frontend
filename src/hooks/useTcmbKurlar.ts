import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTcmbCapraz,
  getTcmbRates,
  TCMB_AWAITING_TODAY_STALE_MS,
  TCMB_QUERY_STALE_MS,
  TCMB_REFETCH_INTERVAL_MS,
  TCMB_YAKLASIK_TRY_QUERY_KEY,
  tcmbCaprazQueryKey,
  tcmbRatesQueryKey
} from '../api/kurlar'
import type { ParaBirimi } from '../utils/paraBirimi'
import { istanbulTodayYmd } from '../utils/tcmbFormat'
import type { TcmbRatesResponse } from '../types/kurlar'

function ratesStaleTime(data: TcmbRatesResponse | undefined): number {
  if (data?.available && data.fallbackKullanildi && !data.stale) {
    return TCMB_AWAITING_TODAY_STALE_MS
  }
  return TCMB_QUERY_STALE_MS
}

/** Dashboard üst bar — güncel TCMB USD/EUR alış. */
export function useTcmbHeaderRates() {
  const date = istanbulTodayYmd()
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: tcmbRatesQueryKey(date),
    queryFn: async () => {
      const data = await getTcmbRates({ date })
      void queryClient.invalidateQueries({ queryKey: [...TCMB_YAKLASIK_TRY_QUERY_KEY] })
      return data
    },
    staleTime: (q) => ratesStaleTime(q.state.data),
    gcTime: TCMB_QUERY_STALE_MS * 2,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: TCMB_REFETCH_INTERVAL_MS,
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
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1
  })
}
