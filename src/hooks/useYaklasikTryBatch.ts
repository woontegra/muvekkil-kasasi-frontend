import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  postTcmbYaklasikTry,
  TCMB_QUERY_STALE_MS,
  tcmbYaklasikTryQueryKey
} from '../api/kurlar'
import type { YaklasikTryBatchResponse } from '../types/kurlar'
import type { ParaBirimi } from '../utils/paraBirimi'

export type YaklasikTryItemInput = { key: string; tutar: string | number }

/**
 * Tek TCMB yaklasik-try isteği — özet + tüm taksit tutar/kalan anahtarları.
 * TRY borçta çağrı yapılmaz.
 */
export function useYaklasikTryBatch(
  paraBirimi: ParaBirimi,
  items: YaklasikTryItemInput[],
  enabled = true
) {
  const stableItems = useMemo(() => {
    return items
      .filter((i) => i.key)
      .map((i) => ({ key: i.key, tutar: String(i.tutar ?? '0') }))
  }, [items])

  const itemsKey = useMemo(
    () => stableItems.map((i) => `${i.key}:${i.tutar}`).join('|'),
    [stableItems]
  )

  const needs = paraBirimi === 'USD' || paraBirimi === 'EUR'

  return useQuery({
    queryKey: [...tcmbYaklasikTryQueryKey(paraBirimi), itemsKey],
    queryFn: () => postTcmbYaklasikTry({ paraBirimi, items: stableItems }),
    enabled: enabled && needs && stableItems.length > 0,
    staleTime: TCMB_QUERY_STALE_MS,
    retry: 1
  })
}

export function yaklasikByKey(
  data: YaklasikTryBatchResponse | undefined,
  key: string
): {
  satirEtiket: string | null
  gosterim: string | null
  unavailable: boolean
  kurBilgiSatiri: string | null
} {
  if (!data) {
    return { satirEtiket: null, gosterim: null, unavailable: false, kurBilgiSatiri: null }
  }
  if (!data.available) {
    const item = data.items.find((i) => i.key === key)
    return {
      satirEtiket: item?.satirEtiket ?? data.message,
      gosterim: null,
      unavailable: true,
      kurBilgiSatiri: null
    }
  }
  const item = data.items.find((i) => i.key === key)
  return {
    satirEtiket: item?.satirEtiket ?? null,
    gosterim: item?.yaklasikTryGosterim ?? null,
    unavailable: false,
    kurBilgiSatiri: data.kurBilgiSatiri
  }
}
