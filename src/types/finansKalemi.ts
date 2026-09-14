export type FinansKalemTuruApi = 'GELIR' | 'GIDER'

export type FinansKalemAktifFilter = 'true' | 'false' | 'all'

export type FinansKalemiDto = {
  id: string
  tur: FinansKalemTuruApi
  kod: string | null
  ad: string
  aktif: boolean
  sistemMi: boolean
  sira: number
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type FinansKalemleriListResponse = {
  ok: true
  items: FinansKalemiDto[]
}

export type FinansKalemiOneResponse = {
  ok: true
  item: FinansKalemiDto
  reactivated?: boolean
}

export type FinansKalemleriReorderResponse = {
  ok: true
  items: FinansKalemiDto[]
}

export type ListFinansKalemleriParams = {
  tur?: FinansKalemTuruApi
  aktif?: FinansKalemAktifFilter
  includeSistem?: boolean
}

export type CreateFinansKalemiPayload = {
  tur: FinansKalemTuruApi
  ad: string
}

export type UpdateFinansKalemiPayload = {
  ad?: string
  sira?: number
}

export type ReorderFinansKalemleriPayload = {
  tur: FinansKalemTuruApi
  orderedIds: string[]
}

export type FinansKalemArchivedDetails = {
  id: string
  ad: string
  tur: FinansKalemTuruApi
}

/** Ofis kasa filtre / rapor — sistem snapshot etiketleri (API listesinde form dışı). */
export const OFIS_KASA_SYSTEM_FILTER_LABELS = [
  'Vekalet Ücreti Tahsilatı',
  'Karşı Taraf Vekalet Ücreti',
  'İcra Vekalet Ücreti',
  'Düzeltme',
  'Döviz dönüşümü'
] as const

export function normalizeFinansKalemAd(ad: string): string {
  return ad.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR')
}

export function isDigerGelirKalemAd(ad: string): boolean {
  return normalizeFinansKalemAd(ad) === normalizeFinansKalemAd('Diğer gelir')
}

export function isDigerGiderKalemAd(ad: string): boolean {
  const n = normalizeFinansKalemAd(ad)
  return (
    n === normalizeFinansKalemAd('Diğer gider') ||
    n === normalizeFinansKalemAd('Diğer') ||
    n === normalizeFinansKalemAd('Diğer masraf')
  )
}
