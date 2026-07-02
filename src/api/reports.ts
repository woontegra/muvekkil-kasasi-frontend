import { apiFetch } from './client'
import type {
  IcraTahsilatReportQuery,
  IcraTahsilatReportResponse,
  OfisKasaReportQuery,
  OfisKasaReportResponse
} from '../types/reports'

function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== '') sp.set(k, v)
  }
  const q = sp.toString()
  return q ? `?${q}` : ''
}

export async function fetchOfisKasaReport(query: OfisKasaReportQuery): Promise<OfisKasaReportResponse> {
  return apiFetch<OfisKasaReportResponse>(
    `/api/v1/reports/ofis-kasa${buildQuery({
      startDate: query.startDate,
      endDate: query.endDate,
      islemTipi: query.islemTipi,
      kategori: query.kategori,
      onayDurumu: query.onayDurumu,
      q: query.q
    })}`
  )
}

export async function fetchIcraTahsilatReport(query: IcraTahsilatReportQuery): Promise<IcraTahsilatReportResponse> {
  return apiFetch<IcraTahsilatReportResponse>(
    `/api/v1/reports/icra-tahsilat${buildQuery({
      startDate: query.startDate,
      endDate: query.endDate,
      alacakTuru: query.alacakTuru,
      durum: query.durum,
      tahsilatiYapanPersonelId: query.tahsilatiYapanPersonelId,
      q: query.q
    })}`
  )
}
